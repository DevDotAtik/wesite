import type { NextRequest } from "next/server";
import { apiError, json, parseBody, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { normalizeUrl, scrapeMetadata } from "@/lib/scrapeMetadata";
import { websiteCreateSchema } from "@/lib/validators/schemas";
import Website from "@/models/Website";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) {
    return auth.response;
  }

  await connectToDatabase();

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(Number(searchParams.get("limit") ?? 60), 100);
  const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
  const search = searchParams.get("search");
  const folderId = searchParams.get("folderId");
  const tag = searchParams.get("tag");
  const favorite = searchParams.get("favorite");
  const trashed = searchParams.get("trashed");
  const sort = searchParams.get("sort") ?? "smart";
  const query: Record<string, unknown> = { userId: auth.user._id };

  if (folderId === "root" || folderId === "unsorted") query.folderId = null;
  else if (folderId) query.folderId = folderId;
  if (tag) query.tags = tag;
  if (favorite === "true") query.isFavorite = true;
  query.isTrashed = trashed === "true";

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { domain: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];
  }

  let sortOrder: Record<string, 1 | -1>;

  if (sort === "recent") {
    sortOrder = { createdAt: -1 };
  } else if (sort === "visited") {
    sortOrder = { lastVisitedAt: -1, visitCount: -1, createdAt: -1 };
  } else if (sort === "loved") {
    sortOrder = { isFavorite: -1, visitCount: -1, lastVisitedAt: -1, createdAt: -1 };
  } else if (sort === "trash") {
    sortOrder = { trashedAt: -1, createdAt: -1 };
  } else {
    sortOrder = { isFavorite: -1, lastVisitedAt: -1, createdAt: -1 };
  }

  const [websites, total] = await Promise.all([
    Website.find(query).sort(sortOrder).skip((page - 1) * limit).limit(limit).lean(),
    Website.countDocuments(query),
  ]);

  return json({ websites: serializeDocument(websites), pagination: { page, limit, total } });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) {
    return auth.response;
  }

  const { data, error } = await parseBody(request, websiteCreateSchema);

  if (error) {
    return error;
  }

  await connectToDatabase();

  let normalizedUrl: string;

  try {
    normalizedUrl = normalizeUrl(data.url);
  } catch {
    return apiError("Invalid URL", 422);
  }

  const duplicate = await Website.findOne({ userId: auth.user._id, normalizedUrl, isTrashed: false }).lean();

  if (duplicate) {
    return apiError("This website is already saved", 409, { website: serializeDocument(duplicate) });
  }

  const metadata = await scrapeMetadata(data.url);
  const website = await Website.create({
    userId: auth.user._id,
    folderId: data.folderId ?? null,
    url: metadata.url,
    normalizedUrl,
    domain: metadata.domain,
    title: metadata.title,
    description: metadata.description,
    faviconUrl: metadata.faviconUrl,
    ogImageUrl: metadata.ogImageUrl,
    tags: data.tags ?? [],
    notes: data.notes ?? "",
    isFavorite: data.isFavorite ?? false,
  });

  return json({ website: serializeDocument(website) }, 201);
}
