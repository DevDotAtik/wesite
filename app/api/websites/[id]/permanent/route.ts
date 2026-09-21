import type { NextRequest } from "next/server";
import { apiError, invalidIdResponse, isValidObjectId, json, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Website from "@/models/Website";
import Visit from "@/models/Visit";
import Todo from "@/models/Todo";
import Monitor from "@/models/Monitor";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  const { id } = await context.params;
  if (!isValidObjectId(id)) return invalidIdResponse();
  await connectToDatabase();
  const deleted = await Website.findOneAndDelete({ _id: id, userId: auth.user._id });

  if (!deleted) return apiError("Website not found", 404);

  // Remove dangling references so analytics and linked lists stay accurate.
  await Promise.all([
    Visit.deleteMany({ websiteId: id, userId: auth.user._id }),
    Todo.updateMany({ websiteId: id, userId: auth.user._id }, { $set: { websiteId: null } }),
    Monitor.deleteMany({ websiteId: id, userId: auth.user._id }),
  ]);

  return json({ ok: true });
}
