import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authCookieOptions, AUTH_COOKIE, hashPassword, signAuthToken } from "@/lib/auth";
import { apiError, parseBody, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { registerSchema } from "@/lib/validators/schemas";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, registerSchema);

  if (error) {
    return error;
  }

  await connectToDatabase();

  const existingUser = await User.findOne({ email: data.email.toLowerCase() }).lean();

  if (existingUser) {
    return apiError("An account with this email already exists", 409);
  }

  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash: await hashPassword(data.password),
  }).catch((error: { code?: number }) => {
    if (error?.code === 11000) return null;
    throw error;
  });

  if (!user) {
    return apiError("An account with this email already exists", 409);
  }
  const token = signAuthToken({ userId: user._id.toString(), email: user.email });
  const response = NextResponse.json(
    {
      user: serializeDocument({
        ...user.toObject(),
        passwordHash: undefined,
        resetTokenHash: undefined,
        resetTokenExpiresAt: undefined,
      }),
    },
    { status: 201 },
  );

  response.cookies.set(AUTH_COOKIE, token, authCookieOptions());
  return response;
}
