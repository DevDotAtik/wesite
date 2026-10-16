import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/db";

export const AUTH_COOKIE = "wesite_token";

type JwtPayload = {
  userId: string;
  email: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signAuthToken(payload: JwtPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "30d" });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}

export async function getAuthUser(request: NextRequest) {
  // 1. Try Bearer token from Authorization header first (explicit client auth)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const headerToken = authHeader.slice(7).trim();
    if (headerToken) {
      try {
        const payload = verifyAuthToken(headerToken);
        await connectToDatabase();
        const user = await User.findById(payload.userId)
          .select("-passwordHash -resetTokenHash -twoFactorSecret -twoFactorRecoveryCodes")
          .lean();
        if (user) return user;
      } catch {
        // Fall through to cookie check
      }
    }
  }

  // 2. Fallback to HTTP-only cookie
  const cookieToken = request.cookies.get(AUTH_COOKIE)?.value;
  if (cookieToken) {
    try {
      const payload = verifyAuthToken(cookieToken);
      await connectToDatabase();
      const user = await User.findById(payload.userId)
        .select("-passwordHash -resetTokenHash -twoFactorSecret -twoFactorRecoveryCodes")
        .lean();
      if (user) return user;
    } catch {
      return null;
    }
  }

  return null;
}

export function isSecureContext(request?: NextRequest): boolean {
  if (!request) {
    return process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";
  }
  const proto = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol;
  return proto.includes("https");
}

export function authCookieOptions(request?: NextRequest) {
  const isHttps = request
    ? isSecureContext(request)
    : process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isHttps,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
