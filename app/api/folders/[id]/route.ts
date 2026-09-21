import type { NextRequest } from "next/server";
import { apiError, invalidIdResponse, isValidObjectId, json, parseBody, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { folderPatchSchema } from "@/lib/validators/schemas";
import Folder from "@/models/Folder";
import Website from "@/models/Website";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  const { data, error } = await parseBody(request, folderPatchSchema);

  if (error) return error;

  const { id } = await context.params;
  if (!isValidObjectId(id)) return invalidIdResponse();
  await connectToDatabase();
  const currentFolder = await Folder.findOne({ _id: id, userId: auth.user._id }).lean();

  if (!currentFolder) {
    return apiError("Folder not found", 404);
  }

  if (data.parentFolderId === id) {
    return apiError("A folder cannot be moved into itself", 400);
  }

  if (data.parentFolderId) {
    // Verify the new parent exists and belongs to this user.
    const parent = await Folder.findOne({ _id: data.parentFolderId, userId: auth.user._id }).select("_id").lean();
    if (!parent) {
      return apiError("Parent folder not found", 404);
    }

    const folders = await Folder.find({ userId: auth.user._id }).select("_id parentFolderId").lean();
    const descendants = new Set<string>();
    const queue = [id];

    while (queue.length) {
      const currentId = queue.pop();
      if (!currentId) continue;

      for (const folder of folders) {
        const folderId = String(folder._id);
        if (String(folder.parentFolderId) === currentId && !descendants.has(folderId)) {
          descendants.add(folderId);
          queue.push(folderId);
        }
      }
    }

    if (descendants.has(String(data.parentFolderId))) {
      return apiError("A folder cannot be moved into one of its descendants", 400);
    }
  }

  const folder = await Folder.findOneAndUpdate(
    { _id: id, userId: auth.user._id },
    { $set: data },
    { new: true },
  ).lean();

  if (!folder) return apiError("Folder not found", 404);

  return json({ folder: serializeDocument(folder) });
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  const { id } = await context.params;
  if (!isValidObjectId(id)) return invalidIdResponse();
  const cascade = request.nextUrl.searchParams.get("cascade") === "true";

  await connectToDatabase();
  const folder = await Folder.findOne({ _id: id, userId: auth.user._id }).lean();

  if (!folder) return apiError("Folder not found", 404);

  if (cascade) {
    await Website.updateMany(
      { userId: auth.user._id, folderId: id },
      { $set: { isTrashed: true, trashedAt: new Date() } },
    );
  } else {
    await Website.updateMany({ userId: auth.user._id, folderId: id }, { $set: { folderId: folder.parentFolderId } });
  }

  await Folder.updateMany({ userId: auth.user._id, parentFolderId: id }, { $set: { parentFolderId: folder.parentFolderId } });
  await Folder.deleteOne({ _id: id, userId: auth.user._id });

  return json({ ok: true });
}
