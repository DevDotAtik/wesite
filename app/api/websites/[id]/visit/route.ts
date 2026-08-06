import type { NextRequest } from "next/server";
import { apiError, json, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Visit from "@/models/Visit";
import Website from "@/models/Website";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  const { id } = await context.params;
  await connectToDatabase();
  const now = new Date();
  const website = await Website.findOneAndUpdate(
    { _id: id, userId: auth.user._id, isTrashed: false },
    [
      {
        $set: {
          visitCount: { $add: ["$visitCount", 1] },
          firstVisitedAt: { $ifNull: ["$firstVisitedAt", now] },
          lastVisitedAt: now,
        },
      },
    ],
    { new: true, updatePipeline: true },
  ).lean();

  if (!website) return apiError("Website not found", 404);

  const visit = await Visit.create({ userId: auth.user._id, websiteId: id, visitedAt: now });

  return json({ website: serializeDocument(website), visit: serializeDocument(visit) }, 201);
}
