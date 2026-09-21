"use client";

import Link from "next/link";
import { BarChart3, Bell, Clock, Command, Grid3X3, List, Menu, Plus, Search, Settings, SquareCheckBig, UserCircle } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

type NavbarProps = {
  search?: string;
  onSearchChange?: (value: string) => void;
  onAddWebsite?: () => void;
  onOpenSidebar?: () => void;
  onOpenCommand?: () => void;
  view?: "grid" | "list";
  onViewChange?: (view: "grid" | "list") => void;
  userName?: string;
};

export default function Navbar({
  search = "",
  onSearchChange,
  onAddWebsite,
  onOpenSidebar,
  onOpenCommand,
  view = "grid",
  onViewChange,
  userName,
}: NavbarProps) {
  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-xl"
      style={{ borderColor: "var(--nb-border)", background: "color-mix(in srgb, var(--nb-surface) 82%, transparent)" }}
    >
      <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={onOpenSidebar}
          className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm lg:hidden!"
        >
          <Menu className="size-4" />
        </button>

        <Link href="/" className="flex min-w-fit items-center gap-2">
          <span
            className="grid size-8 place-items-center rounded-lg border text-sm font-bold"
            style={{ background: "var(--nb-primary)", color: "var(--nb-primary-fg)", borderColor: "transparent" }}
          >
            W
          </span>
          <span className="text-sm font-bold" style={{ color: "var(--nb-fg)" }}>Wesite</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          {[
            { href: "/dashboard", label: "Library", icon: Grid3X3 },
            { href: "/history", label: "History", icon: Clock },
            { href: "/todo", label: "Todo", icon: SquareCheckBig },
            { href: "/analytics", label: "Analytics", icon: BarChart3 },
            { href: "/monitoring", label: "Monitor", icon: Bell },
            { href: "/settings", label: "Settings", icon: Settings },
          ].map((link) => (
            <Link
              key={link.href}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-colors"
              style={{ color: "var(--nb-muted)" }}
              href={link.href}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--nb-fg)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--nb-muted)"; }}
            >
              <link.icon className="size-3.5" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2">
          <label className="relative hidden w-full max-w-md sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: "var(--nb-muted)" }} />
            <input
              value={search}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Search websites, tags, folders"
              className="nb-input h-9 pl-9 pr-10 text-xs"
            />
            <button
              type="button"
              aria-label="Open command palette"
              onClick={onOpenCommand}
              className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors"
              style={{ color: "var(--nb-muted)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--nb-fg)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--nb-muted)"; }}
            >
              <Command className="size-3" />k
            </button>
          </label>

          {onViewChange ? (
            <div className="hidden items-center rounded-xl border p-0.5 sm:flex" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
              <button
                type="button"
                aria-label="Grid view"
                onClick={() => onViewChange("grid")}
                className={`nb-btn nb-btn-icon nb-btn-sm ${view === "grid" ? "nb-btn-primary" : "nb-btn-ghost"}`}
              >
                <Grid3X3 className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="List view"
                onClick={() => onViewChange("list")}
                className={`nb-btn nb-btn-icon nb-btn-sm ${view === "list" ? "nb-btn-primary" : "nb-btn-ghost"}`}
              >
                <List className="size-3.5" />
              </button>
            </div>
          ) : null}

          <ThemeToggle />

          <button
            type="button"
            aria-label="Add website"
            onClick={onAddWebsite}
            className="nb-btn nb-btn-primary nb-btn-icon nb-btn-sm"
          >
            <Plus className="size-4" />
          </button>

          <Link
            href={userName ? "/settings" : "/login"}
            className="hidden items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors sm:flex"
            style={{ color: "var(--nb-muted)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--nb-fg)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--nb-muted)"; }}
          >
            <UserCircle className="size-5" />
            <span className="max-w-24 truncate">{userName ?? "Account"}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}