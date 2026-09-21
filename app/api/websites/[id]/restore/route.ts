import type { NextRequest } from "next/server";
import { apiError, invalidIdResponse, isValidObjectId, json, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Website from "@/models/Website";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  const { id } = await context.params;
  if (!isValidObjectId(id)) return invalidIdResponse();
  await connectToDatabase();
  const trashedWebsite = await Website.findOne({ _id: id, userId: auth.user._id, isTrashed: true }).lean();

  if (!trashedWebsite) {
    return apiError("Website not found", 404);
  }

  const duplicate = await Website.findOne({
    userId: auth.user._id,
    normalizedUrl: trashedWebsite.normalizedUrl,
    isTrashed: false,
    _id: { $ne: id },
  }).lean();

  if (duplicate) {
    return apiError("An active copy of this website already exists", 409);
  }

  const website = await Website.findOneAndUpdate(
    { _id: id, userId: auth.user._id },
    { $set: { isTrashed: false, trashedAt: null } },
    { new: true },
  ).lean();

  if (!website) return apiError("Website not found", 404);

  return json({ website: serializeDocument(website) });
}
