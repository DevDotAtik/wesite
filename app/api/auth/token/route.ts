import type { NextRequest } from "next/server";
import { apiError, json, parseBody, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { signAuthToken, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validators/schemas";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, loginSchema);

  if (error) return error;

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

  const token = signAuthToken({ userId: user._id.toString(), email: user.email });

  return json({
    token,
    user: serializeDocument({
      ...user.toObject(),
      passwordHash: undefined,
      resetTokenHash: undefined,
      resetTokenExpiresAt: undefined,
    }),
  });
}
