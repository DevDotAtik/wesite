"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  Check,
  CheckSquare,
  Copy,
  ExternalLink,
  Pencil,
  RotateCcw,
  Square,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export type WebsiteItem = {
  _id: string;
  title: string;
  url: string;
  domain: string;
  description?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
  tags?: string[];
  notes?: string;
  customIconUrl?: string;
  isFavorite?: boolean;
  isTrashed?: boolean;
  folderId?: string | null;
  lastVisitedAt?: string | null;
  createdAt?: string;
  visitCount?: number;
};

type WebsiteCardProps = {
  website: WebsiteItem;
  view: "grid" | "list";
  mode?: "normal" | "trash";
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onOpen: (website: WebsiteItem) => void;
  onEdit: (website: WebsiteItem) => void;
  onCopy: (website: WebsiteItem) => void;
  onDelete: (website: WebsiteItem) => void;
  onToggleFavorite: (website: WebsiteItem) => void;
  onRestore?: (website: WebsiteItem) => void;
  onPermanentDelete?: (website: WebsiteItem) => void;
};

function getDomainCategory(domain: string, tags?: string[]) {
  if (tags && tags.length > 0) {
    return tags[0].toUpperCase();
  }
  const clean = domain.replace(/^www\./, "").toLowerCase();
  if (/ai|gpt|openai|claude|deepseek|anthropic|elevenlabs/i.test(clean)) return "AI & ML";
  if (/github|gitlab|code|dev|git/i.test(clean)) return "DEV";
  if (/security|shodan|intel|hack|osint|stealer/i.test(clean)) return "SECURITY";
  if (/design|etienne|figma|css|ui/i.test(clean)) return "DESIGN";
  if (/google|openstreet|map|cloud|host/i.test(clean)) return "TOOLS";
  return clean.split(".")[0]?.toUpperCase() || "WEB";
}

function getDomainGradient(domain: string) {
  const gradients = [
    { from: "#2563eb", to: "#1e40af" },
    { from: "#7c3aed", to: "#5b21b6" },
    { from: "#059669", to: "#065f46" },
    { from: "#d97706", to: "#92400e" },
    { from: "#db2777", to: "#9d174d" },
    { from: "#0891b2", to: "#155e75" },
  ];
  let hash = 0;
  for (let i = 0; i < domain.length; i++) hash = (hash * 31 + domain.charCodeAt(i)) >>> 0;
  return gradients[hash % gradients.length];
}

function FaviconImg({
  src,
  domain,
  size = 20,
}: {
  src?: string;
  domain: string;
  size?: number;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-lg border-2 text-[10px] font-extrabold uppercase"
        style={{
          width: size,
          height: size,
          borderColor: "var(--nb-border)",
          background: "var(--nb-primary)",
          color: "#fff",
        }}
      >
        {domain.replace(/^www\./, "").charAt(0)}
      </span>
    );
  }

  if (src.startsWith("data:")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={domain}
        width={size}
        height={size}
        className="shrink-0 rounded-lg border object-contain p-0.5"
        style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}
        onError={() => setError(true)}
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

