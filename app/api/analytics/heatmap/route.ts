import type { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Visit from "@/models/Visit";
import { parseTzOffset, startOfLocalDayUtc, tzOffsetLabel } from "@/lib/date-buckets";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  await connectToDatabase();
  const tzOffset = parseTzOffset(request.nextUrl.searchParams.get("tz"));
  const start = startOfLocalDayUtc(Date.now(), tzOffset) - 364 * 86_400_000;
  const rows = await Visit.aggregate([
    { $match: { userId: auth.user._id, visitedAt: { $gte: new Date(start) } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$visitedAt", timezone: tzOffsetLabel(tzOffset) } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return json({ data: rows.map((row) => ({ date: row._id, count: row.count })) });
}
