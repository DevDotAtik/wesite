"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  Check,
  ExternalLink,
  Flame,
  Globe,
  LayoutGrid,
  List,
  Newspaper,
  RefreshCw,
  Rss,
  Search,
  Share2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/navbar";

type NewsItem = {
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

type WebsiteNewsFeed = {
  websiteId: string;
  domain: string;
  title: string;
  faviconUrl: string;
  feedType: "direct" | "google_news" | "external_api";
  feedUrl: string | null;
  items: NewsItem[];
};

type EmptyFeed = {
  websiteId: string;
  domain: string;
  title: string;
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function estimateReadTime(text: string): string {
  const words = text ? text.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.min(7, Math.ceil((words + 100) / 70)));
  return `${minutes} min read`;
}

function getDomainTheme(domain: string) {
  const clean = domain.replace(/^www\./, "").toLowerCase();

  let category = "TECH";
  if (/ai|gpt|openai|claude|deepseek|anthropic|elevenlabs/i.test(clean)) category = "AI & ML";
  else if (/github|gitlab|code|dev|git/i.test(clean)) category = "DEV TOOLS";
  else if (/security|shodan|intel|hack|osint|stealer/i.test(clean)) category = "SECURITY";
  else if (/design|etienne|figma|css|ui/i.test(clean)) category = "DESIGN";
  else if (/google|openstreet|map|cloud|host/i.test(clean)) category = "INFRA";
  else if (/medium|substack|blog/i.test(clean)) category = "OPINION";

  const gradients = [
    { from: "#2563eb", to: "#1e40af", accent: "#60a5fa", labelColor: "bg-blue-600" },
    { from: "#7c3aed", to: "#5b21b6", accent: "#a78bfa", labelColor: "bg-purple-600" },
    { from: "#059669", to: "#065f46", accent: "#34d399", labelColor: "bg-emerald-600" },
    { from: "#d97706", to: "#92400e", accent: "#fbbf24", labelColor: "bg-amber-600" },
    { from: "#db2777", to: "#9d174d", accent: "#f472b6", labelColor: "bg-pink-600" },
    { from: "#0891b2", to: "#155e75", accent: "#22d3ee", labelColor: "bg-cyan-600" },
  ];

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const theme = gradients[Math.abs(hash) % gradients.length];

  return { ...theme, category };
}

/** Robust favicon component with reliable fallbacks */
function FaviconImg({
  src,
  domain,
  size = 20,
}: {
  src: string;
  domain: string;
  size?: number;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <Image
        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
        alt={domain}
        width={size}
        height={size}
        className="shrink-0 rounded-lg border object-contain p-0.5"
        style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}
        onError={() => setError(true)}
        unoptimized
      />
    );
  }

  return (
    <Image
      src={src}
      alt={domain}
      width={size}
      height={size}
      className="shrink-0 rounded-lg border object-contain p-0.5"
      style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}
      onError={() => setError(true)}
      unoptimized
    />
  );
}

