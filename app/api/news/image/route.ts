import type { NextRequest } from "next/server";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

// Global in-memory image cache to avoid repeating API calls
const imageCache = new Map<string, string | null>();

export async function resolveArticleImage(url: string): Promise<string | null> {
  if (!url) return null;
  if (imageCache.has(url)) {
    return imageCache.get(url) ?? null;
  }

  try {
    // 1. Query Microlink API to extract genuine OpenGraph / Twitter card / Hero image
    const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(4000),
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      const img = data.data?.image?.url || data.data?.logo?.url || null;
      if (img && typeof img === "string" && img.startsWith("http")) {
        imageCache.set(url, img);
        return img;
      }
    }
  } catch {
    // Ignore and proceed to fallback
  }

  // 2. Direct head/meta check if Microlink didn't return an image and URL is direct
  if (!url.includes("news.google.com")) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(2500),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
      });
      const html = await res.text();
      const m =
        html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
        html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);

      if (m && m[1] && m[1].startsWith("http")) {
        imageCache.set(url, m[1]);
        return m[1];
      }
    } catch {
      // Ignore
    }
  }

  // 3. Fallback to website screenshot for the source domain
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, "");
    if (domain && !domain.includes("google.com")) {
      const fallbackUrl = `https://image.thum.io/get/width/800/crop/450/noanimate/https://${domain}`;
      imageCache.set(url, fallbackUrl);
      return fallbackUrl;
    }
  } catch {
    // Ignore
  }

  imageCache.set(url, null);
  return null;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return json({ error: "Missing url parameter" }, 400);
  }

  const imageUrl = await resolveArticleImage(url);
  return json({ imageUrl });
}
