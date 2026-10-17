import type { NextRequest } from "next/server";
import { apiError, json, parseBody, requireUser } from "@/lib/api";
import { scrapeMetadata } from "@/lib/scrapeMetadata";
import { metadataFetchSchema } from "@/lib/validators/schemas";
import { isSafePublicUrl } from "@/lib/ssrf";

const lastRequests = new Map<string, number>();

export async function POST(request: NextRequest) {
  // Authenticated-only: this endpoint fetches arbitrary server-side URLs,
  // so it must never be usable anonymously.
  const auth = await requireUser(request);

  if (auth.response) {
    return auth.response;
  }

  const { data, error } = await parseBody(request, metadataFetchSchema);

  if (error) {
    return error;
  }

  const safety = await isSafePublicUrl(data.url);
  if (!safety.safe) {
    return apiError("That URL cannot be fetched: " + (safety.reason || "Unsafe target"), 422);
  }

  const key = String(auth.user._id);
  const now = Date.now();
  const last = lastRequests.get(key) ?? 0;

  if (now - last < 1000) {
    return json({ error: "Please wait before fetching metadata again" }, 429);
  }

  // Bound the map so it cannot grow without limit.
  if (lastRequests.size > 5000) {
    lastRequests.clear();
  }

  lastRequests.set(key, now);
  return json({ metadata: await scrapeMetadata(data.url) });
}
