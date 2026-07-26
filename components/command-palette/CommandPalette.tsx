"use client";

import { useMemo, useState } from "react";
import { BarChart3, Clock, ExternalLink, Grid3X3, Search, Settings, SquareCheckBig, X } from "lucide-react";
import type { WebsiteItem } from "@/components/grid/WebsiteCard";

type CommandPaletteProps = {
  open: boolean;
  websites: WebsiteItem[];
  onClose: () => void;
  onOpenWebsite: (website: WebsiteItem) => void;
};

const navCommands = [
  { id: "library", label: "Go to Library", icon: Grid3X3, href: "/" },
  { id: "analytics", label: "Go to Analytics", icon: BarChart3, href: "/analytics" },
  { id: "history", label: "Go to History", icon: Clock, href: "/history" },
  { id: "todo", label: "Go to Todo", icon: SquareCheckBig, href: "/todo" },
  { id: "settings", label: "Go to Settings", icon: Settings, href: "/settings" },
];

export default function CommandPalette({ open, websites, onClose, onOpenWebsite }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const value = query.toLowerCase();

    const matchedNav = navCommands.filter((cmd) => cmd.label.toLowerCase().includes(value));

    const matchedWebsites = websites
      .filter((website) =>
        [website.title, website.domain, website.description, ...(website.tags ?? [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(value),
      )
      .slice(0, 8);

    return { nav: matchedNav, websites: matchedWebsites };
  }, [query, websites]);

  if (!open) return null;

  const hasResults = results.nav.length > 0 || results.websites.length > 0;

  return (
    <div className="nb-overlay" onClick={onClose}>
      <div className="nb-modal max-w-xl" style={{ alignSelf: "flex-start", marginTop: "5rem" }} onClick={(event) => event.stopPropagation()}>
        <div className="flex h-14 items-center gap-3 border-b-3 px-4" style={{ borderColor: "var(--nb-border)" }}>
          <Search className="size-4" style={{ color: "var(--nb-muted)" }} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
            placeholder="Search websites, pages, commands..."
            className="h-full flex-1 bg-transparent text-sm font-semibold outline-none"
            style={{ color: "var(--nb-fg)" }}
          />
          <button type="button" aria-label="Close" onClick={onClose} className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm">
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-80 overflow-auto p-2">
          {results.nav.length > 0 ? (
            <div className="mb-2">
              <p className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--nb-muted)" }}>
                Pages
              </p>
              {results.nav.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <a
                    key={cmd.id}
                    href={cmd.href}
                    onClick={onClose}
                    className="nb-sidebar-item"
                  >
                    <Icon className="size-4 opacity-50" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{cmd.label}</span>
                    </span>
                  </a>
                );
              })}
            </div>
          ) : null}

          {results.websites.length > 0 ? (
            <div>
              <p className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--nb-muted)" }}>
                Websites
              </p>
              {results.websites.map((website) => (
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
                  {website.visitCount ? (
                    <span className="nb-tag text-[9px]">{website.visitCount} visits</span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}

          {!hasResults ? (
            <p className="px-3 py-8 text-center text-sm font-semibold" style={{ color: "var(--nb-muted)" }}>No matches found</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
