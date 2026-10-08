import type { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Website from "@/models/Website";
import { resolveArticleImage } from "@/app/api/news/image/route";

export const dynamic = "force-dynamic";

export type NewsItem = {
  title: string;
  link: string;
  summary: string;
  published: string;
  source?: string;
  domain: string;
  websiteTitle: string;
  faviconUrl: string;
  imageUrl?: string;
};

export type WebsiteNewsFeed = {
  websiteId: string;
  domain: string;
  title: string;
  faviconUrl: string;
  feedType: "direct" | "google_news" | "external_api";
  feedUrl: string | null;
  items: NewsItem[];
};

// Global in-memory cache with 15-minute TTL to ensure instant responses
type CacheEntry = {
  timestamp: number;
  data: {
    items: NewsItem[];
    feedType: "direct" | "google_news" | "external_api";
    feedUrl: string | null;
  };
};

const feedCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function cleanHtml(str: string): string {
  if (!str) return "";
  let text = str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'");
  text = text.replace(/<[^>]+>/g, " ");
  return text.replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function extractTag(text: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = regex.exec(text);
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']*)["']`, "i");
  const m = regex.exec(xml);
  return m ? m[1] : "";
}

function extractImageFromXml(itemXml: string): string {
  // 1. media:content url="..."
  let m = itemXml.match(/<media:content[^>]*url=["']([^"']+)["']/i);
  if (m && m[1] && /^https?:\/\//i.test(m[1])) return m[1];

  // 2. media:thumbnail url="..."
  m = itemXml.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i);
  if (m && m[1] && /^https?:\/\//i.test(m[1])) return m[1];

  // 3. enclosure url="..." type="image/..."
  m = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image\//i);
  if (m && m[1] && /^https?:\/\//i.test(m[1])) return m[1];

  // 4. img src in decoded html
  const decoded = itemXml.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
  m = decoded.match(/<img[^>]*src=["']([^"']+)["']/i);
  if (m && m[1] && /^https?:\/\//i.test(m[1])) return m[1];

  return "";
}

/** Direct probe for native RSS/Atom feeds (e.g. blog/feed) with a very tight 1.5s timeout */
async function fetchDirectRss(
  domain: string,
  websiteTitle: string,
  faviconUrl: string,
  ogImageUrl?: string,
): Promise<{ items: NewsItem[]; feedUrl: string } | null> {
  const candidateUrls = [`https://${domain}/feed`, `https://${domain}/rss.xml`];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(1500),
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/rss+xml, application/atom+xml, text/xml, application/xml, */*",
        },
      });

      if (!res.ok) continue;
      const text = await res.text();
      if (!text.includes("<rss") && !text.includes("<feed") && !text.includes("<channel")) {
        continue;
      }

      const items: NewsItem[] = [];
      const isAtom = /<feed[^>]*xmlns/i.test(text);

      if (isAtom) {
        const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
        let match;
        while ((match = entryRegex.exec(text)) !== null && items.length < 8) {
          const entry = match[1];
          const title = cleanHtml(extractTag(entry, "title"));
          const link = extractAttr(entry, "link", "href") || extractTag(entry, "link");
          const summary = cleanHtml(extractTag(entry, "summary") || extractTag(entry, "content"));
          const published = extractTag(entry, "published") || extractTag(entry, "updated");
          const itemImg =
            extractImageFromXml(entry) ||
            ogImageUrl ||
            `https://image.thum.io/get/width/800/crop/450/noanimate/https://${domain}`;

          if (title && link) {
            items.push({
              title,
              link,
              summary: summary.slice(0, 180),
              published,
              source: domain,
              domain,
              websiteTitle,
              faviconUrl,
              imageUrl: itemImg,
            });
          }
        }
      } else {
        const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
        let match;
        while ((match = itemRegex.exec(text)) !== null && items.length < 8) {
          const item = match[1];
          const title = cleanHtml(extractTag(item, "title"));
          const link = extractTag(item, "link") || extractTag(item, "guid");
          const summary = cleanHtml(extractTag(item, "description"));
          const published = extractTag(item, "pubDate");
          const itemImg =
            extractImageFromXml(item) ||
            ogImageUrl ||
            `https://image.thum.io/get/width/800/crop/450/noanimate/https://${domain}`;

          if (title && link) {
            items.push({
              title,
              link,
              summary: summary.slice(0, 180),
              published,
              source: domain,
              domain,
              websiteTitle,
              faviconUrl,
              imageUrl: itemImg,
            });
          }
        }
      }

      if (items.length > 0) {
        return { items, feedUrl: url };
      }
    } catch {
      // Proceed to next candidate
    }
  }

  return null;
}

/** Google News RSS search - guaranteed fast and covers any website/brand */
async function fetchGoogleNews(
  domain: string,
  websiteTitle: string,
  faviconUrl: string,
  ogImageUrl?: string,
): Promise<{ items: NewsItem[]; feedUrl: string }> {
  const cleanDomain = domain.replace(/^www\./, "").toLowerCase();
  const query = `site:${cleanDomain}`;
  const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en&gl=US&ceid=US:en`;

  try {
    const res = await fetch(feedUrl, {
      signal: AbortSignal.timeout(2800),
      headers: { "User-Agent": USER_AGENT },
    });

    if (!res.ok) {
      return { items: [], feedUrl };
    }

    const xml = await res.text();
    const items: NewsItem[] = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 8) {
      const itemXml = match[1];
      const rawTitle = cleanHtml(extractTag(itemXml, "title"));
      const link = extractTag(itemXml, "link") || extractTag(itemXml, "guid");
      const pubDate = extractTag(itemXml, "pubDate");
      let source = cleanHtml(extractTag(itemXml, "source"));

      let title = rawTitle;
      if (!source && rawTitle.includes(" - ")) {
        const parts = rawTitle.split(" - ");
        source = parts.pop()?.trim() || "";
        title = parts.join(" - ").trim();
      } else if (source && rawTitle.endsWith(` - ${source}`)) {
        title = rawTitle.slice(0, -(source.length + 3)).trim();
      }

      const desc = cleanHtml(extractTag(itemXml, "description"));
      const summary = desc && desc !== rawTitle && desc !== title ? desc.slice(0, 180) : "";
      const itemImg =
        extractImageFromXml(itemXml) ||
        ogImageUrl ||
        `https://image.thum.io/get/width/800/crop/450/noanimate/https://${cleanDomain}`;

      if (title && link) {
        items.push({
          title,
          link,
          summary,
          published: pubDate,
          source: source || cleanDomain,
          domain: cleanDomain,
          websiteTitle,
          faviconUrl,
          imageUrl: itemImg,
        });
      }
    }

    return { items, feedUrl };
  } catch {
    return { items: [], feedUrl };
  }
}

