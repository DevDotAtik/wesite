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
    Folder.find({ userId: auth.user._id, parentFolderId: null }).lean(),
    Website.aggregate([
      { $match: { userId: auth.user._id, isTrashed: false } },
      { $group: { _id: "$folderId", value: { $sum: 1 } } },
    ]),
  ]);
  const folderNames = new Map(folders.map((folder) => [String(folder._id), folder.name]));
  const data = rows.map((row) => ({
    name: row._id ? folderNames.get(String(row._id)) ?? "Nested folder" : "Unsorted",
    value: row.value,
  }));

  return json({ data });
}
