import type { NextRequest } from "next/server";
import { apiError, json, parseBody, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { folderCreateSchema } from "@/lib/validators/schemas";
import Folder from "@/models/Folder";
import Website from "@/models/Website";

type FolderNode = {
  _id: string;
  name: string;
  parentFolderId: string | null;
  color: string;
  icon: string;
  count: number;
  children: FolderNode[];
};

function buildTree(folders: FolderNode[]) {
  const byId = new Map(folders.map((folder) => [folder._id, folder]));
  const roots: FolderNode[] = [];

  for (const folder of folders) {
    if (folder.parentFolderId && byId.has(folder.parentFolderId)) {
      byId.get(folder.parentFolderId)?.children.push(folder);
    } else {
      roots.push(folder);
    }
  }

  return roots;
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  await connectToDatabase();
  const [folders, counts] = await Promise.all([
    Folder.find({ userId: auth.user._id }).sort({ order: 1, name: 1 }).lean(),
    Website.aggregate([
      { $match: { userId: auth.user._id, isTrashed: false } },
      { $group: { _id: "$folderId", count: { $sum: 1 } } },
    ]),
  ]);
  const countMap = new Map(counts.map((item) => [String(item._id), item.count]));
  const nodes: FolderNode[] = folders.map((folder) => ({
    _id: String(folder._id),
    name: folder.name,
    parentFolderId: folder.parentFolderId ? String(folder.parentFolderId) : null,
    color: folder.color,
    icon: folder.icon,
    count: countMap.get(String(folder._id)) ?? 0,
    children: [],
  }));

  return json({ folders: buildTree(nodes), flatFolders: nodes });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  const { data, error } = await parseBody(request, folderCreateSchema);

  if (error) return error;

  await connectToDatabase();

  if (data.parentFolderId) {
    const parent = await Folder.findOne({ _id: data.parentFolderId, userId: auth.user._id }).select("_id").lean();
    if (!parent) {
      return apiError("Parent folder not found", 404);
    }
  }

  const folder = await Folder.create({
    userId: auth.user._id,
    name: data.name,
    parentFolderId: data.parentFolderId ?? null,
    color: data.color,
    icon: data.icon,
  });

  return json({ folder: serializeDocument(folder) }, 201);
}