/** External News API 1: DEV.to Articles API (Public, provides rich verified cover & social images) */
async function fetchDevToArticles(tag?: string, limit: number = 10, page: number = 1): Promise<NewsItem[]> {
  try {
    const url = tag
      ? `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&per_page=${limit}&page=${page}`
      : `https://dev.to/api/articles?per_page=${limit}&page=${page}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(3500),
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((item: { title?: string; url?: string }) => item.title && item.url)
      .map((item: {
        title: string;
        url: string;
        description?: string;
        published_at?: string;
        user?: { name?: string };
        cover_image?: string;
        social_image?: string;
      }) => ({
        title: cleanHtml(item.title),
        link: item.url,
        summary: cleanHtml(item.description || "").slice(0, 180),
        published: item.published_at || new Date().toISOString(),
        source: item.user?.name ? `${item.user.name} • DEV` : "DEV Community",
        domain: "dev.to",
        websiteTitle: "DEV Community",
        faviconUrl: "https://dev.to/favicon.ico",
        imageUrl: item.cover_image || item.social_image || "",
      }));
  } catch {
    return [];
  }
}

/** External News API 2: Medium Technology & Programming RSS Feed (Public, provides high-res CDN images) */
async function fetchMediumFeed(tag: string = "programming", limit: number = 8): Promise<NewsItem[]> {
  try {
    const url = `https://medium.com/feed/tag/${encodeURIComponent(tag)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(3500),
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/rss+xml, text/xml, */*",
      },
    });

    if (!res.ok) return [];
    const xml = await res.text();
    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
      const itemXml = match[1];
      const rawTitle = cleanHtml(extractTag(itemXml, "title"));
      const link = extractTag(itemXml, "link");
      const pubDate = extractTag(itemXml, "pubDate");
      const creator = cleanHtml(extractTag(itemXml, "dc:creator"));
      const desc = extractTag(itemXml, "description") || extractTag(itemXml, "content:encoded");

      // Extract high-res image from Medium CDN
      let imageUrl = "";
      const imgMatch = desc.match(/<img[^>]+src=["'](https:\/\/cdn-images-1\.medium\.com\/[^"']+)["']/i);
      if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1];
      }

      const snippet = cleanHtml(desc).replace(/Continue reading on .*/i, "").trim().slice(0, 180);

      if (rawTitle && link) {
        items.push({
          title: rawTitle,
          link,
          summary: snippet,
          published: pubDate,
          source: creator ? `${creator} • Medium` : "Medium",
          domain: "medium.com",
          websiteTitle: "Medium Tech",
          faviconUrl: "https://medium.com/favicon.ico",
          imageUrl,
        });
      }
    }

    return items;
  } catch {
    return [];
  }
}

