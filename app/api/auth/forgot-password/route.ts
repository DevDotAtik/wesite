import crypto from "crypto";
import type { NextRequest } from "next/server";
import { json, parseBody } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { forgotPasswordSchema } from "@/lib/validators/schemas";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, forgotPasswordSchema);

  if (error) {
    return error;
  }

  await connectToDatabase();
  const user = await User.findOne({ email: data.email.toLowerCase() });
  const token = crypto.randomBytes(32).toString("hex");

  if (user) {
    user.resetTokenHash = await hashPassword(token);
    user.resetTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
    await user.save();
  }

  return json({
    ok: true,
    message: "If the account exists, a reset token has been generated.",
    resetToken: process.env.NODE_ENV === "production" ? undefined : token,
  });
}
