import type { NextRequest } from "next/server";
import { json, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Visit from "@/models/Visit";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  await connectToDatabase();
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 100), 200);
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const query: Record<string, unknown> = { userId: auth.user._id };

  if (from || to) {
    query.visitedAt = {};
    if (from) (query.visitedAt as Record<string, Date>).$gte = new Date(from);
    if (to) (query.visitedAt as Record<string, Date>).$lte = new Date(to);
  }

  const visits = await Visit.find(query)
    .populate("websiteId", "title url domain faviconUrl")
    .sort({ visitedAt: -1 })
    .limit(limit)
    .lean();
  const groups = visits.reduce<Record<string, typeof visits>>((acc, visit) => {
    const day = visit.visitedAt.toISOString().slice(0, 10);
    acc[day] = acc[day] ?? [];
    acc[day].push(visit);
    return acc;
  }, {});

  return json({ visits: serializeDocument(visits), groups: serializeDocument(groups) });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const query: Record<string, unknown> = { userId: auth.user._id };

  if (from || to) {
    query.visitedAt = {};
    if (from) (query.visitedAt as Record<string, Date>).$gte = new Date(from);
    if (to) (query.visitedAt as Record<string, Date>).$lte = new Date(to);
  }

  await connectToDatabase();
  const result = await Visit.deleteMany(query);

  return json({ deletedCount: result.deletedCount });
}
