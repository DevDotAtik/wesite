import type { NextRequest } from "next/server";
import { json, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Website from "@/models/Website";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  await connectToDatabase();
  const searchParams = request.nextUrl.searchParams;
  const rawLimit = parseInt(searchParams.get("limit") || "10", 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 5), 30) : 10;

  const websites = await Website.find({ userId: auth.user._id, isTrashed: false, visitCount: { $gt: 0 } })
    .sort({ visitCount: -1 })
    .limit(limit)
    .select("title domain url visitCount faviconUrl folderId")
    .populate("folderId", "name color")
    .lean();

  return json({ websites: serializeDocument(websites) });
}
