import type { NextRequest } from "next/server";
import { apiError, json, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Website from "@/models/Website";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  const { id } = await context.params;
  await connectToDatabase();
  const deleted = await Website.findOneAndDelete({ _id: id, userId: auth.user._id });

  if (!deleted) return apiError("Website not found", 404);

  return json({ ok: true });
}
