import type { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Website from "@/models/Website";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  await connectToDatabase();

  const rows = await Website.aggregate([
    { $match: { userId: auth.user._id, isTrashed: false, tags: { $exists: true, $ne: [] } } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 100 },
  ]);

  return json({ tags: rows.map((row) => ({ tag: row._id, count: row.count })) });
}
