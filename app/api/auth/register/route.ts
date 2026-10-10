import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authCookieOptions, AUTH_COOKIE, hashPassword, signAuthToken } from "@/lib/auth";
import { apiError, parseBody, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { registerSchema } from "@/lib/validators/schemas";
import {
  encryptSecret,
  verifyRegistrationSetupToken,
  verifyTwoFactorCode,
} from "@/lib/totp";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const { data, error } = await parseBody(request, registerSchema);

    if (error) {
      return error;
    }

    await connectToDatabase();

    let name = data.name;
    let email = data.email;
    let passwordHash: string | null = null;
    let twoFactorEnabled = false;
    let twoFactorSecret: string | null = null;
    let twoFactorRecoveryCodes: string[] = [];

    // Case 1: Finalizing registration with 2FA setup token
    if (data.setupToken) {
      let setupPayload;
      try {
        setupPayload = verifyRegistrationSetupToken(data.setupToken);
      } catch {
        return apiError("Registration session expired or invalid. Please try again.", 400);
      }

      name = setupPayload.name;
      email = setupPayload.email;
      passwordHash = setupPayload.passwordHash;

      if (!data.skip) {
        if (!data.code || data.code.trim().length === 0) {
          return apiError("Please enter the 6-digit verification code from your authenticator app.", 400);
        }

        const isValid = verifyTwoFactorCode(setupPayload.secret, data.code);
        if (!isValid) {
          return apiError("Invalid verification code. Please check your authenticator app and try again.", 400);
        }

        twoFactorEnabled = true;
        twoFactorSecret = encryptSecret(setupPayload.secret);
        twoFactorRecoveryCodes = setupPayload.hashedRecoveryCodes;
      }
    } else {
      // Case 2: Direct registration
      if (!name || !email || !data.password) {
        return apiError("Name, email, and password are required.", 400);
      }
      passwordHash = await hashPassword(data.password);
    }

    if (!name || !email || !passwordHash) {
      return apiError("Invalid registration details", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail }).lean();

    if (existingUser) {
      return apiError("An account with this email already exists", 409);
    }

    let user;
    try {
      user = await User.create({
        name,
        email: normalizedEmail,
        passwordHash,
        twoFactorEnabled,
        twoFactorSecret,
        twoFactorRecoveryCodes,
      });
    } catch (err: unknown) {
      const mongoErr = err as { code?: number; keyPattern?: Record<string, unknown> };
      if (mongoErr?.code === 11000) {
        if (mongoErr?.keyPattern?.email) {
          return apiError("An account with this email already exists", 409);
        }
        console.error("Duplicate key error on non-email field during registration:", err);
        return apiError("Registration failed due to a system conflict. Please try again.", 409);
      }
      throw err;
    }

    if (!user) {
      return apiError("Could not create user account", 500);
    }

    const token = signAuthToken({ userId: user._id.toString(), email: user.email });
    const response = NextResponse.json(
      {
        token,
        user: serializeDocument({
          ...user.toObject(),
          passwordHash: undefined,
          resetTokenHash: undefined,
          resetTokenExpiresAt: undefined,
          twoFactorSecret: undefined,
          twoFactorRecoveryCodes: undefined,
        }),
        twoFactorEnabled,
      },
      { status: 201 },
    );

    response.cookies.set(AUTH_COOKIE, token, authCookieOptions(request));
    return response;
  } catch (err) {
    console.error("Register exception:", err);
    return apiError((err as Error).message || "Internal server error", 500);
  }
}
