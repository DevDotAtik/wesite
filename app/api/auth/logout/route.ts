import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, authCookieOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  // Clear with the same path/sameSite/secure attributes used when setting,
  // otherwise browsers keep the original cookie.
  response.cookies.set(AUTH_COOKIE, "", { ...authCookieOptions(request), maxAge: 0 });
  return response;
}
