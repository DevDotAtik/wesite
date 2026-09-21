import type { NextRequest } from "next/server";
import { apiError, invalidIdResponse, isValidObjectId, json, parseBody, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Website from "@/models/Website";
import Folder from "@/models/Folder";
import Visit from "@/models/Visit";
import Todo from "@/models/Todo";
import Monitor from "@/models/Monitor";
import { z } from "zod";

const batchActionSchema = z.object({
  ids: z.array(z.string()).min(1, "Select at least one bookmark").max(100, "Too many bookmarks at once"),
  action: z.enum(["move", "favorite", "tag", "trash", "restore", "permanentDelete"]),
  folderId: z.string().nullable().optional(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string().min(1).max(40)).max(30).optional(),
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

  for (const id of data.ids) {
    if (!isValidObjectId(id)) return invalidIdResponse();
  }

  if (data.folderId) {
    if (!isValidObjectId(data.folderId)) return invalidIdResponse();
    const folder = await Folder.findOne({ _id: data.folderId, userId: auth.user._id }).select("_id").lean();
    if (!folder) {
      return apiError("Folder not found", 404);
    }
  }

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
    const deleted = await Website.deleteMany(filter);
    await Promise.all([
      Visit.deleteMany({ websiteId: { $in: data.ids }, userId: auth.user._id }),
      Todo.updateMany({ websiteId: { $in: data.ids }, userId: auth.user._id }, { $set: { websiteId: null } }),
      Monitor.deleteMany({ websiteId: { $in: data.ids }, userId: auth.user._id }),
    ]);
    return json({ success: true, action: data.action, count: deleted.deletedCount });
  }

  return json({ success: true, action: data.action, count: data.ids.length });
}
