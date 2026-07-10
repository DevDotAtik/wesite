import type { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Folder from "@/models/Folder";
import Todo from "@/models/Todo";
import Visit from "@/models/Visit";
import Website from "@/models/Website";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  await connectToDatabase();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const [totalWebsites, totalFolders, totalVisits, visitsToday, firstVisit, favoriteWebsites, trashedWebsites, activeTodos, completedTodos] = await Promise.all([
    Website.countDocuments({ userId: auth.user._id, isTrashed: false }),
    Folder.countDocuments({ userId: auth.user._id }),
    Visit.countDocuments({ userId: auth.user._id }),
    Visit.countDocuments({ userId: auth.user._id, visitedAt: { $gte: startOfToday } }),
    Visit.findOne({ userId: auth.user._id }).sort({ visitedAt: 1 }).lean(),
    Website.countDocuments({ userId: auth.user._id, isTrashed: false, isFavorite: true }),
    Website.countDocuments({ userId: auth.user._id, isTrashed: true }),
    Todo.countDocuments({ userId: auth.user._id, completedAt: null }),
    Todo.countDocuments({ userId: auth.user._id, completedAt: { $ne: null } }),
  ]);
  const days = firstVisit
    ? Math.max(1, Math.ceil((Date.now() - firstVisit.visitedAt.getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  return json({
    totalWebsites,
    totalFolders,
    totalVisits,
    visitsToday,
    averageVisitsPerDay: Number((totalVisits / days).toFixed(1)),
    favoriteWebsites,
    trashedWebsites,
    activeTodos,
    completedTodos,
  });
}
