import type { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Folder from "@/models/Folder";
import Website from "@/models/Website";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  await connectToDatabase();
  const [folders, rows] = await Promise.all([
    Folder.find({ userId: auth.user._id, parentFolderId: null }).select("name color icon").lean(),
    Website.aggregate([
      { $match: { userId: auth.user._id, isTrashed: false } },
      { $group: { _id: "$folderId", value: { $sum: 1 } } },
    ]),
  ]);
  const folderMap = new Map(
    folders.map((folder) => [String(folder._id), { name: folder.name, color: folder.color || "#6366f1" }]),
  );
  const data = rows.map((row) => {
    const found = row._id ? folderMap.get(String(row._id)) : null;
    return {
      id: row._id ? String(row._id) : "unsorted",
      name: found?.name ?? (row._id ? "Nested folder" : "Unassigned"),
      color: found?.color ?? "#94a3b8",
      value: row.value,
    };
  });

  return json({ data });
}
