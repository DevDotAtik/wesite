import crypto from "crypto";
import type { NextRequest } from "next/server";
import { json, parseBody } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
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
    // SHA-256 (fast, indexed lookup) instead of bcrypt: the token has
    // 256 bits of entropy, so a fast hash is sufficient and avoids an
    // O(N) bcrypt scan on reset.
    user.resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    user.resetTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
    await user.save();
  }

  return json({
    ok: true,
    message: "If the account exists, a reset token has been generated.",
    resetToken: process.env.NODE_ENV === "production" ? undefined : token,
  });
}
