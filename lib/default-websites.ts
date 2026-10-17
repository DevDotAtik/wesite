import type { Types } from "mongoose";
import Website from "@/models/Website";
import { normalizeUrl } from "@/lib/scrapeMetadata";
import {
  DEFAULT_PREADDED_WEBSITES,
  type DefaultPreaddedWebsite,
} from "./default-websites-data";

export { DEFAULT_PREADDED_WEBSITES, type DefaultPreaddedWebsite };

/**
 * Seeds the 5 default pre-added websites for a user if they are not already present.
 */
export async function seedDefaultWebsitesForUser(userId: string | Types.ObjectId) {
  try {
    const existing = await Website.find({
      userId,
      isTrashed: false,
    })
      .select("normalizedUrl")
      .lean();

    const existingNormalizedUrls = new Set(existing.map((w) => w.normalizedUrl));

    const toInsert = DEFAULT_PREADDED_WEBSITES.filter(
      (site) => !existingNormalizedUrls.has(site.normalizedUrl),
    ).map((site) => ({
      userId,
      url: site.url,
      normalizedUrl: site.normalizedUrl || normalizeUrl(site.url),
      domain: site.domain,
      title: site.title,
      description: site.description,
      faviconUrl: site.faviconUrl,
      ogImageUrl: site.ogImageUrl,
      tags: site.tags,
      isFavorite: false,
      isTrashed: false,
      visitCount: 0,
      folderId: null,
    }));

    if (toInsert.length > 0) {
      await Website.insertMany(toInsert, { ordered: false });
    }
  } catch (error) {
    // If some duplicate key error occurs concurrently, log and ignore gracefully
    console.error("Error seeding default websites for user:", userId, error);
  }
}
