import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authCookieOptions, AUTH_COOKIE, signAuthToken, verifyPassword } from "@/lib/auth";
import { apiError, json, parseBody, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { loginSchema } from "@/lib/validators/schemas";
import {
  decryptSecret,
  signLoginTwoFactorToken,
  verifyAndConsumeRecoveryCode,
  verifyTwoFactorCode,
} from "@/lib/totp";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, loginSchema);

  if (error) {
    return error;
  }

  await connectToDatabase();

  const user = await User.findOne({ email: data.email.toLowerCase() });

  if (!user) {
    return apiError("Invalid email or password", 401);
  }

  if (!user.passwordHash) {
    return apiError("This account uses Google sign-in. Please continue with Google.", 401);
  }

  if (!(await verifyPassword(data.password, user.passwordHash))) {
    return apiError("Invalid email or password", 401);
  }

  // Handle 2FA if enabled for the user
  if (user.twoFactorEnabled) {
    // If a 2FA code was provided in the initial request (e.g. API client)
    if (data.twoFactorCode) {
      let isCodeValid = false;

      if (user.twoFactorSecret) {
        const decryptedSecret = decryptSecret(user.twoFactorSecret);
        isCodeValid = verifyTwoFactorCode(decryptedSecret, data.twoFactorCode);
      }

      // Check recovery codes if TOTP failed
      if (!isCodeValid && user.twoFactorRecoveryCodes?.length) {
        const recoveryResult = verifyAndConsumeRecoveryCode(
          user.twoFactorRecoveryCodes,
          data.twoFactorCode,
        );
        if (recoveryResult.valid) {
          isCodeValid = true;
          user.twoFactorRecoveryCodes = recoveryResult.remainingCodes;
          await user.save();
        }
      }

      if (!isCodeValid) {
        return apiError("Invalid two-factor authentication code", 401, { requires2FA: true });
      }
    } else {
      // Prompt for 2FA verification step
      const tempToken = signLoginTwoFactorToken({
        userId: user._id.toString(),
        email: user.email,
      });

      return json({
        requires2FA: true,
        tempToken,
        email: user.email,
      });
    }
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
  });

  response.cookies.set(AUTH_COOKIE, token, authCookieOptions());
  return response;
}
