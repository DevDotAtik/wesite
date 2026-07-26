import type { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Visit from "@/models/Visit";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  await connectToDatabase();

  const [hourlyRows, weekdayRows, peakDayRow] = await Promise.all([
    Visit.aggregate([
      { $match: { userId: auth.user._id } },
      {
        $group: {
          _id: { $hour: "$visitedAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
    Visit.aggregate([
      { $match: { userId: auth.user._id } },
      {
        $group: {
          _id: { $dayOfWeek: "$visitedAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
    Visit.aggregate([
      { $match: { userId: auth.user._id } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$visitedAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
  ]);

  const dayNames = ["", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return json({
    mostActiveHour: hourlyRows[0] ? `${hourlyRows[0]._id}:00` : "N/A",
    mostActiveWeekday: weekdayRows[0] ? dayNames[weekdayRows[0]._id] : "N/A",
    peakDay: peakDayRow[0] ? { date: peakDayRow[0]._id, count: peakDayRow[0].count } : null,
  });
}
