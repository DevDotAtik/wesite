import type { NextRequest } from "next/server";
import { apiError, json, parsePagination, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Visit from "@/models/Visit";

function dateRangeFilter(searchParams: URLSearchParams) {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const range: Record<string, Date> = {};

  if (from) {
    const fromDate = new Date(from);
    if (Number.isNaN(fromDate.getTime())) return { range, error: "Invalid from date" };
    range.$gte = fromDate;
  }

  if (to) {
    const toDate = new Date(to);
    if (Number.isNaN(toDate.getTime())) return { range, error: "Invalid to date" };
    range.$lte = toDate;
  }

  return { range, error: null as string | null };
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  await connectToDatabase();
  const { limit } = parsePagination(request.nextUrl.searchParams, 100, 200);
  const { range, error } = dateRangeFilter(request.nextUrl.searchParams);

  if (error) return apiError(error, 400);

  const query: Record<string, unknown> = { userId: auth.user._id };

  if (Object.keys(range).length) {
    query.visitedAt = range;
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

  const { range: deleteRange, error: deleteError } = dateRangeFilter(request.nextUrl.searchParams);

  if (deleteError) return apiError(deleteError, 400);

  const query: Record<string, unknown> = { userId: auth.user._id };

  if (Object.keys(deleteRange).length) {
    query.visitedAt = deleteRange;
  }

  await connectToDatabase();
  const result = await Visit.deleteMany(query);

  return json({ deletedCount: result.deletedCount });
}
