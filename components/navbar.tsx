"use client";

import Link from "next/link";
import { BarChart3, Clock, Command, Grid3X3, List, Menu, Plus, Search, Settings, SquareCheckBig, UserCircle } from "lucide-react";
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
    <header className="sticky top-0 z-40 border-b border-zinc-300/80 bg-zinc-100/85 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
      <div className="flex h-12 items-center gap-3 px-3 sm:px-5">
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={onOpenSidebar}
          className="grid size-8 place-items-center rounded-md text-zinc-700 hover:bg-zinc-200/70 dark:text-zinc-200 dark:hover:bg-white/10 lg:hidden"
        >
          <Menu className="size-4" />
        </button>

        <Link href="/" className="flex min-w-fit items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-blue-600 text-sm font-bold text-white">
            W
          </span>
          <span className="text-sm font-semibold text-zinc-950 dark:text-white">Wesite</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm text-zinc-600 dark:text-zinc-300 md:flex">
          <Link className="rounded-md px-2 py-1 hover:bg-zinc-200/70 dark:hover:bg-white/10" href="/">
            <Grid3X3 className="mr-1 inline size-3.5" />
            Library
          </Link>
          <Link className="rounded-md px-2 py-1 hover:bg-zinc-200/70 dark:hover:bg-white/10" href="/history">
            <Clock className="mr-1 inline size-3.5" />
            History
          </Link>
          <Link className="rounded-md px-2 py-1 hover:bg-zinc-200/70 dark:hover:bg-white/10" href="/todo">
            <SquareCheckBig className="mr-1 inline size-3.5" />
            Todo
          </Link>
          <Link className="rounded-md px-2 py-1 hover:bg-zinc-200/70 dark:hover:bg-white/10" href="/analytics">
            <BarChart3 className="mr-1 inline size-3.5" />
            Analytics
          </Link>
          <Link className="rounded-md px-2 py-1 hover:bg-zinc-200/70 dark:hover:bg-white/10" href="/settings">
            <Settings className="mr-1 inline size-3.5" />
            Settings
          </Link>
        </nav>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2">
          <label className="relative hidden w-full max-w-md sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Search websites, tags, folders"
              className="h-8 w-full rounded-md border border-zinc-300 bg-white pl-9 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/10"
            />
            <button
              type="button"
              aria-label="Open command palette"
              onClick={onOpenCommand}
              className="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
            >
              <Command className="size-3.5" />
            </button>
          </label>

          {onViewChange ? (
            <div className="hidden rounded-md border border-zinc-300 bg-zinc-200/70 p-0.5 dark:border-white/10 dark:bg-white/10 sm:flex">
              <button
                type="button"
                aria-label="Grid view"
                onClick={() => onViewChange("grid")}
                className={`grid size-7 place-items-center rounded ${view === "grid" ? "bg-white shadow-sm dark:bg-zinc-800" : ""}`}
              >
                <Grid3X3 className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="List view"
                onClick={() => onViewChange("list")}
                className={`grid size-7 place-items-center rounded ${view === "list" ? "bg-white shadow-sm dark:bg-zinc-800" : ""}`}
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
            className="grid size-8 place-items-center rounded-md bg-blue-600 text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="size-4" />
          </button>

          <Link
            href={userName ? "/settings" : "/login"}
            className="hidden items-center gap-2 rounded-md px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-200/70 dark:text-zinc-200 dark:hover:bg-white/10 sm:flex"
          >
            <UserCircle className="size-5" />
            <span className="max-w-24 truncate">{userName ?? "Account"}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
