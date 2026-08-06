import type { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Visit from "@/models/Visit";
import { dateKeyAtOffset, parseTzOffset, startOfLocalDayUtc, tzOffsetLabel } from "@/lib/date-buckets";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  await connectToDatabase();
  const range = request.nextUrl.searchParams.get("range") ?? "30d";
  const days = range === "7d" ? 7 : 30;
  const tzOffset = parseTzOffset(request.nextUrl.searchParams.get("tz"));
  const start = startOfLocalDayUtc(Date.now(), tzOffset) - (days - 1) * 86_400_000;

  const rows = await Visit.aggregate([
    { $match: { userId: auth.user._id, visitedAt: { $gte: new Date(start) } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$visitedAt", timezone: tzOffsetLabel(tzOffset) } },
        visits: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const map = new Map(rows.map((row) => [row._id, row.visits]));
  const data = Array.from({ length: days }, (_, index) => {
    const key = dateKeyAtOffset(start + index * 86_400_000, tzOffset);
    return { date: key, visits: map.get(key) ?? 0 };
  });

  return json({ data });
}
