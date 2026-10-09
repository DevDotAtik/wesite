import type { NextRequest } from "next/server";
import { apiError, json, parseBody, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import {
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  generateTwoFactorSetup,
  hashRecoveryCode,
  verifyTwoFactorCode,
} from "@/lib/totp";
import User from "@/models/User";
import { z } from "zod";

const manage2faSchema = z.object({
  action: z.enum(["setup", "enable", "disable", "regenerate-codes"]),
  secret: z.string().optional(),
  code: z.string().optional(),
  recoveryCodes: z.array(z.string()).optional(),
  password: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { user, response } = await requireUser(request);
  if (response) return response;

  await connectToDatabase();
  const dbUser = await User.findById(user._id).select("twoFactorEnabled twoFactorRecoveryCodes");

  return json({
    enabled: Boolean(dbUser?.twoFactorEnabled),
    remainingRecoveryCodesCount: dbUser?.twoFactorRecoveryCodes?.length ?? 0,
  });
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireUser(request);
  if (response) return response;

  const { data, error } = await parseBody(request, manage2faSchema);
  if (error) return error;

  await connectToDatabase();
  const dbUser = await User.findById(user._id);
  if (!dbUser) return apiError("User not found", 404);

  // 1. Generate 2FA setup bundle
  if (data.action === "setup") {
    const setupBundle = await generateTwoFactorSetup(dbUser.email);
    return json({
      secret: setupBundle.secret,
      otpAuthUri: setupBundle.otpAuthUri,
      qrCodeDataUrl: setupBundle.qrCodeDataUrl,
      recoveryCodes: setupBundle.recoveryCodes,
    });
  }

  // 2. Enable 2FA after scanning QR code and verifying 6-digit code
  if (data.action === "enable") {
    if (!data.secret || !data.code || !data.recoveryCodes?.length) {
      return apiError("Missing secret, verification code, or recovery codes", 400);
    }

    const isValid = verifyTwoFactorCode(data.secret, data.code);
    if (!isValid) {
      return apiError("Invalid verification code. Please check your authenticator app.", 400);
    }

    dbUser.twoFactorEnabled = true;
    dbUser.twoFactorSecret = encryptSecret(data.secret);
    dbUser.twoFactorRecoveryCodes = data.recoveryCodes.map(hashRecoveryCode);
    await dbUser.save();

    return json({
      ok: true,
      message: "Two-factor authentication enabled successfully",
      enabled: true,
      remainingRecoveryCodesCount: dbUser.twoFactorRecoveryCodes.length,
    });
  }

  // 3. Disable 2FA
  if (data.action === "disable") {
    let authorized = false;

    if (data.password && dbUser.passwordHash) {
      authorized = await verifyPassword(data.password, dbUser.passwordHash);
    }

    if (!authorized && data.code && dbUser.twoFactorSecret) {
      const decryptedSecret = decryptSecret(dbUser.twoFactorSecret);
      authorized = verifyTwoFactorCode(decryptedSecret, data.code);
    }

    if (!authorized) {
      return apiError("Please provide your current password or 2FA code to disable 2FA.", 400);
    }

    dbUser.twoFactorEnabled = false;
    dbUser.twoFactorSecret = null;
    dbUser.twoFactorRecoveryCodes = [];
    await dbUser.save();

    return json({
      ok: true,
      message: "Two-factor authentication disabled",
      enabled: false,
    });
  }

  // 4. Regenerate recovery codes
  if (data.action === "regenerate-codes") {
    let authorized = false;

    if (data.password && dbUser.passwordHash) {
      authorized = await verifyPassword(data.password, dbUser.passwordHash);
    }

    if (!authorized && data.code && dbUser.twoFactorSecret) {
      const decryptedSecret = decryptSecret(dbUser.twoFactorSecret);
      authorized = verifyTwoFactorCode(decryptedSecret, data.code);
    }

    if (!authorized) {
      return apiError("Password or 2FA verification required to regenerate recovery codes.", 400);
    }

    const newCodes = generateRecoveryCodes(8);
    dbUser.twoFactorRecoveryCodes = newCodes.map(hashRecoveryCode);
    await dbUser.save();

    return json({
      ok: true,
      recoveryCodes: newCodes,
      remainingRecoveryCodesCount: newCodes.length,
    });
  }

  return apiError("Unsupported action", 400);
}
