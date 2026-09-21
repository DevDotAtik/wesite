import crypto from "crypto";
import type { NextRequest } from "next/server";
import { apiError, json, parseBody } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validators/schemas";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, resetPasswordSchema);

  if (error) {
    return error;
  }

  await connectToDatabase();
  const tokenHash = crypto.createHash("sha256").update(data.token).digest("hex");
  const user = await User.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    return apiError("Invalid or expired reset token", 400);
  }

  user.passwordHash = await hashPassword(data.password);
  user.resetTokenHash = null;
  user.resetTokenExpiresAt = null;
  await user.save();

  return json({ ok: true });
}
