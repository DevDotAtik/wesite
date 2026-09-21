import type { NextRequest } from "next/server";
import { apiError, json, parseBody, requireUser } from "@/lib/api";
import { scrapeMetadata } from "@/lib/scrapeMetadata";
import { metadataFetchSchema } from "@/lib/validators/schemas";

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

  let hostname = "";

  try {
    hostname = new URL(/^https?:\/\//i.test(data.url) ? data.url : `https://${data.url}`).hostname.toLowerCase();
  } catch {
    return apiError("Invalid URL", 422);
  }

  // Block server-side requests to private networks and cloud metadata.
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname === "169.254.169.254" ||
    hostname === "metadata.google.internal" ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    hostname === "::1"
  ) {
    return apiError("That URL cannot be fetched", 422);
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