/** External News API 3: Generic RSS Feed Reader for TechCrunch, Hacker News, The Verge, etc. */
async function fetchGenericRssFeed(
  feedUrl: string,
  domain: string,
  websiteTitle: string,
  faviconUrl: string,
  limit: number = 8,
): Promise<NewsItem[]> {
  try {
    const res = await fetch(feedUrl, {
      signal: AbortSignal.timeout(3500),
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/rss+xml, text/xml, application/xml, */*",
      },
    });
    if (!res.ok) return [];
    const text = await res.text();
    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(text)) !== null && items.length < limit) {
      const itemXml = match[1];
      const title = cleanHtml(extractTag(itemXml, "title"));
      const link = extractTag(itemXml, "link");
      const summary = cleanHtml(extractTag(itemXml, "description") || extractTag(itemXml, "summary"));
      const published = extractTag(itemXml, "pubDate") || extractTag(itemXml, "dc:date");
      const itemImg = extractImageFromXml(itemXml);
      if (title && link) {
        items.push({
          title,
          link,
          summary: summary.slice(0, 180),
          published,
          source: websiteTitle,
          domain,
          websiteTitle,
          faviconUrl,
          imageUrl: itemImg || "",
        });
      }
    }
    return items;
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  const searchParams = request.nextUrl.searchParams;
  const forceRefresh = searchParams.get("refresh") === "true";
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;

  if (page > 1) {
    // Return next batch of developer articles and tech stories for infinite scroll
    const pageFeeds: WebsiteNewsFeed[] = [];
    const mediumTopics = [
      "programming",
      "technology",
      "artificial-intelligence",
      "software-engineering",
      "cybersecurity",
      "web-development",
      "cloud-computing",
      "data-science",
      "design",
      "devops",
    ];
    const mediumTopic = mediumTopics[(page - 1) % mediumTopics.length];

    const additionalSources = [
      {
        url: "https://techcrunch.com/feed/",
        domain: "techcrunch.com",
        title: "TechCrunch",
        icon: "https://techcrunch.com/favicon.ico",
      },
      {
        url: "https://hnrss.org/frontpage",
        domain: "news.ycombinator.com",
        title: "Hacker News",
        icon: "https://news.ycombinator.com/favicon.ico",
      },
      {
        url: "https://www.theverge.com/rss/index.xml",
        domain: "theverge.com",
        title: "The Verge",
        icon: "https://www.theverge.com/favicon.ico",
      },
      {
        url: "https://www.smashingmagazine.com/feed/",
        domain: "smashingmagazine.com",
        title: "Smashing Magazine",
        icon: "https://www.smashingmagazine.com/favicon.ico",
      },
    ];

    const source = additionalSources[(page - 2) % additionalSources.length];

    const [devToRes, mediumRes, sourceRes] = await Promise.allSettled([
      fetchDevToArticles(undefined, 10, page),
      fetchMediumFeed(mediumTopic, 8),
      source ? fetchGenericRssFeed(source.url, source.domain, source.title, source.icon, 8) : Promise.resolve([]),
    ]);

    if (devToRes.status === "fulfilled" && devToRes.value.length > 0) {
      pageFeeds.push({
        websiteId: `ext-dev-to-p${page}`,
        domain: "dev.to",
        title: "DEV Community",
        faviconUrl: "https://dev.to/favicon.ico",
        feedType: "external_api",
        feedUrl: `https://dev.to/api/articles?page=${page}`,
        items: devToRes.value,
      });
    }

    if (mediumRes.status === "fulfilled" && mediumRes.value.length > 0) {
      pageFeeds.push({
        websiteId: `ext-medium-${mediumTopic}`,
        domain: "medium.com",
        title: `Medium ${mediumTopic.replace(/-/g, " ").toUpperCase()}`,
        faviconUrl: "https://medium.com/favicon.ico",
        feedType: "external_api",
        feedUrl: `https://medium.com/feed/tag/${mediumTopic}`,
        items: mediumRes.value,
      });
    }

    if (sourceRes.status === "fulfilled" && sourceRes.value.length > 0 && source) {
      pageFeeds.push({
        websiteId: `ext-${source.domain}`,
        domain: source.domain,
        title: source.title,
        faviconUrl: source.icon,
        feedType: "direct",
        feedUrl: source.url,
        items: sourceRes.value,
      });
    }

    const allArticles: NewsItem[] = pageFeeds
      .flatMap((f) => f.items)
      .sort((a, b) => {
        const timeA = a.published ? new Date(a.published).getTime() : 0;
        const timeB = b.published ? new Date(b.published).getTime() : 0;
        return timeB - timeA;
      });

    return json({ feeds: pageFeeds, emptyFeeds: [], allArticles, page, hasMore: page < 15 });
  }

  await connectToDatabase();
  const websites = await Website.find({ userId: auth.user._id, isTrashed: false })
    .select("_id url domain title faviconUrl ogImageUrl createdAt tags")
    .sort({ createdAt: -1 })
    .lean();

  // Deduplicate by clean root domain
  const domainMap = new Map<string, typeof websites[0]>();
  const collectedTags: string[] = [];
  for (const w of websites) {
    const rawDomain = w.domain || (w.url ? new URL(w.url).hostname : "");
    const cleanDomain = rawDomain.replace(/^www\./, "").toLowerCase();
    if (cleanDomain && !domainMap.has(cleanDomain)) {
      domainMap.set(cleanDomain, w);
    }
    if (Array.isArray(w.tags)) {
      collectedTags.push(...w.tags);
    }
  }

  const uniqueWebsites = Array.from(domainMap.entries());

  // Fetch feeds concurrently with in-memory caching
  const now = Date.now();
  const feeds: WebsiteNewsFeed[] = [];
  const emptyFeeds: { websiteId: string; domain: string; title: string }[] = [];

  // 1. Fetch user's saved website feeds
  const websitePromises = uniqueWebsites.map(async ([domain, website]) => {
    const websiteTitle = website.title || domain;
    const faviconUrl = website.faviconUrl || "";
    const ogImageUrl = website.ogImageUrl || "";

    // Check in-memory cache unless force refresh
    if (!forceRefresh) {
      const cached = feedCache.get(domain);
      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        if (cached.data.items.length > 0) {
          const updatedItems = cached.data.items.map((item) => ({
            ...item,
            websiteTitle,
            faviconUrl,
            imageUrl:
              item.imageUrl ||
              ogImageUrl ||
              `https://image.thum.io/get/width/800/crop/450/noanimate/https://${domain}`,
          }));

          feeds.push({
            websiteId: String(website._id),
            domain,
            title: websiteTitle,
            faviconUrl,
            feedType: cached.data.feedType,
            feedUrl: cached.data.feedUrl,
            items: updatedItems,
          });
        } else {
          emptyFeeds.push({
            websiteId: String(website._id),
            domain,
            title: websiteTitle,
          });
        }
        return;
      }
    }

    // Fetch direct RSS and Google News in parallel
    const [directRes, googleRes] = await Promise.allSettled([
      fetchDirectRss(domain, websiteTitle, faviconUrl, ogImageUrl),
      fetchGoogleNews(domain, websiteTitle, faviconUrl, ogImageUrl),
    ]);

    let chosenItems: NewsItem[] = [];
    let chosenType: "direct" | "google_news" = "google_news";
    let chosenFeedUrl: string | null = null;

    if (directRes.status === "fulfilled" && directRes.value && directRes.value.items.length > 0) {
      chosenItems = directRes.value.items;
      chosenType = "direct";
      chosenFeedUrl = directRes.value.feedUrl;
    } else if (googleRes.status === "fulfilled" && googleRes.value.items.length > 0) {
      chosenItems = googleRes.value.items;
      chosenType = "google_news";
      chosenFeedUrl = googleRes.value.feedUrl;
    }

    // Save in cache
    feedCache.set(domain, {
      timestamp: now,
      data: {
        items: chosenItems,
        feedType: chosenType,
        feedUrl: chosenFeedUrl,
      },
    });

    if (chosenItems.length > 0) {
      feeds.push({
        websiteId: String(website._id),
        domain,
        title: websiteTitle,
        faviconUrl,
        feedType: chosenType,
        feedUrl: chosenFeedUrl,
        items: chosenItems,
      });
    } else {
      emptyFeeds.push({
        websiteId: String(website._id),
        domain,
        title: websiteTitle,
      });
    }
  });

  // 2. Fetch external developer news APIs (DEV.to and Medium Tech)
  const externalPromises = (async () => {
    // Determine relevant tag from user's tags if present
    const validTag = collectedTags.find((t) => /react|nextjs|javascript|python|ai|node|webdev|typescript/i.test(t));
    const [devToItems, mediumItems] = await Promise.allSettled([
      fetchDevToArticles(validTag, 10),
      fetchMediumFeed("programming", 8),
    ]);

    if (devToItems.status === "fulfilled" && devToItems.value.length > 0) {
      feeds.push({
        websiteId: "ext-dev-to",
        domain: "dev.to",
        title: "DEV Community",
        faviconUrl: "https://dev.to/favicon.ico",
        feedType: "external_api",
        feedUrl: "https://dev.to/api/articles",
        items: devToItems.value,
      });
    }

    if (mediumItems.status === "fulfilled" && mediumItems.value.length > 0) {
      feeds.push({
        websiteId: "ext-medium",
        domain: "medium.com",
        title: "Medium Tech",
        faviconUrl: "https://medium.com/favicon.ico",
        feedType: "external_api",
        feedUrl: "https://medium.com/feed/tag/programming",
        items: mediumItems.value,
      });
    }
  })();

  await Promise.all([...websitePromises, externalPromises]);

  // Sort feeds by article count, then domain
  feeds.sort((a, b) => b.items.length - a.items.length || a.domain.localeCompare(b.domain));

  // Construct unified chronological article list for daily.dev style feed
  const allArticles: NewsItem[] = feeds
    .flatMap((f) => f.items)
    .sort((a, b) => {
      const timeA = a.published ? new Date(a.published).getTime() : 0;
      const timeB = b.published ? new Date(b.published).getTime() : 0;
      return timeB - timeA;
    });

  // Pre-resolve genuine images for top stories that do not yet have an image
  const topPending = allArticles.filter((a) => !a.imageUrl).slice(0, 6);
  if (topPending.length > 0) {
    await Promise.allSettled(
      topPending.map(async (a) => {
        const resolved = await resolveArticleImage(a.link);
        if (resolved) {
          a.imageUrl = resolved;
        }
      }),
    );
  }

  return json({ feeds, emptyFeeds, allArticles, page: 1, hasMore: true });
}
