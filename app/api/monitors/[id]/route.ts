import type { NextRequest } from "next/server";
import { apiError, invalidIdResponse, isValidObjectId, json, parseBody, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Monitor from "@/models/Monitor";
import { z } from "zod";

type Context = { params: Promise<{ id: string }> };

const patchMonitorSchema = z.object({
  interval: z.enum(["hourly", "daily", "weekly"]).optional(),
  enabled: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  const { id } = await context.params;
  if (!isValidObjectId(id)) return invalidIdResponse();
  const { data, error } = await parseBody(request, patchMonitorSchema);

  if (error) return error;

  if (Object.keys(data).length === 0) {
    return apiError("Nothing to update", 400);
  }

  await connectToDatabase();
  const monitor = await Monitor.findOneAndUpdate(
    { _id: id, userId: auth.user._id },
    { $set: data },
    { new: true },
  ).lean();

  if (!monitor) return apiError("Monitor not found", 404);

  return json({ monitor: serializeDocument(monitor) });
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  const { id } = await context.params;
  if (!isValidObjectId(id)) return invalidIdResponse();
  await connectToDatabase();
  const deleted = await Monitor.findOneAndDelete({ _id: id, userId: auth.user._id });

  if (!deleted) return apiError("Monitor not found", 404);

  return json({ ok: true });
}
