import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authCookieOptions, AUTH_COOKIE, signAuthToken } from "@/lib/auth";
import { apiError, parseBody, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { login2faSchema } from "@/lib/validators/schemas";
import {
  decryptSecret,
  verifyAndConsumeRecoveryCode,
  verifyLoginTwoFactorToken,
  verifyTwoFactorCode,
} from "@/lib/totp";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const { data, error } = await parseBody(request, login2faSchema);

    if (error) {
      return error;
    }

    let tokenPayload;
    try {
      tokenPayload = verifyLoginTwoFactorToken(data.tempToken);
    } catch {
      return apiError("2FA session has expired or is invalid. Please sign in again.", 401);
    }

    await connectToDatabase();

    const user = await User.findById(tokenPayload.userId);

    if (!user) {
      return apiError("User not found", 404);
    }

    if (!user.twoFactorEnabled) {
      return apiError("Two-factor authentication is not enabled for this user", 400);
    }

    let isValid = false;
    let usedRecoveryCode = false;

    // Check if user submitted a recovery code or normal 6-digit TOTP code
    const isLikelyRecoveryCode =
      data.isRecoveryCode || data.code.includes("-") || data.code.trim().length > 6;

    if (isLikelyRecoveryCode) {
      if (user.twoFactorRecoveryCodes?.length) {
        const result = verifyAndConsumeRecoveryCode(user.twoFactorRecoveryCodes, data.code);
        if (result.valid) {
          isValid = true;
          usedRecoveryCode = true;
          user.twoFactorRecoveryCodes = result.remainingCodes;
          await user.save();
        }
      }
    } else {
      if (user.twoFactorSecret) {
        const decryptedSecret = decryptSecret(user.twoFactorSecret);
        isValid = verifyTwoFactorCode(decryptedSecret, data.code);
      }

      // Fallback check against recovery codes in case user pasted a recovery code without dash
      if (!isValid && user.twoFactorRecoveryCodes?.length) {
        const result = verifyAndConsumeRecoveryCode(user.twoFactorRecoveryCodes, data.code);
        if (result.valid) {
          isValid = true;
          usedRecoveryCode = true;
          user.twoFactorRecoveryCodes = result.remainingCodes;
          await user.save();
        }
      }
    }

    if (!isValid) {
      return apiError(
        isLikelyRecoveryCode
          ? "Invalid or already used recovery code"
          : "Invalid 6-digit code. Please check your authenticator app and try again.",
        400,
      );
    }

    const token = signAuthToken({ userId: user._id.toString(), email: user.email });
    const response = NextResponse.json({
      user: serializeDocument({
        ...user.toObject(),
        passwordHash: undefined,
        resetTokenHash: undefined,
        resetTokenExpiresAt: undefined,
        twoFactorSecret: undefined,
        twoFactorRecoveryCodes: undefined,
      }),
      usedRecoveryCode,
      remainingRecoveryCodes: user.twoFactorRecoveryCodes?.length ?? 0,
    });

    response.cookies.set(AUTH_COOKIE, token, authCookieOptions());
    return response;
  } catch (err) {
    console.error("Login 2FA verification error:", err);
    return apiError((err as Error).message || "Internal server error", 500);
  }
}
