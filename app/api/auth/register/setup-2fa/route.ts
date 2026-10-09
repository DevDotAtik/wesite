import type { NextRequest } from "next/server";
import { apiError, json, parseBody } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { generateTwoFactorSetup, signRegistrationSetupToken } from "@/lib/totp";
import { registerSetup2faSchema } from "@/lib/validators/schemas";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const { data, error } = await parseBody(request, registerSetup2faSchema);

    if (error) {
      return error;
    }

    await connectToDatabase();

    const normalizedEmail = data.email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail }).lean();

    if (existingUser) {
      return apiError("An account with this email already exists", 409);
    }

    const passwordHash = await hashPassword(data.password);
    const { secret, otpAuthUri, qrCodeDataUrl, recoveryCodes, hashedRecoveryCodes } =
      await generateTwoFactorSetup(normalizedEmail);

    const setupToken = signRegistrationSetupToken({
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash,
      secret,
      hashedRecoveryCodes,
    });

    return json({
      setupToken,
      secret,
      otpAuthUri,
      qrCodeDataUrl,
      recoveryCodes,
    });
  } catch (err) {
    console.error("Register 2FA setup error:", err);
    return apiError((err as Error).message || "Internal server error", 500);
  }
}
