"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import {
  BarChart3,
  Bell,
  Clock,
  Command,
  FolderTree,
  Grid3X3,
  List,
  Menu,
  Newspaper,
  Plus,
  Search,
  Settings,
  SquareCheckBig,
  UserCircle,
  Workflow,
  X,
} from "lucide-react";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-3" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
      <div className="flex h-14 w-full items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
        {/* Logo (Always on left) */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Logo className="size-7 sm:size-8" />
          <span className="text-sm sm:text-base font-extrabold tracking-tight" style={{ color: "var(--nb-fg)" }}>Wesite</span>
        </Link>

        {/* Nav Links (Desktop) */}
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
                className={`nb-btn nb-btn-sm text-xs px-2 xl:px-2.5 ${isActive ? "nb-btn-primary" : "nb-btn-ghost"}`}
                href={link.href}
                title={link.label}
              >
                <link.icon className="size-3.5" />
                <span className="hidden xl:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Search (Desktop) */}
          <div className="relative hidden w-full max-w-xs lg:max-w-sm xl:max-w-md sm:flex sm:items-center">
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

          {/* View Toggle (Hidden on mobile to save space) */}
          {onViewChange ? (
            <div className="hidden sm:flex items-center rounded-xl border-3 p-0.5" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
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

          {/* Mobile Folder Tree Button (Dashboard only) */}
          {onOpenSidebar && pathname === "/dashboard" && (
            <button
              type="button"
              aria-label="Open folders"
              onClick={onOpenSidebar}
              className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm lg:hidden"
              title="Folders"
            >
              <FolderTree className="size-4 text-amber-500" />
            </button>
          )}

          {/* Add Website Button */}
          {onAddWebsite && (
            <button
              type="button"
              aria-label="Add website"
              onClick={onAddWebsite}
              className="nb-btn nb-btn-primary nb-btn-icon nb-btn-sm"
              title="Add Website"
            >
              <Plus className="size-4" />
            </button>
          )}

          <ThemeToggle />

          {/* User Account Link (Desktop) */}
          <Link
            href={userName ? "/settings" : "/login"}
            className="hidden items-center gap-2 nb-btn nb-btn-ghost nb-btn-sm sm:flex"
          >
            <UserCircle className="size-5" />
            <span className="max-w-24 truncate text-xs">{userName ?? "Account"}</span>
          </Link>

          {/* Mobile Nav Hamburger Toggle (Positioned on the far right) */}
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm md:hidden"
          >
            {mobileNavOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div className="md:hidden border-t-2 border-[var(--nb-border)] bg-[var(--nb-surface)] p-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {onSearchChange && (
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 size-4 text-[var(--nb-muted)]" />
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search websites..."
                className="nb-input !h-9 w-full !pl-9 text-xs"
              />
            </div>
          )}

          {onViewChange && (
            <div className="mb-3 flex items-center justify-between rounded-xl border-2 border-[var(--nb-border)] bg-[var(--nb-card)] p-2">
              <span className="text-xs font-bold text-[var(--nb-muted)]">Layout View</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onViewChange("grid")}
                  className={`nb-btn nb-btn-sm text-xs py-1 px-2.5 ${view === "grid" ? "nb-btn-primary" : "nb-btn-ghost"}`}
                >
                  <Grid3X3 className="size-3.5" />
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => onViewChange("list")}
                  className={`nb-btn nb-btn-sm text-xs py-1 px-2.5 ${view === "list" ? "nb-btn-primary" : "nb-btn-ghost"}`}
                >
                  <List className="size-3.5" />
                  List
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
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
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-2 rounded-xl p-2.5 border-2 transition-all ${
                    isActive
                      ? "border-[var(--nb-border)] bg-[var(--nb-primary)] text-white shadow-xs font-black"
                      : "border-transparent hover:border-[var(--nb-border)] hover:bg-[var(--nb-card)] text-[var(--nb-fg)]"
                  }`}
                  href={link.href}
                >
                  <link.icon className="size-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-[var(--nb-border)]/40 flex items-center justify-between">
            <Link
              href={userName ? "/settings" : "/login"}
              onClick={() => setMobileNavOpen(false)}
              className="flex items-center gap-2 text-xs font-bold text-[var(--nb-fg)]"
            >
              <UserCircle className="size-5" />
              <span>{userName ? `Signed in as ${userName}` : "Sign In / Register"}</span>
            </Link>

            {onOpenCommand && (
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  onOpenCommand();
                }}
                className="nb-btn nb-btn-ghost nb-btn-sm text-xs gap-1"
              >
                <Command className="size-3" />
                <span>Commands</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
