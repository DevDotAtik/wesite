import type { NextRequest } from "next/server";
import { apiError, json, parseBody } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validators/schemas";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, resetPasswordSchema);

  if (error) {
    return error;
  }

  await connectToDatabase();
  const users = await User.find({ resetTokenExpiresAt: { $gt: new Date() } });
  const user = (
    await Promise.all(
      users.map(async (candidate) =>
        candidate.resetTokenHash && (await verifyPassword(data.token, candidate.resetTokenHash))
          ? candidate
          : null,
      ),
    )
  ).find(Boolean);

  if (!user) {
    return apiError("Invalid or expired reset token", 400);
  }

  user.passwordHash = await hashPassword(data.password);
  user.resetTokenHash = null;
  user.resetTokenExpiresAt = null;
  await user.save();

  return json({ ok: true });
}
