/**
 * Shared client-side authentication utility for WeSite
 * Handles Bearer token from localStorage alongside HTTP cookies.
 */

export const AUTH_STORAGE_KEY = "wesite_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, token);
  } catch {}
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {}
}

export function getAuthHeaders(extra?: HeadersInit): HeadersInit {
  const token = getAuthToken();
  const headers = new Headers(extra || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

/**
 * Enhanced fetch wrapper that:
 * 1. Attaches Authorization: Bearer <token> if available in localStorage
 * 2. Sets credentials: "include" so cookies are always transmitted
 * 3. Sets cache: "no-store" so dynamic data isn't stale or cached by browser/router
 */
export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = getAuthHeaders(init?.headers);

  return fetch(input, {
    ...init,
    headers,
    credentials: init?.credentials ?? "include",
    cache: init?.cache ?? "no-store",
  });
}
