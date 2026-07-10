"use client";

import Image from "next/image";
import { Copy, ExternalLink, Pencil, RotateCcw, Star, Trash2 } from "lucide-react";

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

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/x-wesite-website-id", website._id);
        event.dataTransfer.setData("text/plain", website._id);
      }}
      className={`group min-w-0 overflow-hidden border border-zinc-300 bg-zinc-50 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-zinc-900 ${
        view === "list" ? "flex items-center gap-3 rounded-md p-3" : "flex min-h-44 flex-col rounded-lg p-4"
      }`}
    >
      <button
        type="button"
        onClick={mode === "trash" ? undefined : () => onOpen(website)}
        className={`min-w-0 flex-1 text-left ${view === "list" ? "flex items-center" : "flex w-full flex-col items-start"} ${mode === "trash" ? "cursor-default" : ""}`}
      >
        <div className={view === "list" ? "mr-3 shrink-0" : "mb-4 shrink-0"}>
          {website.customIconUrl || website.faviconUrl ? (
            <Image
              src={website.customIconUrl || website.faviconUrl || ""}
              alt=""
              width={42}
              height={42}
              className="size-10 rounded-md border border-zinc-300 bg-white object-cover dark:border-white/10"
              unoptimized
            />
          ) : (
            <span className="grid size-10 place-items-center rounded-md bg-blue-600 font-semibold text-white">
              {(website.title || website.domain || "W").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 max-w-full flex-1 overflow-hidden">
          <div className="flex min-w-0 max-w-full items-center gap-2">
            <h3 className="min-w-0 max-w-full flex-1 truncate text-sm font-semibold text-zinc-950 dark:text-white" title={website.title || website.domain}>
              {website.title || website.domain}
            </h3>
            {website.isFavorite ? <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" /> : null}
          </div>
          <p
            className="mt-1 max-w-full overflow-hidden text-xs leading-5 text-zinc-500 dark:text-zinc-400"
            title={website.description || website.domain}
            style={{
              display: "-webkit-box",
              WebkitLineClamp: view === "list" ? 1 : 2,
              WebkitBoxOrient: "vertical",
              overflowWrap: "anywhere",
            }}
          >
            {website.description || website.domain}
          </p>
          {website.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-1">
              {website.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex max-w-full items-center gap-2 overflow-hidden text-xs text-zinc-500 dark:text-zinc-400">
            <span className="shrink-0">{mode === "trash" ? "Deleted" : lastVisited}</span>
            <span className="truncate">{website.visitCount ?? 0} visits</span>
            {createdOn ? <span className="truncate">Added {createdOn}</span> : null}
          </div>
        </div>
      </button>

      <div className={`flex shrink-0 ${view === "list" ? "items-center" : "mt-4 justify-end"} gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100`}>
        {mode === "trash" ? (
          <>
            <button
              type="button"
              aria-label="Restore website"
              onClick={() => onRestore?.(website)}
              className="grid size-8 place-items-center rounded-md hover:bg-zinc-100 dark:hover:bg-white/10"
            >
              <RotateCcw className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Delete permanently"
              onClick={() => onPermanentDelete?.(website)}
              className="grid size-8 place-items-center rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <Trash2 className="size-4" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              aria-label="Edit website"
              onClick={() => onEdit(website)}
              className="grid size-8 place-items-center rounded-md hover:bg-zinc-100 dark:hover:bg-white/10"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Favorite"
              onClick={() => onToggleFavorite(website)}
              className="grid size-8 place-items-center rounded-md hover:bg-zinc-100 dark:hover:bg-white/10"
            >
              <Star className={`size-4 ${website.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
            </button>
            <button
              type="button"
              aria-label="Copy website"
              onClick={() => onCopy(website)}
              className="grid size-8 place-items-center rounded-md hover:bg-zinc-100 dark:hover:bg-white/10"
            >
              <Copy className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Open website"
              onClick={() => onOpen(website)}
              className="grid size-8 place-items-center rounded-md hover:bg-zinc-100 dark:hover:bg-white/10"
            >
              <ExternalLink className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Delete website"
              onClick={() => onDelete(website)}
              className="grid size-8 place-items-center rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <Trash2 className="size-4" />
            </button>
          </>
        )}
      </div>
    </article>
  );
}
