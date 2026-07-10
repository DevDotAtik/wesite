import type { NextRequest } from "next/server";
import { json, parseBody } from "@/lib/api";
import { scrapeMetadata } from "@/lib/scrapeMetadata";
import { metadataFetchSchema } from "@/lib/validators/schemas";

const lastRequests = new Map<string, number>();

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, metadataFetchSchema);

  if (error) {
    return error;
  }

  const key = request.headers.get("x-forwarded-for") ?? "local";
  const now = Date.now();
  const last = lastRequests.get(key) ?? 0;

  if (now - last < 1000) {
    return json({ error: "Please wait before fetching metadata again" }, 429);
  }

  lastRequests.set(key, now);
  return json({ metadata: await scrapeMetadata(data.url) });
}
