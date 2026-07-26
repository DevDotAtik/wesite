import type { NextRequest } from "next/server";
import { apiError, json, parseBody, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Website from "@/models/Website";
import { z } from "zod";

const batchActionSchema = z.object({
  ids: z.array(z.string()).min(1, "Select at least one bookmark"),
  action: z.enum(["move", "favorite", "tag", "trash", "restore", "permanentDelete"]),
  folderId: z.string().nullable().optional(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) {
    return auth.response;
  }

  const { data, error } = await parseBody(request, batchActionSchema);

  if (error) {
    return error;
  }

  await connectToDatabase();

  const filter = {
    _id: { $in: data.ids },
    userId: auth.user._id,
  };

  if (data.action === "move") {
    await Website.updateMany(filter, {
      $set: { folderId: data.folderId ?? null },
    });
  } else if (data.action === "favorite") {
    await Website.updateMany(filter, {
      $set: { isFavorite: data.isFavorite ?? true },
    });
  } else if (data.action === "tag") {
    if (data.tags && data.tags.length > 0) {
      await Website.updateMany(filter, {
        $addToSet: { tags: { $each: data.tags } },
      });
    }
  } else if (data.action === "trash") {
    await Website.updateMany(filter, {
      $set: { isTrashed: true, trashedAt: new Date() },
    });
  } else if (data.action === "restore") {
    await Website.updateMany(filter, {
      $set: { isTrashed: false, trashedAt: null },
    });
  } else if (data.action === "permanentDelete") {
    await Website.deleteMany(filter);
  }

  return json({ success: true, action: data.action, count: data.ids.length });
}
