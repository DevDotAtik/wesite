import type { NextRequest } from "next/server";
import { apiError, invalidIdResponse, isValidObjectId, json, parseBody, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { normalizeUrl } from "@/lib/scrapeMetadata";
import { websitePatchSchema } from "@/lib/validators/schemas";
import Website from "@/models/Website";
import Folder from "@/models/Folder";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  const { id } = await context.params;
  if (!isValidObjectId(id)) return invalidIdResponse();
  await connectToDatabase();
  const website = await Website.findOne({ _id: id, userId: auth.user._id }).lean();

  if (!website) return apiError("Website not found", 404);

  return json({ website: serializeDocument(website) });
}

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  const { data, error } = await parseBody(request, websitePatchSchema);

  if (error) return error;

  const { id } = await context.params;
  if (!isValidObjectId(id)) return invalidIdResponse();
  await connectToDatabase();

  if (data.folderId) {
    const folder = await Folder.findOne({ _id: data.folderId, userId: auth.user._id }).lean();
    if (!folder) {
      return apiError("Folder not found", 404);
    }
  }

  if (data.url) {
    let normalizedUrl: string;

    try {
      normalizedUrl = normalizeUrl(data.url);
    } catch {
      return apiError("Invalid URL", 422);
    }

    const duplicate = await Website.findOne({
      userId: auth.user._id,
      normalizedUrl,
      isTrashed: false,
      _id: { $ne: id },
    }).lean();

    if (duplicate) {
      return apiError("This website is already saved", 409);
    }

    let website;

    try {
      website = await Website.findOneAndUpdate(
        { _id: id, userId: auth.user._id },
        { $set: { ...data, url: normalizeUrl(data.url), normalizedUrl } },
        { new: true },
      ).lean();
    } catch (error) {
      if ((error as { code?: number })?.code === 11000) {
        return apiError("This website is already saved", 409);
      }
      throw error;
    }

    if (!website) return apiError("Website not found", 404);

    return json({ website: serializeDocument(website) });
  }

  const website = await Website.findOneAndUpdate(
    { _id: id, userId: auth.user._id },
    { $set: data },
    { new: true },
  ).lean();

  if (!website) return apiError("Website not found", 404);

  return json({ website: serializeDocument(website) });
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  const { id } = await context.params;
  if (!isValidObjectId(id)) return invalidIdResponse();
  await connectToDatabase();
  const website = await Website.findOneAndUpdate(
    { _id: id, userId: auth.user._id },
    { $set: { isTrashed: true, trashedAt: new Date() } },
    { new: true },
  ).lean();

  if (!website) return apiError("Website not found", 404);

  return json({ website: serializeDocument(website) });
}
