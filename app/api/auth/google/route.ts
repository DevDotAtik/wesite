import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { authCookieOptions, AUTH_COOKIE, signAuthToken } from "@/lib/auth";
import { apiError, parseBody, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { googleAuthSchema } from "@/lib/validators/schemas";
import User from "@/models/User";

function getGoogleClientId() {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  return clientId;
}

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, googleAuthSchema);

  if (error) {
    return error;
  }

  let clientId: string;

  try {
    clientId = getGoogleClientId();
  } catch {
    return apiError("Google sign-in is not configured on the server", 500);
  }

  const client = new OAuth2Client(clientId);

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: data.idToken,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    return apiError("Invalid Google credential", 401);
  }

  if (!payload?.sub || !payload.email) {
    return apiError("Invalid Google credential", 401);
  }

  if (payload.aud !== clientId) {
    return apiError("Google credential was issued for a different app", 401);
  }

  await connectToDatabase();

  const email = payload.email.toLowerCase();
  const googleId = payload.sub;
  const name = payload.name || email.split("@")[0] || "Google User";
  const avatarUrl = payload.picture || "";

  // 1. Returning Google user → log them in.
  let user = await User.findOne({ googleId });

  // 2. Existing email/password account with the same email → link Google to it.
  if (!user) {
    user = await User.findOne({ email });

    if (user) {
      user.googleId = googleId;
      user.emailVerified = payload.email_verified ?? true;
      if (!user.avatarUrl && avatarUrl) {
        user.avatarUrl = avatarUrl;
      }
      if (!user.name && name) {
        user.name = name;
      }
      await user.save();
    }
  }

  // 3. Brand-new user → create a Google-backed account (no password).
  if (!user) {
    user = await User.create({
      name: name.slice(0, 80),
      email,
      passwordHash: null,
      googleId,
      authProvider: "google",
      emailVerified: payload.email_verified ?? true,
      avatarUrl,
    });
  }

  const token = signAuthToken({ userId: user._id.toString(), email: user.email });
  const safeUser = serializeDocument({
    ...user.toObject(),
    passwordHash: undefined,
    resetTokenHash: undefined,
  });

  const response = NextResponse.json({ user: safeUser });
  response.cookies.set(AUTH_COOKIE, token, authCookieOptions());
  return response;
}
