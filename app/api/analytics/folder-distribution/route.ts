import type { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Folder from "@/models/Folder";
import Website from "@/models/Website";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  await connectToDatabase();
  const [folders, rows, unassignedCount] = await Promise.all([
    Folder.find({ userId: auth.user._id }).select("name color icon").lean(),
    Website.aggregate([
      { $match: { userId: auth.user._id, isTrashed: false, folderId: { $ne: null } } },
      { $group: { _id: "$folderId", value: { $sum: 1 } } },
    ]),
    Website.countDocuments({ userId: auth.user._id, isTrashed: false, folderId: null }),
  ]);

  const countMap = new Map<string, number>();
  for (const row of rows) {
    if (row._id) countMap.set(String(row._id), row.value);
  }

  const data: Array<{ id: string; name: string; color: string; value: number }> = [];

  for (const f of folders) {
    const val = countMap.get(String(f._id)) || 0;
    data.push({
      id: String(f._id),
      name: f.name,
      color: f.color || "#6366f1",
      value: val,
    });
  }

  if (unassignedCount > 0 || data.length === 0) {
    data.push({
      id: "unsorted",
      name: "Direct Bookmarks",
      color: "#94a3b8",
      value: unassignedCount,
    });
  }

  return json({ data });
}
