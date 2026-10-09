"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { BarChart3, Bell, Clock, Command, Grid3X3, List, Menu, Newspaper, Plus, Search, Settings, SquareCheckBig, UserCircle, Workflow } from "lucide-react";
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
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b-3" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
      <div className="flex h-14 w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile sidebar toggle */}
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={onOpenSidebar}
          className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm lg:hidden!"
        >
          <Menu className="size-4" />
        </button>

        {/* Logo */}
        <Link href="/" className="flex min-w-fit items-center gap-2">
          <Logo className="size-8" />
          <span className="text-sm font-bold" style={{ color: "var(--nb-fg)" }}>Wesite</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden items-center gap-1 text-sm font-semibold md:flex">
          {[
            { href: "/dashboard", label: "Library", icon: Grid3X3 },
            { href: "/webflow", label: "WebFlow", icon: Workflow },
            { href: "/news", label: "News", icon: Newspaper },
            { href: "/history", label: "History", icon: Clock },
            { href: "/todo", label: "Todo", icon: SquareCheckBig },
            { href: "/analytics", label: "Analytics", icon: BarChart3 },
            { href: "/monitoring", label: "Monitor", icon: Bell },
            { href: "/settings", label: "Settings", icon: Settings },
          ].map((link) => {
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                className={`nb-btn nb-btn-sm text-xs ${isActive ? "nb-btn-primary" : "nb-btn-ghost"}`}
                href={link.href}
              >
                <link.icon className="size-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="ml-auto flex flex-1 items-center justify-end gap-2">
          {/* Search */}
          <div className="relative hidden w-full max-w-md sm:flex sm:items-center">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Search className="size-4 shrink-0 text-[var(--nb-muted)]" />
            </div>
            <input
              value={search}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Search websites, tags, folders…"
              className="nb-input !h-9 w-full !pl-10 !pr-16 text-xs"
            />
            <div className="absolute inset-y-0 right-1.5 flex items-center">
              <button
                type="button"
                aria-label="Open command palette"
                onClick={onOpenCommand}
                className="nb-btn nb-btn-ghost nb-btn-sm !h-6 px-1.5 text-[10px] gap-1 font-mono text-[var(--nb-muted)] hover:text-[var(--nb-fg)]"
              >
                <Command className="size-3" />
                <span>K</span>
              </button>
            </div>
          </div>

          {/* View Toggle */}
          {onViewChange ? (
            <div className="flex items-center rounded-xl border-3 p-0.5" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
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

          {/* Add Button */}
          <button
            type="button"
            aria-label="Add website"
            onClick={onAddWebsite}
            className="nb-btn nb-btn-primary nb-btn-icon nb-btn-sm"
          >
            <Plus className="size-4" />
          </button>

          {/* User */}
          <Link
            href={userName ? "/settings" : "/login"}
            className="hidden items-center gap-2 nb-btn nb-btn-ghost nb-btn-sm sm:flex"
          >
            <UserCircle className="size-5" />
            <span className="max-w-24 truncate text-xs">{userName ?? "Account"}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
