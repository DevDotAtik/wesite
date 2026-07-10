import type { NextRequest } from "next/server";
import { apiError, json, parseBody, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { normalizeUrl } from "@/lib/scrapeMetadata";
import { websitePatchSchema } from "@/lib/validators/schemas";
import Website from "@/models/Website";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  const { id } = await context.params;
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
  await connectToDatabase();

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

    const website = await Website.findOneAndUpdate(
      { _id: id, userId: auth.user._id },
      { $set: { ...data, url: normalizeUrl(data.url), normalizedUrl, isTrashed: false, trashedAt: null } },
      { new: true },
    ).lean();

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
  await connectToDatabase();
  const website = await Website.findOneAndUpdate(
    { _id: id, userId: auth.user._id },
    { $set: { isTrashed: true, trashedAt: new Date() } },
    { new: true },
  ).lean();

  if (!website) return apiError("Website not found", 404);

  return json({ website: serializeDocument(website) });
}
