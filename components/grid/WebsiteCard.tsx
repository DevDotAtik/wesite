"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  Check,
  ExternalLink,
  Pencil,
  RotateCcw,
  Share2,
  Star,
  Trash2,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { AddToWebFlowModal } from "@/components/webflow/AddToWebFlowModal";

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
  const [isWebFlowModalOpen, setIsWebFlowModalOpen] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);

  // Automatic landing page screenshot URL with fallback to ogImageUrl
  const landingScreenshotUrl = useMemo(() => {
    if (website.ogImageUrl && website.ogImageUrl.startsWith("http")) {
      return website.ogImageUrl;
    }
    const cleanUrl = website.url.startsWith("http") ? website.url : `https://${website.url}`;
    return `https://s0.wp.com/mshots/v1/${encodeURIComponent(cleanUrl)}?w=800`;
  }, [website.url, website.ogImageUrl]);

  const createdOn = useMemo(() => {
    if (!website.createdAt) return "";
    try {
      return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
        new Date(website.createdAt),
      );
    } catch {
      return "";
    }
  }, [website.createdAt]);

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
      if (typeof navigator !== "undefined" && navigator.share && window.isSecureContext) {
        try {
          await navigator.share({
            title: website.title || website.domain,
            url: website.url,
          });
          toast.success("Link shared successfully!");
          return;
        } catch (shareErr) {
          if ((shareErr as Error).name === "AbortError") return;
        }
      }
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
      <>
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
        className={`nb-card nb-card-enter group relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 p-3 transition-transform hover:-translate-x-0.5 ${
          selected ? "ring-2 ring-[var(--nb-primary)]" : ""
        } ${dragging ? "opacity-70" : ""}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3.5">
          {/* Selection Checkbox */}
          {onSelect && mode !== "trash" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(website._id, !selected);
              }}
              aria-label={selected ? "Deselect" : "Select"}
              title={selected ? "Deselect" : "Select"}
              className={`flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                selected
                  ? "border-[var(--nb-border)] bg-[var(--nb-primary)] text-white shadow-xs opacity-100"
                  : "border-[var(--nb-border)]/40 bg-[var(--nb-surface)] text-[var(--nb-muted)] hover:border-[var(--nb-border)] hover:text-[var(--nb-fg)] opacity-0 group-hover:opacity-100"
              }`}
            >
              {selected ? (
                <Check className="size-3.5 stroke-[3]" />
              ) : (
                <span className="size-2 rounded-xs border border-current" />
              )}
            </button>
          )}

          {/* Landing page 16:9 thumbnail */}
          <div
            ref={logoRef}
            onClick={() => onOpen(website)}
            className="relative h-13 w-20 sm:h-14 sm:w-24 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 shadow-[2px_2px_0_0_var(--nb-border)]"
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
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <FaviconImg
                src={website.customIconUrl || website.faviconUrl}
                domain={website.domain}
                size={14}
              />
              <span className="truncate text-xs font-semibold" style={{ color: "var(--nb-muted)" }}>
                {website.domain}
              </span>
              <span className="nb-tag shrink-0 text-[9px] font-extrabold uppercase">{category}</span>
              {createdOn ? (
                <span className="hidden sm:inline shrink-0 text-[10px] font-medium" style={{ color: "var(--nb-muted)" }}>
                  • {createdOn}
                </span>
              ) : null}
              {website.isFavorite && (
                <Star className="size-3 shrink-0 fill-[var(--nb-warning)] text-[var(--nb-warning)]" />
              )}
            </div>

            <h3
              className="mt-0.5 truncate text-sm font-black group-hover:underline"
              style={{ color: "var(--nb-fg)" }}
              title={website.title || website.domain}
            >
              {website.title || website.domain}
            </h3>

            {website.description ? (
              <p
                className="mt-0.5 truncate text-xs leading-relaxed"
                style={{ color: "var(--nb-muted)" }}
                title={website.description}
              >
                {website.description}
              </p>
            ) : null}
          </div>
        </div>

        {/* Action Buttons & Metadata Row */}
        <div className="flex w-full sm:w-auto shrink-0 items-center justify-between sm:justify-end gap-1.5 border-t border-[var(--nb-border)]/15 pt-2 sm:border-t-0 sm:pt-0">
          {/* Metadata on mobile: Adding date or visit count */}
          <div className="flex items-center gap-2 min-w-0 sm:hidden">
            {createdOn ? (
              <span className="text-[10px] font-semibold" style={{ color: "var(--nb-muted)" }}>
                Added {createdOn}
              </span>
            ) : null}
            {mode !== "trash" && visitCount > 0 ? (
              <span className="nb-tag text-[9px] font-bold">
                <BarChart3 className="size-2.5" />
                {visitCount}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 ml-auto sm:ml-0 shrink-0">
            {mode === "trash" ? (
              <>
                <button
                  type="button"
                  onClick={() => onRestore?.(website)}
                  className="nb-btn nb-btn-surface nb-btn-sm h-8 px-2.5 text-xs font-bold gap-1 border-2"
                  title="Restore"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Restore</span>
                </button>
                <button
                  type="button"
                  onClick={() => onPermanentDelete?.(website)}
                  className="nb-btn nb-btn-ghost nb-btn-sm h-8 px-2.5 text-xs font-bold gap-1"
                  style={{ color: "var(--nb-danger)" }}
                  title="Delete permanently"
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(website);
                  }}
                  className={`nb-btn nb-btn-surface nb-btn-icon size-8 sm:h-8.5 sm:w-8.5 border-2 ${
                    website.isFavorite ? "border-amber-400 bg-amber-400/15 text-amber-500" : ""
                  }`}
                  title={website.isFavorite ? "Favorited (click to remove)" : "Add to favorites"}
                  aria-label="Toggle favorite"
                >
                  <Star
                    className={`size-3.5 sm:size-4 ${
                      website.isFavorite ? "fill-amber-500 text-amber-500" : ""
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="nb-btn nb-btn-surface nb-btn-icon size-8 sm:h-8.5 sm:w-8.5 border-2"
                  title={copied ? "Copied to clipboard!" : "Share / Copy link"}
                  aria-label="Share link"
                >
                  {copied ? <Check className="size-3.5 sm:size-4 text-emerald-500 nb-pop-in" /> : <Share2 className="size-3.5 sm:size-4" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(website);
                  }}
                  className="nb-btn nb-btn-surface nb-btn-icon size-8 sm:h-8.5 sm:w-8.5 border-2"
                  title="Edit website"
                  aria-label="Edit website"
                >
                  <Pencil className="size-3.5 sm:size-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsWebFlowModalOpen(true);
                  }}
                  className="nb-btn nb-btn-surface nb-btn-icon size-8 sm:h-8.5 sm:w-8.5 border-2 text-indigo-600 hover:border-indigo-500 hover:bg-indigo-500/10"
                  title="Add to WebFlow"
                  aria-label="Add to WebFlow"
                >
                  <Workflow className="size-3.5 sm:size-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(website);
                  }}
                  className="nb-btn nb-btn-surface nb-btn-icon size-8 sm:h-8.5 sm:w-8.5 border-2"
                  title="Open website"
                  aria-label="Open website"
                >
                  <ExternalLink className="size-3.5 sm:size-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(website);
                  }}
                  className="nb-btn nb-btn-surface nb-btn-icon size-8 sm:h-8.5 sm:w-8.5 border-2 text-rose-600 hover:border-rose-500 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400"
                  title="Move to trash"
                  aria-label="Delete website"
                >
                  <Trash2 className="size-3.5 sm:size-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </article>

      <AddToWebFlowModal
        isOpen={isWebFlowModalOpen}
        onClose={() => setIsWebFlowModalOpen(false)}
        website={website}
      />
    </>
  );
}

  /* ============================================================
     GRID VIEW (Daily.dev Styled Card with 16:9 Landing Screenshot)
     ============================================================ */
  return (
    <>
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
          className="relative aspect-[16/9] w-full cursor-pointer overflow-hidden border-b-2 bg-[var(--nb-surface-alt)] flex items-center justify-center"
          style={{ borderColor: "var(--nb-border)" }}
        >
          {/* Skeleton while loading */}
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
          )}

          {!imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={landingScreenshotUrl}
              alt={website.title || website.domain}
              className={`h-full w-full object-contain p-0.5 transition-transform duration-300 group-hover:scale-[1.02] ${
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

          {/* Select Checkbox - blends with card, shows on hover or when selected */}
          {onSelect && mode !== "trash" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(website._id, !selected);
              }}
              aria-label={selected ? "Deselect" : "Select"}
              title={selected ? "Deselect" : "Select"}
              className={`absolute top-2.5 left-2.5 z-10 flex size-7 items-center justify-center rounded-lg border-2 backdrop-blur-md transition-all duration-200 ${
                selected
                  ? "opacity-100 border-[var(--nb-border)] bg-[var(--nb-primary)] text-white shadow-xs scale-105"
                  : "opacity-0 group-hover:opacity-100 border-white/50 bg-black/45 text-white hover:bg-black/75 hover:border-white shadow-xs"
              }`}
            >
              {selected ? (
                <Check className="size-4 stroke-[3]" />
              ) : (
                <span className="size-2 rounded-xs border-2 border-white/80" />
              )}
            </button>
          )}
        </div>

        {/* Card Body */}
        <div
          className="cursor-pointer p-4"
          onClick={() => (mode === "trash" ? undefined : onOpen(website))}
        >
          {/* Source branding row */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
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
              <span className="nb-tag shrink-0 text-[9px] font-extrabold uppercase">
                {category}
              </span>
            </div>

            {mode !== "trash" && (
              <div className="flex items-center gap-1.5 shrink-0">
                {createdOn ? (
                  <span className="text-[10px] font-medium" style={{ color: "var(--nb-muted)" }}>
                    {createdOn}
                  </span>
                ) : null}
                {visitCount > 0 && (
                  <span className="nb-tag text-[9px] font-bold">
                    <BarChart3 className="size-2.5" />
                    {visitCount}
                  </span>
                )}
              </div>
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

      {/* Card Footer Actions Bar */}
      <div
        className="flex items-center justify-between border-t-2 px-3 py-2 sm:px-3.5"
        style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}
      >
        {mode === "trash" ? (
          <div className="flex items-center gap-1.5 w-full justify-between">
            <button
              type="button"
              onClick={() => onRestore?.(website)}
              className="nb-btn nb-btn-surface nb-btn-sm h-8 px-2.5 text-xs font-bold gap-1 border-2"
              title="Restore website"
            >
              <RotateCcw className="size-3.5" />
              <span>Restore</span>
            </button>
            <button
              type="button"
              onClick={() => onPermanentDelete?.(website)}
              className="nb-btn nb-btn-ghost nb-btn-sm h-8 px-2.5 text-xs font-bold gap-1"
              style={{ color: "var(--nb-danger)" }}
              title="Delete permanently"
            >
              <Trash2 className="size-3.5" />
              <span>Delete</span>
            </button>
          </div>
        ) : (
          <>
            {/* Left Action Buttons: Favorite, Share, Edit */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Favorite Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(website);
                }}
                className={`nb-btn nb-btn-surface nb-btn-icon size-8 border-2 transition-all ${
                  website.isFavorite
                    ? "border-amber-400 bg-amber-400/15 text-amber-500 hover:bg-amber-400/25"
                    : "text-[var(--nb-muted)] hover:text-amber-500"
                }`}
                title={website.isFavorite ? "Favorited (click to remove)" : "Add to favorites"}
                aria-label="Toggle favorite"
              >
                <Star
                  className={`size-3.5 sm:size-4 ${
                    website.isFavorite ? "fill-amber-500 text-amber-500" : ""
                  }`}
                />
              </button>

              {/* Share / Copy Button */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="nb-btn nb-btn-surface nb-btn-icon size-8 border-2 text-[var(--nb-muted)] hover:text-[var(--nb-fg)] transition-all"
                title={copied ? "Copied to clipboard!" : "Share / Copy link"}
                aria-label="Share link"
              >
                {copied ? (
                  <Check className="size-3.5 sm:size-4 text-emerald-500 nb-pop-in" />
                ) : (
                  <Share2 className="size-3.5 sm:size-4" />
                )}
              </button>

              {/* Edit Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(website);
                }}
                className="nb-btn nb-btn-surface nb-btn-icon size-8 border-2 text-[var(--nb-muted)] hover:text-[var(--nb-fg)] transition-all"
                title="Edit website"
                aria-label="Edit website"
              >
                <Pencil className="size-3.5 sm:size-4" />
              </button>
            </div>

            {/* Right Action Buttons: Open, Delete */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsWebFlowModalOpen(true);
                }}
                className="nb-btn nb-btn-surface nb-btn-icon size-8 border-2 text-indigo-600 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all"
                title="Add to WebFlow"
                aria-label="Add to WebFlow"
              >
                <Workflow className="size-3.5 sm:size-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(website);
                }}
                className="nb-btn nb-btn-surface nb-btn-icon size-8 border-2 text-[var(--nb-muted)] hover:text-[var(--nb-fg)] transition-all"
                title="Open website in new tab"
                aria-label="Open website"
              >
                <ExternalLink className="size-3.5 sm:size-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(website);
                }}
                className="nb-btn nb-btn-surface nb-btn-icon size-8 border-2 text-rose-500 hover:border-rose-500 hover:bg-rose-500/10 hover:text-rose-600 dark:text-rose-400 transition-all"
                title="Move to trash"
                aria-label="Move to trash"
              >
                <Trash2 className="size-3.5 sm:size-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </article>

    <AddToWebFlowModal
      isOpen={isWebFlowModalOpen}
      onClose={() => setIsWebFlowModalOpen(false)}
      website={website}
    />
  </>
);
}
