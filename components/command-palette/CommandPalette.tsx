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
    <div className="nb-overlay" onClick={onClose}>
      <div className="nb-modal max-w-xl" style={{ alignSelf: "flex-start", marginTop: "5rem" }} onClick={(event) => event.stopPropagation()}>
        <div className="flex h-14 items-center gap-3 border-b-3 px-4" style={{ borderColor: "var(--nb-border)" }}>
          <Search className="size-4" style={{ color: "var(--nb-muted)" }} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
            placeholder="Search websites..."
            className="h-full flex-1 bg-transparent text-sm font-semibold outline-none"
            style={{ color: "var(--nb-fg)" }}
          />
          <button type="button" aria-label="Close" onClick={onClose} className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm">
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-80 overflow-auto p-2">
          {results.map((website) => (
            <button
              key={website._id}
              type="button"
              onClick={() => { onOpenWebsite(website); onClose(); }}
              className="nb-sidebar-item"
            >
              <ExternalLink className="size-4 opacity-50" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{website.title || website.domain}</span>
                <span className="block truncate text-xs" style={{ color: "var(--nb-muted)" }}>{website.url}</span>
              </span>
            </button>
          ))}
          {!results.length ? (
            <p className="px-3 py-8 text-center text-sm font-semibold" style={{ color: "var(--nb-muted)" }}>No matches found</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
