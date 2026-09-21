"use client";

import Image from "next/image";
import { BarChart3, CheckSquare, Copy, ExternalLink, Pencil, RotateCcw, Square, Star, Trash2 } from "lucide-react";

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
  const lastVisited = website.lastVisitedAt
    ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(website.lastVisitedAt))
    : "Never";
  const createdOn = website.createdAt
    ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(website.createdAt))
    : "";

  const accentColors = [
    "var(--nb-bruto-yellow)",
    "var(--nb-bruto-orange)",
    "var(--nb-bruto-coral)",
    "var(--nb-bruto-pink)",
    "var(--nb-bruto-purple)",
    "var(--nb-bruto-blue)",
    "var(--nb-bruto-cyan)",
    "var(--nb-bruto-mint)",
  ];
  const accent = accentColors[website._id.charCodeAt(0) % accentColors.length];

  const visitCount = website.visitCount ?? 0;
  const visitBadgeColor = visitCount >= 10
    ? "var(--nb-bruto-mint)"
    : visitCount >= 5
      ? "var(--nb-bruto-blue)"
      : visitCount >= 1
        ? "var(--nb-bruto-yellow)"
        : "var(--nb-surface-alt)";

  return (
    <article
      draggable={!selected}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/x-wesite-website-id", website._id);
        event.dataTransfer.setData("text/plain", website._id);
      }}
      className={`nb-card group relative min-w-0 overflow-hidden ${selected ? "ring-2 ring-[var(--nb-primary)]" : ""} ${
        view === "list" ? "flex items-center gap-3 p-3" : "flex min-h-44 flex-col p-4"
      }`}
    >
      {/* Selection checkbox */}
      {onSelect && mode !== "trash" ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(website._id, !selected); }}
          aria-label={selected ? `Deselect ${website.title || website.domain}` : `Select ${website.title || website.domain}`}
          aria-pressed={selected}
          className="absolute right-2 top-2 z-10 nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm"
          style={{ color: selected ? "var(--nb-primary)" : "var(--nb-muted)" }}
        >
          {selected ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
        </button>
      ) : null}

      <button
        type="button"
        onClick={mode === "trash" ? undefined : () => onOpen(website)}
        aria-label={mode === "trash" ? (website.title || website.domain) : `Open ${website.title || website.domain}`}
        className={`min-w-0 flex-1 text-left ${view === "list" ? "flex items-center" : "flex w-full flex-col items-start"} ${mode === "trash" ? "cursor-default" : ""}`}
      >
        <div className={view === "list" ? "mr-3 shrink-0" : "mb-4 shrink-0"}>
          {website.customIconUrl || website.faviconUrl ? (
            <div className="relative">
              <Image
                src={website.customIconUrl || website.faviconUrl || ""}
                alt=""
                width={42}
                height={42}
                className="size-10 rounded-xl border-[3px] bg-[var(--nb-surface-strong)] object-cover"
                style={{ borderColor: "var(--nb-border)" }}
                unoptimized
              />
              {mode !== "trash" && visitCount > 0 ? (
                <span
                  className="absolute -bottom-1 -right-1 grid min-w-4 place-items-center rounded-md border-[2px] px-1 text-[8px] font-extrabold"
                  style={{ background: visitBadgeColor, borderColor: "var(--nb-border)", color: "var(--nb-fg)" }}
                >
                  {visitCount}
                </span>
              ) : null}
            </div>
          ) : (
            <div className="relative">
              <span
                className="grid size-10 place-items-center rounded-xl border-[3px] font-extrabold text-sm"
                style={{ background: accent, borderColor: "var(--nb-border)", color: "var(--nb-fg)" }}
              >
                {(website.title || website.domain || "W").charAt(0).toUpperCase()}
              </span>
              {mode !== "trash" && visitCount > 0 ? (
                <span
                  className="absolute -bottom-1 -right-1 grid min-w-4 place-items-center rounded-md border-[2px] px-1 text-[8px] font-extrabold"
                  style={{ background: visitBadgeColor, borderColor: "var(--nb-border)", color: "var(--nb-fg)" }}
                >
                  {visitCount}
                </span>
              ) : null}
            </div>
          )}
        </div>
        <div className="min-w-0 max-w-full flex-1 overflow-hidden">
          <div className="flex min-w-0 max-w-full items-center gap-2">
            <h3 className="min-w-0 max-w-full flex-1 truncate text-sm font-bold" style={{ color: "var(--nb-fg)" }} title={website.title || website.domain}>
              {website.title || website.domain}
            </h3>
            {website.isFavorite ? <Star className="size-3.5 shrink-0 fill-[var(--nb-warning)] text-[var(--nb-warning)]" /> : null}
          </div>
          <p
            className="mt-1 max-w-full overflow-hidden text-xs leading-5"
            style={{ color: "var(--nb-muted)", display: "-webkit-box", WebkitLineClamp: view === "list" ? 1 : 2, WebkitBoxOrient: "vertical", overflowWrap: "anywhere" }}
            title={website.description || website.domain}
          >
            {website.description || website.domain}
          </p>
          {website.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-1">
              {website.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="nb-tag text-[10px]">
                  {tag}
                </span>
              ))}
              {website.tags.length > 3 ? (
                <span className="nb-tag text-[10px]">+{website.tags.length - 3}</span>
              ) : null}
            </div>
          ) : null}
          <div className="mt-3 flex max-w-full items-center gap-2 overflow-hidden text-xs" style={{ color: "var(--nb-muted)" }}>
            <span className="shrink-0 font-semibold">{mode === "trash" ? "Deleted" : lastVisited}</span>
            {mode !== "trash" ? (
              <span className="inline-flex shrink-0 items-center gap-1 font-semibold">
                <BarChart3 className="size-3" />
                {visitCount}
              </span>
            ) : null}
            {createdOn ? <span className="truncate">Added {createdOn}</span> : null}
          </div>
        </div>
      </button>

      <div className={`flex shrink-0 ${view === "list" ? "items-center" : "mt-4 justify-end"} gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100`}>
        {mode === "trash" ? (
          <>
            <button type="button" aria-label="Restore website" onClick={() => onRestore?.(website)} className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm">
              <RotateCcw className="size-4" />
            </button>
            <button type="button" aria-label="Delete permanently" onClick={() => onPermanentDelete?.(website)} className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm" style={{ color: "var(--nb-danger)" }}>
              <Trash2 className="size-4" />
            </button>
          </>
        ) : (
          <>
            <button type="button" aria-label="Edit website" onClick={() => onEdit(website)} className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm">
              <Pencil className="size-4" />
            </button>
            <button type="button" aria-label={website.isFavorite ? "Remove from favorites" : "Add to favorites"} aria-pressed={Boolean(website.isFavorite)} onClick={() => onToggleFavorite(website)} className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm">
              <Star className={`size-4 ${website.isFavorite ? "fill-[var(--nb-warning)] text-[var(--nb-warning)]" : ""}`} />
            </button>
            <button type="button" aria-label="Copy website" onClick={() => onCopy(website)} className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm">
              <Copy className="size-4" />
            </button>
            <button type="button" aria-label="Open website" onClick={() => onOpen(website)} className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm">
              <ExternalLink className="size-4" />
            </button>
            <button type="button" aria-label="Delete website" onClick={() => onDelete(website)} className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm" style={{ color: "var(--nb-danger)" }}>
              <Trash2 className="size-4" />
            </button>
          </>
        )}
      </div>
    </article>
  );
}