export default function WebsiteCard({
  website,
  view,
  mode = "normal",
  selected = false,
  onSelect,
  onOpen,
  onEdit,
  onCopy,
  onDelete,
  onToggleFavorite,
  onRestore,
  onPermanentDelete,
}: WebsiteCardProps) {
  const [dragging, setDragging] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);

  // Automatic landing page screenshot URL with fallback to ogImageUrl
  const landingScreenshotUrl = useMemo(() => {
    if (website.ogImageUrl && website.ogImageUrl.startsWith("http")) {
      return website.ogImageUrl;
    }
    const cleanUrl = website.url.startsWith("http") ? website.url : `https://${website.url}`;
    return `https://s0.wp.com/mshots/v1/${encodeURIComponent(cleanUrl)}?w=800`;
  }, [website.url, website.ogImageUrl]);

  const lastVisited = website.lastVisitedAt
    ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
        new Date(website.lastVisitedAt),
      )
    : "Never";

  const visitCount = website.visitCount ?? 0;
  const category = useMemo(
    () => getDomainCategory(website.domain || website.url, website.tags),
    [website.domain, website.url, website.tags],
  );
  const gradient = useMemo(
    () => getDomainGradient(website.domain || website.url),
    [website.domain, website.url],
  );

  const [copied, setCopied] = useState(false);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(website.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("URL copied to clipboard!");
    } catch {
      onCopy(website);
    }
  };

  /* ============================================================
     LIST VIEW (Daily.dev Compact Row with 16:9 Landing Screenshot)
     ============================================================ */
  if (view === "list") {
    return (
      <article
        draggable={!selected}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("application/x-wesite-website-id", website._id);
          event.dataTransfer.setData("text/plain", website._id);
          if (logoRef.current) {
            event.dataTransfer.setDragImage(logoRef.current, 21, 21);
          }
          setDragging(true);
        }}
        onDragEnd={() => setDragging(false)}
        className={`nb-card nb-card-enter group relative flex items-center justify-between gap-4 p-3 transition-transform hover:-translate-x-0.5 ${
          selected ? "ring-2 ring-[var(--nb-primary)]" : ""
        } ${dragging ? "opacity-70" : ""}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          {/* Selection Checkbox */}
          {onSelect && mode !== "trash" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(website._id, !selected);
              }}
              aria-label={selected ? "Deselect" : "Select"}
              className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm shrink-0"
              style={{ color: selected ? "var(--nb-primary)" : "var(--nb-muted)" }}
            >
              {selected ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
            </button>
          )}

          {/* Landing page 16:9 thumbnail */}
          <div
            ref={logoRef}
            onClick={() => onOpen(website)}
            className="relative h-14 w-24 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 shadow-[2px_2px_0_0_var(--nb-border)]"
            style={{ borderColor: "var(--nb-border)", background: "#111" }}
          >
            {!imgLoaded && !imgError && (
              <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-zinc-800" />
            )}
            {!imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={landingScreenshotUrl}
                alt={website.title || website.domain}
                className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                  imgLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center font-black text-xs text-white"
                style={{
                  background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                }}
              >
                {(website.title || website.domain || "W").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Text details */}
          <div
            className="min-w-0 flex-1 cursor-pointer"
            onClick={() => (mode === "trash" ? undefined : onOpen(website))}
          >
            <div className="flex items-center gap-2">
              <FaviconImg
                src={website.customIconUrl || website.faviconUrl}
                domain={website.domain}
                size={14}
              />
              <span className="truncate text-xs font-semibold" style={{ color: "var(--nb-muted)" }}>
                {website.domain}
              </span>
              <span className="nb-tag text-[9px] font-extrabold uppercase">{category}</span>
              {website.isFavorite && (
                <Star className="size-3 shrink-0 fill-[var(--nb-warning)] text-[var(--nb-warning)]" />
              )}
            </div>

            <h3
              className="mt-0.5 truncate text-sm font-black group-hover:underline"
              style={{ color: "var(--nb-fg)" }}
            >
              {website.title || website.domain}
            </h3>

            {website.description ? (
              <p
                className="mt-0.5 truncate text-xs leading-relaxed"
                style={{ color: "var(--nb-muted)" }}
              >
                {website.description}
              </p>
            ) : null}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex shrink-0 items-center gap-1">
          {mode === "trash" ? (
            <>
              <button
                type="button"
                onClick={() => onRestore?.(website)}
                className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm"
                title="Restore"
              >
                <RotateCcw className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onPermanentDelete?.(website)}
                className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm"
                style={{ color: "var(--nb-danger)" }}
                title="Delete permanently"
              >
                <Trash2 className="size-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onToggleFavorite(website)}
                className={`nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm ${
                  website.isFavorite ? "text-[var(--nb-warning)]" : ""
                }`}
                title={website.isFavorite ? "Favorited" : "Add to favorites"}
              >
                <Star
                  className={`size-4 ${
                    website.isFavorite ? "fill-[var(--nb-warning)] text-[var(--nb-warning)]" : ""
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm"
                title={copied ? "Copied!" : "Copy link"}
              >
                {copied ? <Check className="size-4 text-emerald-500 nb-pop-in" /> : <Copy className="size-4" />}
              </button>
              <button
                type="button"
                onClick={() => onEdit(website)}
                className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm"
                title="Edit"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onOpen(website)}
                className="nb-btn nb-btn-surface nb-btn-icon nb-btn-sm"
                title="Open website"
              >
                <ExternalLink className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(website)}
                className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm text-[var(--nb-danger)]"
                title="Move to trash"
              >
                <Trash2 className="size-4" />
              </button>
            </>
          )}
        </div>
      </article>
    );
  }

  /* ============================================================
     GRID VIEW (Daily.dev Styled Card with 16:9 Landing Screenshot)
     ============================================================ */
  return (
    <article
      draggable={!selected}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/x-wesite-website-id", website._id);
        event.dataTransfer.setData("text/plain", website._id);
        if (logoRef.current) {
          event.dataTransfer.setDragImage(logoRef.current, 21, 21);
        }
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={`nb-card-static nb-card-enter group flex flex-col justify-between overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--nb-shadow)] ${
        selected ? "ring-2 ring-[var(--nb-primary)]" : ""
      } ${dragging ? "opacity-70" : ""}`}
    >
      <div>
        {/* Cover 16:9 Landing Page Screenshot Banner */}
        <div
          ref={logoRef}
          onClick={() => (mode === "trash" ? undefined : onOpen(website))}
          className="relative aspect-[16/9] w-full cursor-pointer overflow-hidden border-b-3"
          style={{ borderColor: "var(--nb-border)", background: "#111" }}
        >
          {/* Skeleton while loading */}
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-zinc-800" />
          )}

          {!imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={landingScreenshotUrl}
              alt={website.title || website.domain}
              className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          ) : (
            /* Developer Pattern Fallback */
            <div
              className="flex h-full w-full flex-col justify-between p-4 text-white"
              style={{
                background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="nb-tag text-[9px] font-black uppercase text-white" style={{ background: "rgba(0,0,0,0.4)" }}>
                  {category}
                </span>
                <span className="font-mono text-[10px] text-white/70">{website.domain}</span>
              </div>
              <div className="my-auto flex items-center justify-center">
                <div className="flex size-12 items-center justify-center rounded-xl border-2 bg-white/95 p-1 shadow-md">
                  <FaviconImg
                    src={website.customIconUrl || website.faviconUrl}
                    domain={website.domain}
                    size={32}
                  />
                </div>
              </div>
              <div className="font-mono text-[9px] text-white/60">
                <span>&lt;website /&gt;</span>
              </div>
            </div>
          )}

          {/* Top-Left Category Badge */}
          <div className="absolute left-3 top-3 z-10">
            <span
              className="nb-tag text-[9px] font-extrabold uppercase tracking-wider backdrop-blur-md"
              style={{
                background: "rgba(0, 0, 0, 0.75)",
                color: "#fff",
                borderColor: "rgba(255, 255, 255, 0.25)",
              }}
            >
              {category}
            </span>
          </div>

          {/* Top-Right Favorite / Select Controls */}
          <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
            {onSelect && mode !== "trash" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(website._id, !selected);
                }}
                aria-label={selected ? "Deselect" : "Select"}
                className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm backdrop-blur-md"
                style={{
                  background: "rgba(255, 255, 255, 0.85)",
                  color: selected ? "var(--nb-primary)" : "var(--nb-fg)",
                }}
              >
                {selected ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
              </button>
            )}
            {website.isFavorite && (
              <span
                className="flex size-7 items-center justify-center rounded-lg border-2 shadow-sm backdrop-blur-md"
                style={{
                  background: "rgba(255, 255, 255, 0.9)",
                  borderColor: "var(--nb-border)",
                }}
              >
                <Star className="size-3.5 fill-[var(--nb-warning)] text-[var(--nb-warning)]" />
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div
          className="cursor-pointer p-4"
          onClick={() => (mode === "trash" ? undefined : onOpen(website))}
        >
          {/* Source branding row */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <FaviconImg
                src={website.customIconUrl || website.faviconUrl}
                domain={website.domain}
                size={16}
              />
              <span
                className="truncate text-xs font-semibold"
                style={{ color: "var(--nb-muted)" }}
              >
                {website.domain}
              </span>
            </div>

            {mode !== "trash" && visitCount > 0 && (
              <span className="nb-tag text-[9px] font-bold">
                <BarChart3 className="size-2.5" />
                {visitCount}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className="text-sm font-black leading-snug line-clamp-1 group-hover:underline"
            style={{ color: "var(--nb-fg)" }}
            title={website.title || website.domain}
          >
            {website.title || website.domain}
          </h3>

          {/* Description */}
          {website.description ? (
            <p
              className="mt-1 text-xs leading-relaxed line-clamp-2"
              style={{ color: "var(--nb-muted)" }}
              title={website.description}
            >
              {website.description}
            </p>
          ) : (
            <p className="mt-1 text-xs italic" style={{ color: "var(--nb-muted)" }}>
              {website.url}
            </p>
          )}

          {/* Tags */}
          {website.tags && website.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {website.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="nb-tag text-[9px] font-semibold">
                  #{tag}
                </span>
              ))}
              {website.tags.length > 3 && (
                <span className="nb-tag text-[9px]">+{website.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Actions Bar (daily.dev style) */}
      <div
        className="flex items-center justify-between border-t-2 px-4 py-2.5"
        style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}
      >
        <div className="flex items-center gap-1">
          {mode === "trash" ? (
            <>
              <button
                type="button"
                onClick={() => onRestore?.(website)}
                className="nb-btn nb-btn-surface nb-btn-sm text-xs font-bold"
                title="Restore website"
              >
                <RotateCcw className="size-3.5" />
                Restore
              </button>
              <button
                type="button"
                onClick={() => onPermanentDelete?.(website)}
                className="nb-btn nb-btn-ghost nb-btn-sm text-xs font-bold"
                style={{ color: "var(--nb-danger)" }}
                title="Delete permanently"
              >
                <Trash2 className="size-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onToggleFavorite(website)}
                className={`nb-btn nb-btn-sm text-xs h-7 px-2.5 gap-1 ${
                  website.isFavorite ? "nb-btn-primary" : "nb-btn-surface"
                }`}
                title={website.isFavorite ? "Remove favorite" : "Favorite website"}
              >
                <Star
                  className={`size-3 ${
                    website.isFavorite ? "fill-current text-white" : ""
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="nb-btn nb-btn-ghost nb-btn-sm text-xs h-7 px-2"
                title={copied ? "Copied!" : "Copy URL"}
              >
                {copied ? <Check className="size-3.5 text-emerald-500 nb-pop-in" /> : <Copy className="size-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => onEdit(website)}
                className="nb-btn nb-btn-ghost nb-btn-sm text-xs h-7 px-2"
                title="Edit website"
              >
                <Pencil className="size-3.5" />
              </button>
            </>
          )}
        </div>

        {mode !== "trash" && (
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] font-semibold hidden sm:inline"
              style={{ color: "var(--nb-muted)" }}
            >
              {lastVisited === "Never" ? "Unvisited" : lastVisited}
            </span>
            <button
              type="button"
              onClick={() => onOpen(website)}
              className="nb-btn nb-btn-surface nb-btn-icon nb-btn-sm h-7 w-7"
              title="Open website"
            >
              <ExternalLink className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(website)}
              className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm h-7 w-7 text-[var(--nb-danger)]"
              title="Move to trash"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
