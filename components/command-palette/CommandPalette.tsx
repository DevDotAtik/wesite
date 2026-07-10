"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search, X } from "lucide-react";
import type { WebsiteItem } from "@/components/grid/WebsiteCard";

type CommandPaletteProps = {
  open: boolean;
  websites: WebsiteItem[];
  onClose: () => void;
  onOpenWebsite: (website: WebsiteItem) => void;
};

export default function CommandPalette({ open, websites, onClose, onOpenWebsite }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const value = query.toLowerCase();
    return websites
      .filter((website) =>
        [website.title, website.domain, website.description, ...(website.tags ?? [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(value),
      )
      .slice(0, 8);
  }, [query, websites]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/35 p-3 pt-20" onClick={onClose}>
      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-lg border border-zinc-300 bg-zinc-50 shadow-2xl dark:border-white/10 dark:bg-zinc-950" onClick={(event) => event.stopPropagation()}>
        <div className="flex h-12 items-center gap-3 border-b border-zinc-300 px-4 dark:border-white/10">
          <Search className="size-4 text-zinc-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
            placeholder="Search"
            className="h-full flex-1 bg-transparent text-sm outline-none"
          />
          <button type="button" aria-label="Close" onClick={onClose} className="grid size-8 place-items-center rounded-md hover:bg-zinc-100 dark:hover:bg-white/10">
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-80 overflow-auto p-2">
          {results.map((website) => (
            <button
              key={website._id}
              type="button"
              onClick={() => {
                onOpenWebsite(website);
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-white/10"
            >
              <ExternalLink className="size-4 text-zinc-400" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{website.title || website.domain}</span>
                <span className="block truncate text-xs text-zinc-500">{website.url}</span>
              </span>
            </button>
          ))}
          {!results.length ? <p className="px-3 py-8 text-center text-sm text-zinc-500">No matches</p> : null}
        </div>
      </div>
    </div>
  );
}