/** Daily.dev styled visual cover image with stylized developer fallback */
function ArticleCover({
  imageUrl,
  title,
  domain,
  faviconUrl,
  category,
}: {
  imageUrl?: string;
  title: string;
  domain: string;
  faviconUrl?: string;
  category?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const theme = useMemo(() => getDomainTheme(domain), [domain]);
  const displayCategory = category || theme.category;

  if (imageUrl && !imgError) {
    return (
      <div className="relative aspect-[16/9] w-full overflow-hidden border-b-3" style={{ borderColor: "var(--nb-border)", background: "#111" }}>
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-zinc-800" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={title}
          className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
        />
        {/* Category tag chip overlay */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
          <span className="nb-tag text-[9px] font-extrabold uppercase tracking-wider" style={{ background: "#000", color: "#fff", borderColor: "rgba(255, 255, 255, 0.4)" }}>
            {displayCategory}
          </span>
        </div>
      </div>
    );
  }

  // Developer gradient cover (daily.dev style pattern)
  return (
    <div
      className="relative aspect-[16/9] w-full overflow-hidden border-b-3 p-4 flex flex-col justify-between"
      style={{
        borderColor: "var(--nb-border)",
        background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
      }}
    >
      {/* Decorative dot matrix overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />

      {/* Top category chip */}
      <div className="relative z-10 flex items-center justify-between">
        <span
          className="nb-tag text-[9px] font-extrabold uppercase tracking-wider text-white"
          style={{ background: "rgba(0, 0, 0, 0.4)", borderColor: "rgba(255, 255, 255, 0.3)" }}
        >
          {displayCategory}
        </span>
        <span className="font-mono text-[10px] font-bold text-white/70">
          {domain.replace(/^www\./, "")}
        </span>
      </div>

      {/* Centered stylized brand badge */}
      <div className="relative z-10 my-auto flex items-center gap-3">
        <div
          className="flex size-11 items-center justify-center rounded-xl border-2 p-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,0.4)]"
          style={{ borderColor: "#ffffff", background: "#ffffff" }}
        >
          <FaviconImg src={faviconUrl || ""} domain={domain} size={28} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black tracking-tight text-white drop-shadow-sm">
            {domain}
          </p>
          <p className="font-mono text-[10px] text-white/80">
            feed://latest
          </p>
        </div>
      </div>

      {/* Bottom code snippet visual decoration */}
      <div className="relative z-10 flex items-center justify-between font-mono text-[9px] text-white/60">
        <span>&lt;article /&gt;</span>
        <span>• • •</span>
      </div>
    </div>
  );
}

/** Full-width Spotlight / Hero Story component */
function SpotlightHero({
  item,
  onSave,
  isSaved,
}: {
  item: NewsItem;
  onSave: (item: NewsItem) => void;
  isSaved: boolean;
}) {
  const [fetchedImg, setFetchedImg] = useState<string | undefined>();
  const currentImg = item.imageUrl || fetchedImg;
  const [copied, setCopied] = useState(false);
  const theme = useMemo(() => getDomainTheme(item.domain), [item.domain]);

  useEffect(() => {
    if (item.imageUrl) return;
    let isMounted = true;
    fetch(`/api/news/image?url=${encodeURIComponent(item.link)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.imageUrl) {
          setFetchedImg(data.imageUrl);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [item.link, item.imageUrl]);

  return (
    <article className="nb-card-static nb-card-enter group relative mb-8 overflow-hidden transition-shadow hover:shadow-[8px_8px_0_0_var(--nb-shadow)]">
      <div className="grid gap-0 lg:grid-cols-12">
        {/* Cover image (large) */}
        <div className="lg:col-span-7">
          <ArticleCover
            imageUrl={currentImg}
            title={item.title}
            domain={item.domain}
            faviconUrl={item.faviconUrl}
            category={theme.category}
          />
        </div>

        {/* Content details */}
        <div className="flex flex-col justify-between p-5 sm:p-6 lg:col-span-5">
          <div>
            {/* Spotlight label */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="nb-tag text-[10px] font-black tracking-wide" style={{ background: "var(--nb-accent)", color: "var(--nb-accent-fg)" }}>
                <Flame className="size-3.5 fill-current" />
                Featured Story
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--nb-muted)" }}>
                {formatDate(item.published)}
              </span>
            </div>

            {/* Source info */}
            <div className="mb-3 flex items-center gap-2">
              <FaviconImg src={item.faviconUrl} domain={item.domain} size={18} />
              <span className="text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                {item.source || item.websiteTitle || item.domain}
              </span>
              <span className="text-xs" style={{ color: "var(--nb-muted)" }}>•</span>
              <span className="text-xs font-semibold" style={{ color: "var(--nb-muted)" }}>
                {estimateReadTime(item.summary)}
              </span>
            </div>

            {/* Headline */}
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group-hover:underline"
            >
              <h2 className="text-lg font-black leading-snug sm:text-xl" style={{ color: "var(--nb-fg)" }}>
                {item.title}
              </h2>
            </a>

            {/* Summary */}
            {item.summary ? (
              <p className="mt-2 text-xs leading-relaxed sm:text-sm line-clamp-3" style={{ color: "var(--nb-muted)" }}>
                {item.summary}
              </p>
            ) : null}
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t-2 pt-4" style={{ borderColor: "var(--nb-border)" }}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSave(item)}
                className={`nb-btn nb-btn-sm text-xs gap-1.5 font-bold ${isSaved ? "nb-btn-primary" : "nb-btn-surface"}`}
                title={isSaved ? "Saved in library & reading list" : "Save article to your Wesite library"}
              >
                {isSaved ? <BookmarkCheck className="size-3.5 fill-current" /> : <Bookmark className="size-3.5" />}
                <span>{isSaved ? "Saved" : "Save"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(item.link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  toast.success("Article link copied!");
                }}
                className="nb-btn nb-btn-ghost nb-btn-sm text-xs"
                title={copied ? "Copied!" : "Share link"}
              >
                {copied ? <Check className="size-3.5 text-emerald-500 nb-pop-in" /> : <Share2 className="size-3.5" />}
              </button>
            </div>

            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="nb-btn nb-btn-primary nb-btn-sm text-xs font-bold"
            >
              Read Article
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Standard Daily.dev Card Component */
function DailyDevCard({
  item,
  onSave,
  isSaved,
}: {
  item: NewsItem;
  onSave: (item: NewsItem) => void;
  isSaved: boolean;
}) {
  const [fetchedImg, setFetchedImg] = useState<string | undefined>();
  const currentImg = item.imageUrl || fetchedImg;
  const [copied, setCopied] = useState(false);
  const theme = useMemo(() => getDomainTheme(item.domain), [item.domain]);

  useEffect(() => {
    if (item.imageUrl) return;
    let isMounted = true;
    fetch(`/api/news/image?url=${encodeURIComponent(item.link)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.imageUrl) {
          setFetchedImg(data.imageUrl);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [item.link, item.imageUrl]);

  return (
    <article className="nb-card-static nb-card-enter group flex flex-col justify-between overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--nb-shadow)]">
      <div>
        {/* Cover Preview Image */}
        <ArticleCover
          imageUrl={currentImg}
          title={item.title}
          domain={item.domain}
          faviconUrl={item.faviconUrl}
          category={theme.category}
        />

        {/* Card Body */}
        <div className="p-4">
          {/* Source and date meta row */}
          <div className="mb-2 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <FaviconImg src={item.faviconUrl} domain={item.domain} size={15} />
              <span className="truncate text-[11px] font-bold" style={{ color: "var(--nb-fg)" }}>
                {item.source || item.websiteTitle || item.domain}
              </span>
            </div>
            <span className="shrink-0 text-[10px] font-semibold" style={{ color: "var(--nb-muted)" }}>
              {formatDate(item.published)}
            </span>
          </div>

          {/* Headline */}
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block group-hover:underline"
          >
            <h3 className="line-clamp-2 text-sm font-extrabold leading-snug" style={{ color: "var(--nb-fg)" }}>
              {item.title}
            </h3>
          </a>

          {/* Summary snippet */}
          {item.summary ? (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--nb-muted)" }}>
              {item.summary}
            </p>
          ) : null}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="flex items-center justify-between border-t-2 px-4 py-2.5" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSave(item)}
            className={`nb-btn nb-btn-sm text-[11px] h-7 px-2.5 gap-1.5 font-bold ${isSaved ? "nb-btn-primary" : "nb-btn-surface"}`}
            title={isSaved ? "Saved in library & reading list" : "Save article to your Wesite library"}
          >
            {isSaved ? <BookmarkCheck className="size-3.5 fill-current" /> : <Bookmark className="size-3.5" />}
            <span>{isSaved ? "Saved" : "Save"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(item.link);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
              toast.success("Link copied!");
            }}
            className="nb-btn nb-btn-ghost nb-btn-sm text-[11px] h-7 px-2"
            title={copied ? "Copied!" : "Share"}
          >
            {copied ? <Check className="size-3 text-emerald-500 nb-pop-in" /> : <Share2 className="size-3" />}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold hidden sm:inline" style={{ color: "var(--nb-muted)" }}>
            {estimateReadTime(item.summary)}
          </span>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm h-7 w-7"
            title="Read article"
          >
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    </article>
  );
}

/** Compact List Item Component */
function CompactNewsRow({
  item,
  onSave,
  isSaved,
}: {
  item: NewsItem;
  onSave: (item: NewsItem) => void;
  isSaved: boolean;
}) {
  const [fetchedImg, setFetchedImg] = useState<string | undefined>();
  const currentImg = item.imageUrl || fetchedImg;

  useEffect(() => {
    if (item.imageUrl) return;
    let isMounted = true;
    fetch(`/api/news/image?url=${encodeURIComponent(item.link)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.imageUrl) {
          setFetchedImg(data.imageUrl);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [item.link, item.imageUrl]);

  return (
    <article className="nb-card-static group flex items-center justify-between gap-4 p-3 transition-transform hover:-translate-x-0.5">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {currentImg ? (
          <div className="relative size-12 sm:size-14 shrink-0 overflow-hidden rounded-xl border-2" style={{ borderColor: "var(--nb-border)", background: "#111" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentImg} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          </div>
        ) : (
          <FaviconImg src={item.faviconUrl} domain={item.domain} size={28} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="nb-tag text-[9px] font-extrabold uppercase" style={{ color: "var(--nb-primary)" }}>
              {item.source || item.domain}
            </span>
            <span className="text-[10px] font-semibold" style={{ color: "var(--nb-muted)" }}>
              {formatDate(item.published)}
            </span>
          </div>
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="block truncate font-bold text-sm group-hover:underline" style={{ color: "var(--nb-fg)" }}>
            {item.title}
          </a>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onSave(item)}
          className={`nb-btn nb-btn-sm text-[11px] h-7 px-2.5 gap-1.5 font-bold ${isSaved ? "nb-btn-primary" : "nb-btn-surface"}`}
          title={isSaved ? "Saved in library & reading list" : "Save article to your Wesite library"}
        >
          {isSaved ? <BookmarkCheck className="size-3 fill-current" /> : <Bookmark className="size-3" />}
          <span>{isSaved ? "Saved" : "Save"}</span>
        </button>
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="nb-btn nb-btn-surface nb-btn-sm h-7 px-2.5 text-xs font-bold"
        >
          Read <ExternalLink className="size-3" />
        </a>
      </div>
    </article>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <div className="nb-card-static grid animate-pulse gap-0 overflow-hidden lg:grid-cols-12">
        <div className="aspect-[16/9] bg-gray-200 dark:bg-zinc-800 lg:col-span-7" />
        <div className="space-y-4 p-6 lg:col-span-5">
          <div className="h-4 w-28 rounded bg-gray-200 dark:bg-zinc-800" />
          <div className="h-8 w-4/5 rounded bg-gray-200 dark:bg-zinc-800" />
          <div className="h-16 w-full rounded bg-gray-200 dark:bg-zinc-800" />
          <div className="h-8 w-32 rounded bg-gray-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="nb-card-static animate-pulse overflow-hidden">
            <div className="aspect-[16/9] w-full bg-gray-200 dark:bg-zinc-800" />
            <div className="space-y-2.5 p-4">
              <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-zinc-800" />
              <div className="h-5 w-4/5 rounded bg-gray-200 dark:bg-zinc-800" />
              <div className="h-10 w-full rounded bg-gray-200 dark:bg-zinc-800" />
            </div>
            <div className="h-10 border-t-2 bg-gray-100 dark:bg-zinc-900" style={{ borderColor: "var(--nb-border)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NewsPage() {
  const [feeds, setFeeds] = useState<WebsiteNewsFeed[]>([]);
  const [emptyFeeds, setEmptyFeeds] = useState<EmptyFeed[]>([]);
  const [allArticles, setAllArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<"all" | "saved" | string>("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "grouped" | "compact">("cards");

  // Infinite scroll pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayCount, setDisplayCount] = useState(15);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Saved news stories map (stored in localStorage & synced with Wesite library)
  const [savedArticles, setSavedArticles] = useState<Map<string, NewsItem>>(() => {
    if (typeof window === "undefined") return new Map();
    try {
      const stored = localStorage.getItem("wesite_saved_news");
      if (stored) {
        const parsed: NewsItem[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return new Map(parsed.map((item) => [item.link, item]));
        }
      }
    } catch {}
    return new Map();
  });

  const handleSave = useCallback(
    async (item: NewsItem) => {
      const isAlreadySaved = savedArticles.has(item.link);

      if (isAlreadySaved) {
        setSavedArticles((prev) => {
          const next = new Map(prev);
          next.delete(item.link);
          try {
            localStorage.setItem("wesite_saved_news", JSON.stringify(Array.from(next.values())));
          } catch {}
          return next;
        });
        toast.info("Removed from saved stories");
      } else {
        setSavedArticles((prev) => {
          const next = new Map(prev);
          next.set(item.link, item);
          try {
            localStorage.setItem("wesite_saved_news", JSON.stringify(Array.from(next.values())));
          } catch {}
          return next;
        });

        // Also add the article into the user's permanent Wesite bookmarks library
        try {
          const cleanDomain = item.domain.replace(/^www\./, "").split(".")[0];
          const res = await fetch("/api/websites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: item.link,
              title: item.title,
              description: item.summary,
              tags: ["news", cleanDomain],
            }),
          });

          if (res.status === 201) {
            toast.success("Saved to your Wesite library & reading list!");
          } else if (res.status === 409) {
            toast.success("Saved in reading list (already in your library)!");
          } else {
            toast.success("Saved to your reading list!");
          }
        } catch {
          toast.success("Saved to your reading list!");
        }
      }
    },
    [savedArticles],
  );

  const loadNews = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const url = isRefresh ? "/api/news?refresh=true" : "/api/news";
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Please sign in to view your news feed.");
        } else {
          setError("Could not load news. Please try again.");
        }
        return;
      }

      const data = await res.json();
      setFeeds(data.feeds ?? []);
      setEmptyFeeds(data.emptyFeeds ?? []);
      setAllArticles(data.allArticles ?? []);
      setPage(1);
      setDisplayCount(15);
      setHasMore(true);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "TimeoutError") {
        setError("News feed request timed out. Please click Refresh to try again.");
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const initialLoad = async () => {
      try {
        const res = await fetch("/api/news", {
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
          if (!ignore) {
            if (res.status === 401) {
              setError("Please sign in to view your news feed.");
            } else {
              setError("Could not load news. Please try again.");
            }
          }
          return;
        }

        const data = await res.json();
        if (!ignore) {
          setFeeds(data.feeds ?? []);
          setEmptyFeeds(data.emptyFeeds ?? []);
          setAllArticles(data.allArticles ?? []);
          setPage(1);
          setDisplayCount(15);
          setHasMore(true);
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof Error && err.name === "TimeoutError") {
            setError("News feed request timed out. Please click Refresh to try again.");
          } else {
            setError("Network error. Please try again.");
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    initialLoad();
    return () => {
      ignore = true;
    };
  }, []);

  // Reset display count on search or filter change
  const [prevFilter, setPrevFilter] = useState(filter);
  const [prevSearch, setPrevSearch] = useState(search);
  if (filter !== prevFilter || search !== prevSearch) {
    setPrevFilter(filter);
    setPrevSearch(search);
    setDisplayCount(15);
  }

  // Unique domains across all loaded feeds
  const allDomains = useMemo(() => {
    return Array.from(new Set(feeds.map((f) => f.domain)));
  }, [feeds]);

  // Filtered articles list based on active filter and search query
  const filteredArticles = useMemo(() => {
    let list: NewsItem[];

    if (filter === "saved") {
      list = Array.from(savedArticles.values());
    } else if (filter === "all") {
      list = allArticles;
    } else {
      list = allArticles.filter((item) => item.domain === filter);
    }

    if (!search.trim()) return list;

    const q = search.toLowerCase();
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.domain.toLowerCase().includes(q) ||
        (item.source && item.source.toLowerCase().includes(q)),
    );
  }, [allArticles, filter, search, savedArticles]);

  // Auto load next stories when reaching end of page
  const loadMoreNews = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;

    // 1. If more local articles are available, display next batch immediately
    if (displayCount < filteredArticles.length) {
      setDisplayCount((prev) => Math.min(prev + 12, filteredArticles.length));
      return;
    }

    // 2. If all local articles are shown, request next page from server
    if (filter === "saved" || search.trim()) return;

    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const res = await fetch(`/api/news?page=${nextPage}`, {
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const data = await res.json();
        const newArticles: NewsItem[] = data.allArticles ?? [];
        const newFeeds: WebsiteNewsFeed[] = data.feeds ?? [];

        if (newArticles.length === 0) {
          setHasMore(false);
        } else {
          setAllArticles((prev) => {
            const existingLinks = new Set(prev.map((a) => a.link));
            const uniqueNew = newArticles.filter((a) => !existingLinks.has(a.link));
            return [...prev, ...uniqueNew];
          });

          setFeeds((prev) => {
            const existingIds = new Set(prev.map((f) => f.websiteId));
            const uniqueNewFeeds = newFeeds.filter((f) => !existingIds.has(f.websiteId));
            return [...prev, ...uniqueNewFeeds];
          });

          setPage(nextPage);
          setDisplayCount((prev) => prev + 12);
          setHasMore(Boolean(data.hasMore));
        }
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, hasMore, displayCount, filteredArticles.length, filter, search, page]);

  // IntersectionObserver for auto-loading when user reaches end of page
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreNews();
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [loadMoreNews]);

  const visibleArticles = useMemo(
    () => filteredArticles.slice(0, displayCount),
    [filteredArticles, displayCount],
  );
  const spotlightStory = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const remainingArticles = visibleArticles.length > 1 ? visibleArticles.slice(1) : [];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar search={search} onSearchChange={setSearch} />

      <main className="w-full flex-1 p-4 sm:p-6 lg:p-8 nb-page-enter">
        {/* Top Header Section (daily.dev style hero) */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="nb-tag text-xs font-black tracking-wide" style={{ background: "var(--nb-primary)", color: "#fff" }}>
                <Sparkles className="size-3.5" />
                DAILY FEED
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--nb-muted)" }}>
                {allArticles.length} stories from {feeds.length} sources
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl lg:text-4xl" style={{ color: "var(--nb-fg)" }}>
              The Dev & Tech Wire
            </h1>
            <p className="mt-1 text-xs font-semibold sm:text-sm" style={{ color: "var(--nb-muted)" }}>
              Breaking news, releases, and stories from your stored websites and the developer community
            </p>
          </div>

          {/* Right Toolbar: View toggle & Refresh */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border-3 p-0.5" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
              <button
                type="button"
                aria-label="Cards view"
                onClick={() => setViewMode("cards")}
                className={`nb-btn nb-btn-icon nb-btn-sm ${viewMode === "cards" ? "nb-btn-primary" : "nb-btn-ghost"}`}
                title="Daily.dev Cards View"
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="Grouped view"
                onClick={() => setViewMode("grouped")}
                className={`nb-btn nb-btn-icon nb-btn-sm ${viewMode === "grouped" ? "nb-btn-primary" : "nb-btn-ghost"}`}
                title="Grouped by Source"
              >
                <Newspaper className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="Compact list view"
                onClick={() => setViewMode("compact")}
                className={`nb-btn nb-btn-icon nb-btn-sm ${viewMode === "compact" ? "nb-btn-primary" : "nb-btn-ghost"}`}
                title="Compact List View"
              >
                <List className="size-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => loadNews(true)}
              disabled={loading || refreshing}
              className="nb-btn nb-btn-surface nb-btn-sm text-xs font-bold disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Toolbar: Search & Source Tabs */}
        {!loading && (feeds.length > 0 || savedArticles.size > 0) ? (
          <div className="mb-6 space-y-3">
            {/* Search within news */}
            <div className="relative max-w-md flex items-center">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <Search className="size-4 shrink-0 text-[var(--nb-muted)]" />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search headlines, AI, security, tools…"
                className="nb-input !h-9 w-full !pl-10 !pr-3 text-xs"
              />
            </div>

            {/* Source tabs with favicons & Saved tab */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`nb-btn nb-btn-sm text-xs font-bold ${filter === "all" ? "nb-btn-primary" : "nb-btn-ghost"}`}
              >
                <Globe className="size-3.5" />
                All Sources ({allArticles.length})
              </button>

              <button
                type="button"
                onClick={() => setFilter("saved")}
                className={`nb-btn nb-btn-sm text-xs font-bold gap-1.5 ${filter === "saved" ? "nb-btn-primary" : "nb-btn-ghost"}`}
              >
                <BookmarkCheck className={`size-3.5 ${savedArticles.size > 0 ? "text-amber-500" : ""}`} />
                Saved ({savedArticles.size})
              </button>

              {allDomains.map((domain) => {
                const feed = feeds.find((f) => f.domain === domain);
                const count = feed ? feed.items.length : 0;
                return (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => setFilter(domain === filter ? "all" : domain)}
                    className={`nb-btn nb-btn-sm text-xs font-bold gap-1.5 ${filter === domain ? "nb-btn-primary" : "nb-btn-ghost"}`}
                  >
                    <FaviconImg src={feed?.faviconUrl || ""} domain={domain} size={14} />
                    {domain} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Main Content Area */}
        {loading ? (
          <FeedSkeleton />
        ) : error ? (
          <div className="nb-card-static flex min-h-60 flex-col items-center justify-center gap-3 p-8 text-center">
            <AlertCircle className="size-9" style={{ color: "var(--nb-danger)" }} />
            <p className="text-base font-extrabold" style={{ color: "var(--nb-fg)" }}>
              {error}
            </p>
            {error.includes("sign in") ? (
              <Link href="/login" className="nb-btn nb-btn-primary nb-btn-sm mt-2">
                Sign In
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => loadNews(true)}
                className="nb-btn nb-btn-primary nb-btn-sm mt-2"
              >
                Try Again
              </button>
            )}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div
            className="nb-card-static flex min-h-72 flex-col items-center justify-center gap-3 border-dashed p-8 text-center"
            style={{ borderStyle: "dashed" }}
          >
            {filter === "saved" ? (
              <>
                <Bookmark className="size-10" style={{ color: "var(--nb-muted)" }} />
                <div>
                  <p className="text-base font-extrabold" style={{ color: "var(--nb-fg)" }}>
                    No saved articles yet
                  </p>
                  <p className="mt-1 max-w-sm text-xs" style={{ color: "var(--nb-muted)" }}>
                    Click &quot;Save&quot; on any story card to keep articles here and store them in your Wesite library.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="nb-btn nb-btn-primary nb-btn-sm mt-2"
                >
                  Browse Stories
                </button>
              </>
            ) : (
              <>
                <Rss className="size-10" style={{ color: "var(--nb-muted)" }} />
                <div>
                  <p className="text-base font-extrabold" style={{ color: "var(--nb-fg)" }}>
                    {allArticles.length === 0 ? "No articles found" : "No articles match your filter"}
                  </p>
                  <p className="mt-1 max-w-sm text-xs" style={{ color: "var(--nb-muted)" }}>
                    {allArticles.length === 0
                      ? "Save websites in your Wesite library, and daily news updates will appear here automatically."
                      : "Try clearing your search query or switching to 'All Sources'."}
                  </p>
                </div>
                {allArticles.length === 0 ? (
                  <Link href="/dashboard" className="nb-btn nb-btn-primary nb-btn-sm mt-2">
                    Go to Library
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setFilter("all");
                      setSearch("");
                    }}
                    className="nb-btn nb-btn-surface nb-btn-sm mt-2"
                  >
                    Reset Filters
                  </button>
                )}
              </>
            )}
          </div>
        ) : viewMode === "compact" ? (
          /* Compact List View */
          <div className="space-y-2">
            {visibleArticles.map((item, idx) => (
              <CompactNewsRow
                key={`${item.link}-${idx}`}
                item={item}
                onSave={handleSave}
                isSaved={savedArticles.has(item.link)}
              />
            ))}
          </div>
        ) : viewMode === "grouped" ? (
          /* Grouped by Website View */
          <div className="space-y-8">
            {feeds
              .filter((feed) => filter === "all" || feed.domain === filter)
              .map((feed) => {
                const feedItems = search
                  ? feed.items.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()))
                  : feed.items;

                if (feedItems.length === 0) return null;

                return (
                  <section key={feed.websiteId} className="space-y-4">
                    {/* Feed Header */}
                    <div className="flex items-center justify-between border-b-2 pb-2" style={{ borderColor: "var(--nb-border)" }}>
                      <div className="flex items-center gap-2.5">
                        <FaviconImg src={feed.faviconUrl} domain={feed.domain} size={24} />
                        <h2 className="text-base font-black" style={{ color: "var(--nb-fg)" }}>
                          {feed.title || feed.domain}
                        </h2>
                        <span className="nb-tag text-[9px] font-extrabold uppercase" style={{ color: "var(--nb-primary)" }}>
                          {feed.domain}
                        </span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: "var(--nb-muted)" }}>
                        {feedItems.length} stories
                      </span>
                    </div>

                    {/* Cards grid for this website */}
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                      {feedItems.map((item, idx) => (
                        <DailyDevCard
                          key={`${item.link}-${idx}`}
                          item={item}
                          onSave={handleSave}
                          isSaved={savedArticles.has(item.link)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
          </div>
        ) : (
          /* Daily.dev Unified Feed (Spotlight Hero + Multi-column Card Grid) */
          <div>
            {/* Top Spotlight Story if no search query */}
            {!search && spotlightStory ? (
              <SpotlightHero
                item={spotlightStory}
                onSave={handleSave}
                isSaved={savedArticles.has(spotlightStory.link)}
              />
            ) : null}

            {/* Grid of Daily.dev cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {(search ? visibleArticles : remainingArticles).map((item, idx) => (
                <DailyDevCard
                  key={`${item.link}-${idx}`}
                  item={item}
                  onSave={handleSave}
                  isSaved={savedArticles.has(item.link)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Infinite Scroll Sentinel & Auto-loader */}
        {!loading && !error && filteredArticles.length > 0 && (
          <div ref={sentinelRef} className="mt-8 flex flex-col items-center justify-center py-6">
            {loadingMore ? (
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--nb-muted)] nb-card-sm px-4 py-2">
                <RefreshCw className="size-4 animate-spin text-[var(--nb-primary)]" />
                <span>Loading more stories...</span>
              </div>
            ) : displayCount < filteredArticles.length || (hasMore && filter !== "saved" && !search) ? (
              <button
                type="button"
                onClick={loadMoreNews}
                className="nb-btn nb-btn-surface nb-btn-sm text-xs font-bold"
              >
                Load more stories
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--nb-muted)]">
                <span>You&apos;re all caught up! ✨</span>
              </div>
            )}
          </div>
        )}

        {/* Collapsed empty feeds list */}
        {!loading && !error && emptyFeeds.length > 0 ? (
          <details className="mt-10 group">
            <summary className="cursor-pointer select-none text-xs font-semibold" style={{ color: "var(--nb-muted)" }}>
              <span className="group-open:hidden">▸</span>
              <span className="hidden group-open:inline">▾</span> {emptyFeeds.length} website
              {emptyFeeds.length !== 1 ? "s" : ""} without current news articles
            </summary>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {emptyFeeds.map((f) => (
                <span key={f.websiteId} className="nb-tag text-xs" style={{ color: "var(--nb-muted)" }}>
                  {f.domain || f.title}
                </span>
              ))}
            </div>
          </details>
        ) : null}
      </main>
    </div>
  );
}
