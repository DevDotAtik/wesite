import type { NextRequest } from "next/server";
import { json, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Website from "@/models/Website";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  await connectToDatabase();
  const websites = await Website.find({ userId: auth.user._id, isTrashed: false, visitCount: { $gt: 0 } })
    .sort({ visitCount: -1 })
    .limit(10)
    .select("title domain visitCount faviconUrl")
    .lean();

  return json({ websites: serializeDocument(websites) });
}
