import * as cheerio from "cheerio";
import type { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { normalizeUrl, scrapeMetadata } from "@/lib/scrapeMetadata";
import Website from "@/models/Website";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);

  if (auth.response) return auth.response;

  await connectToDatabase();

  const body = await request.text();
  const $ = cheerio.load(body);
  const hrefs = $("a")
    .map((_, element) => $(element).attr("href"))
    .get()
    .filter(Boolean)
    .slice(0, 200);
  let imported = 0;
  let skipped = 0;

  for (const href of hrefs) {
    try {
      const normalizedUrl = normalizeUrl(href);
      const existing = await Website.exists({ userId: auth.user._id, normalizedUrl, isTrashed: false });

      if (existing) {
        skipped += 1;
        continue;
      }

      const metadata = await scrapeMetadata(href);
      await Website.create({
        userId: auth.user._id,
        url: metadata.url,
        normalizedUrl,
        domain: metadata.domain,
        title: metadata.title,
        description: metadata.description,
        faviconUrl: metadata.faviconUrl,
        ogImageUrl: metadata.ogImageUrl,
      });
      imported += 1;
    } catch {
      skipped += 1;
    }
  }

  return json({ imported, skipped });
}
