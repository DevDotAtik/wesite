import type { NextRequest } from "next/server";
import { apiError, json, parseBody, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { todoPatchSchema } from "@/lib/validators/schemas";
import Todo from "@/models/Todo";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  const { data, error } = await parseBody(request, todoPatchSchema);

  if (error) return error;

  const { id } = await context.params;
  await connectToDatabase();

  const $set: Record<string, unknown> = {};

  if (data.title !== undefined) $set.title = data.title;
  if (data.notes !== undefined) $set.notes = data.notes;
  if (data.websiteId !== undefined) $set.websiteId = data.websiteId ?? null;
  if (data.dueAt !== undefined) $set.dueAt = data.dueAt ? new Date(data.dueAt) : null;
  if (data.completed !== undefined) $set.completedAt = data.completed ? new Date() : null;

  const todo = await Todo.findOneAndUpdate(
    { _id: id, userId: auth.user._id },
    { $set },
    { new: true },
  ).populate("websiteId", "title domain url faviconUrl folderId").lean();

  if (!todo) return apiError("Todo not found", 404);

  return json({ todo: serializeDocument(todo) });
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  const { id } = await context.params;
  await connectToDatabase();
  const deleted = await Todo.findOneAndDelete({ _id: id, userId: auth.user._id });

  if (!deleted) return apiError("Todo not found", 404);

  return json({ ok: true });
}
