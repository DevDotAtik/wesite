import * as cheerio from "cheerio";

export type WebsiteMetadata = {
  url: string;
  normalizedUrl: string;
  domain: string;
  title: string;
  description: string;
  faviconUrl: string;
  ogImageUrl: string;
  scrapeStatus: "success" | "fallback";
  error?: string;
};

const USER_AGENT =
  "Mozilla/5.0 (compatible; WesiteBot/1.0; +https://example.com/wesite)";

export function normalizeUrl(input: string) {
  const withProtocol = /^https?:\/\//i.test(input.trim())
    ? input.trim()
    : `https://${input.trim()}`;
  const parsed = new URL(withProtocol);
  parsed.hash = "";

  // Canonical host: lowercase, strip www. so duplicates match.
  parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

  // Drop tracking parameters that create false-distinct URLs.
  for (const key of [...parsed.searchParams.keys()]) {
    if (/^(utm_|fbclid|gclid|mc_|igshid|yclid|msclkid)/i.test(key)) {
      parsed.searchParams.delete(key);
    }
  }

  if (parsed.pathname !== "/") {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }

  return parsed.toString().replace(/\/$/, "");
}

function fallbackAvatar(domain: string) {
  const initial = (domain.replace(/^www\./, "").charAt(0) || "W").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="24" fill="#2563eb"/><text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="white">${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function absoluteUrl(value: string | undefined, base: URL) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value, base).toString();
  } catch {
    return "";
  }
}

async function verifyFavicon(url: string) {
  if (!url || url.startsWith("data:")) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
}

export async function scrapeMetadata(rawUrl: string): Promise<WebsiteMetadata> {
  let normalizedUrl = "";
  let parsed: URL;

  try {
    normalizedUrl = normalizeUrl(rawUrl);
    parsed = new URL(normalizedUrl);
  } catch {
    return {
      url: rawUrl,
      normalizedUrl: rawUrl.trim(),
      domain: rawUrl.trim(),
      title: rawUrl.trim(),
      description: "",
      faviconUrl: fallbackAvatar(rawUrl.trim()),
      ogImageUrl: "",
      scrapeStatus: "fallback",
      error: "Invalid URL",
    };
  }

  const fallback = {
    url: normalizedUrl,
    normalizedUrl,
    domain: parsed.hostname,
    title: parsed.hostname.replace(/^www\./, ""),
    description: "",
    faviconUrl: fallbackAvatar(parsed.hostname),
    ogImageUrl: "",
    scrapeStatus: "fallback" as const,
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": USER_AGENT,
      },
    });
    clearTimeout(timer);

    const contentType = response.headers.get("content-type") ?? "";

    if (!response.ok || !contentType.includes("text/html")) {
      return {
        ...fallback,
        error: response.ok ? "Non-HTML response" : `HTTP ${response.status}`,
      };
    }

    // Refuse huge pages before buffering them into memory.
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > 2_000_000) {
      return { ...fallback, error: "Page is too large to read" };
    }

    const html = await response.text();

    if (html.length > 2_000_000) {
      return { ...fallback, error: "Page is too large to read" };
    }

    const $ = cheerio.load(html);
    const finalUrl = new URL(response.url || normalizedUrl);
    const title =
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $("title").first().text().trim() ||
      fallback.title;
    const description =
      $('meta[property="og:description"]').attr("content")?.trim() ||
      $('meta[name="description"]').attr("content")?.trim() ||
      "";
    const ogImageUrl = absoluteUrl($('meta[property="og:image"]').attr("content"), finalUrl);
    const iconHref =
      $('link[rel~="icon"]').first().attr("href") ||
      $('link[rel="shortcut icon"]').first().attr("href") ||
      $('link[rel="apple-touch-icon"]').first().attr("href");
    const iconCandidate = absoluteUrl(iconHref, finalUrl) || `${finalUrl.origin}/favicon.ico`;
    const faviconUrl = (await verifyFavicon(iconCandidate))
      ? iconCandidate
      : fallbackAvatar(finalUrl.hostname);

    return {
      url: finalUrl.toString().replace(/\/$/, ""),
      normalizedUrl,
      domain: finalUrl.hostname,
      title,
      description,
      faviconUrl,
      ogImageUrl,
      scrapeStatus: "success",
    };
  } catch (error) {
    return {
      ...fallback,
      error: error instanceof Error ? error.message : "Unable to fetch metadata",
    };
  }
}
