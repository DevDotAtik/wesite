import type { NextRequest } from "next/server";
import { apiError, json, parseBody, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { profilePatchSchema } from "@/lib/validators/schemas";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  const { user, response } = await requireUser(request);

  if (response) {
    return response;
  }

  return json({ user: serializeDocument(user) });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) {
    return auth.response;
  }

  const { data, error } = await parseBody(request, profilePatchSchema);

  if (error) {
    return error;
  }

  await connectToDatabase();
  const user = await User.findById(auth.user._id);

  if (!user) {
    return apiError("User not found", 404);
  }

  if (data.email && data.email.toLowerCase() !== user.email) {
    const duplicate = await User.findOne({ email: data.email.toLowerCase(), _id: { $ne: user._id } });

    if (duplicate) {
      return apiError("Email is already in use", 409);
    }

    user.email = data.email.toLowerCase();
  }

  if (data.name) user.name = data.name;
  if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;
  if (data.themePreference) user.themePreference = data.themePreference;

  if (data.newPassword) {
    if (!data.currentPassword || !(await verifyPassword(data.currentPassword, user.passwordHash))) {
      return apiError("Current password is incorrect", 400);
    }

    user.passwordHash = await hashPassword(data.newPassword);
  }

  await user.save();
  return json({ user: serializeDocument({ ...user.toObject(), passwordHash: undefined }) });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) {
    return auth.response;
  }

  await connectToDatabase();
  await User.findByIdAndDelete(auth.user._id);
  return json({ ok: true });
}
