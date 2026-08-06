import type { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Visit from "@/models/Visit";
import { dateKeyAtOffset, parseTzOffset, startOfLocalDayUtc, tzOffsetLabel } from "@/lib/date-buckets";

const DAY_MS = 86_400_000;

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  await connectToDatabase();
  const tzOffset = parseTzOffset(request.nextUrl.searchParams.get("tz"));
  const start = startOfLocalDayUtc(Date.now(), tzOffset) - 364 * DAY_MS;

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

  const activeDays = rows.map((row) => row._id);
  let currentStreak = 0;
  let longestStreak = 0;

  const activeDaySet = new Set(activeDays);

  // Calculate current streak from today backwards
  let checkDayStart = startOfLocalDayUtc(Date.now(), tzOffset);
  while (activeDaySet.has(dateKeyAtOffset(checkDayStart, tzOffset))) {
    currentStreak++;
    checkDayStart -= DAY_MS;
  }

  // Calculate longest streak
  let tempStreak = 0;
  for (let i = 0; i < activeDays.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(`${activeDays[i - 1]}T00:00:00Z`).getTime();
      const curr = new Date(`${activeDays[i]}T00:00:00Z`).getTime();
      const diffDays = Math.round((curr - prev) / DAY_MS);
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return json({
    currentStreak,
    longestStreak,
    totalActiveDays: activeDays.length,
  });
}
