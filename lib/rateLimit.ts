import type { NextRequest } from "next/server";
import { apiError } from "./api";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

// Periodic cleanup every 60 seconds to prevent memory exhaustion
const CLEANUP_INTERVAL_MS = 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of store.entries()) {
    if (record.resetAt <= now) {
      store.delete(key);
    }
  }

  // Safety ceiling: prevent unbounded map size in worst case
  if (store.size > 20000) {
    store.clear();
  }
}

/**
 * Extract client IP from headers safely.
 */
export function getClientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    // Take the left-most IP (client IP before proxies)
    const clientIp = xForwardedFor.split(",")[0].trim();
    if (clientIp) return clientIp;
  }

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

/**
 * Sliding window rate limiter.
 * @param key Unique identifier (e.g. `login:192.168.1.1` or `forgot:user@example.com`)
 * @param maxRequests Maximum number of requests allowed within window
 * @param windowSeconds Time window in seconds
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
): { allowed: boolean; remaining: number; resetSeconds: number } {
  cleanupExpired();

  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetSeconds: windowSeconds,
    };
  }

  if (existing.count >= maxRequests) {
    const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
    };
  }

  existing.count += 1;
  const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetSeconds,
  };
}

/**
 * Helper to check rate limit and return standard 429 response if exceeded.
 */
export function enforceRateLimit(
  request: NextRequest,
  actionKey: string,
  maxRequests: number,
  windowSeconds: number,
) {
  const ip = getClientIp(request);
  const key = `${actionKey}:${ip}`;
  const result = rateLimit(key, maxRequests, windowSeconds);

  if (!result.allowed) {
    return apiError(
      `Too many requests. Please try again in ${result.resetSeconds} seconds.`,
      429,
      { retryAfter: result.resetSeconds },
    );
  }

  return null;
}
