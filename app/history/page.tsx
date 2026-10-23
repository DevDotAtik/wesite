"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Flame,
  Globe,
  History,
  ListFilter,
  Loader2,
  MoreVertical,
  RotateCcw,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/navbar";

type Visit = {
  _id: string;
  visitedAt: string;
  websiteId?: {
    _id: string;
    title: string;
    domain: string;
    url: string;
    faviconUrl?: string;
  };
};

type SliderCategory = "all" | "today" | "yesterday" | "week" | "month" | "older";

const SLIDER_FILTERS: { id: SliderCategory; label: string; icon: string }[] = [
  { id: "all", label: "All History", icon: "🌐" },
  { id: "today", label: "Today", icon: "📅" },
  { id: "yesterday", label: "Yesterday", icon: "⏪" },
  { id: "week", label: "This Week", icon: "📆" },
  { id: "month", label: "Last 30 Days", icon: "🗓️" },
  { id: "older", label: "Older Trails", icon: "⏳" },
];

function HistoryRow({
  visit,
  isSelected,
  onToggleSelect,
  onDelete,
  isDeleting,
}: {
  visit: Visit;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClose = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClose);
    document.addEventListener("touchstart", handleClose);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClose);
      document.removeEventListener("touchstart", handleClose);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleShareOrCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!visit.websiteId?.url) return;
    try {
      if (typeof navigator !== "undefined" && navigator.share && window.isSecureContext) {
        try {
          await navigator.share({
            title: visit.websiteId.title || visit.websiteId.domain,
            url: visit.websiteId.url,
          });
          toast.success("Link shared successfully!");
          return;
        } catch (shareErr) {
          if ((shareErr as Error).name === "AbortError") return;
        }
      }
      await navigator.clipboard.writeText(visit.websiteId.url);
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  return (
    <div
      className={`group relative flex items-center gap-2.5 sm:gap-3 border-b-2 px-3 sm:px-4 py-2.5 sm:py-3 last:border-b-0 transition-colors hover:bg-nb-surface-alt ${
        isSelected ? "bg-indigo-50/20 dark:bg-indigo-950/20" : ""
      } ${menuOpen ? "z-30" : "z-auto"}`}
      style={{ borderColor: "var(--nb-border)" }}
    >
      {/* Selection Checkbox */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleSelect(visit._id);
        }}
        aria-label={isSelected ? "Deselect visit" : "Select visit"}
        title={isSelected ? "Deselect visit" : "Select visit"}
        className={`flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all cursor-pointer ${
          isSelected
            ? "border-indigo-600 bg-indigo-600 text-white shadow-nb-xs opacity-100"
            : "border-nb-border/60 bg-nb-surface text-transparent hover:border-indigo-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        }`}
      >
        <Check className="size-3.5 stroke-[3] text-white" />
      </button>

      {/* Main Content: Click to visit website */}
      <a
        href={visit.websiteId?.url}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3 cursor-pointer"
      >
        {visit.websiteId?.faviconUrl ? (
          <Image
            src={visit.websiteId.faviconUrl}
            alt=""
            width={28}
            height={28}
            className="size-7 sm:size-8 shrink-0 rounded-lg border-2 object-contain p-0.5 bg-nb-surface"
            style={{ borderColor: "var(--nb-border)" }}
            unoptimized
          />
        ) : (
          <span
            className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg border-2 text-[10px] sm:text-xs font-black uppercase text-white bg-indigo-600"
            style={{ borderColor: "var(--nb-border)" }}
          >
            {(visit.websiteId?.title || visit.websiteId?.domain || "W").charAt(0).toUpperCase()}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <span className="block truncate text-xs sm:text-sm font-bold group-hover:underline text-nb-fg">
            {visit.websiteId?.title ?? "Deleted website"}
          </span>
          <span className="block truncate text-[11px] sm:text-xs font-semibold text-nb-muted">
            {visit.websiteId?.domain || visit.websiteId?.url}
          </span>
        </div>

        <time className="rounded-md border border-nb-border/40 bg-nb-surface px-1.5 py-0.5 shrink-0 text-[10px] font-mono font-bold text-nb-muted hidden xs:inline-flex">
          {new Date(visit.visitedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </time>
      </a>

      {/* Direct Open Link on Desktop */}
      {visit.websiteId?.url && (
        <a
          href={visit.websiteId.url}
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex size-7 items-center justify-center rounded-lg border-2 border-nb-border bg-nb-card text-nb-muted hover:text-indigo-600 hover:bg-nb-surface-alt transition-colors shrink-0 shadow-nb-xs cursor-pointer opacity-0 group-hover:opacity-100"
          title="Open website"
        >
          <ExternalLink className="size-3.5" />
        </a>
      )}

      {/* Strictly ONE 3-Dots Action Menu for Both Desktop & Mobile */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          aria-label="More options"
          title="More options"
          className="flex size-7 sm:size-8 items-center justify-center rounded-lg border-2 border-nb-border bg-nb-card text-nb-fg shadow-nb-xs active:scale-95 transition-all hover:bg-nb-surface-alt cursor-pointer"
        >
          <MoreVertical className="size-4" />
        </button>

        {menuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-9 z-50 min-w-44 rounded-xl border-2 border-nb-border bg-nb-card p-1.5 shadow-nb-xl space-y-0.5 text-xs font-bold animate-in fade-in zoom-in-95 duration-100 text-nb-fg select-none"
            style={{ borderColor: "var(--nb-border)", background: "var(--nb-card)" }}
          >
            {visit.websiteId?.url ? (
              <a
                href={visit.websiteId.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-nb-surface-alt hover:text-indigo-600 transition-colors cursor-pointer"
              >
                <ExternalLink className="size-3.5 text-indigo-500" />
                <span>Open website</span>
              </a>
            ) : null}

            {visit.websiteId?.url ? (
              <button
                type="button"
                onClick={(e) => {
                  setMenuOpen(false);
                  handleShareOrCopy(e);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-nb-surface-alt hover:text-indigo-600 transition-colors cursor-pointer"
              >
                <Share2 className="size-3.5 text-blue-500" />
                <span>Share / Copy link</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onToggleSelect(visit._id);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-nb-surface-alt transition-colors cursor-pointer"
            >
              <Check className="size-3.5 text-emerald-500" />
              <span>{isSelected ? "Deselect visit" : "Select visit"}</span>
            </button>

            <div className="my-1 border-t border-nb-border/30" />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDelete(visit._id);
              }}
              disabled={isDeleting}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="size-3.5" />
              <span>Delete visit</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [groups, setGroups] = useState<Record<string, Visit[]>>({});
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sliderFilter, setSliderFilter] = useState<SliderCategory>("all");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [mobileTab, setMobileTab] = useState<"history" | "filters">("history");

  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollSlider = (direction: "left" | "right") => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({
        left: direction === "left" ? -180 : 180,
        behavior: "smooth",
      });
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    try {
      const response = await fetch(`/api/history?${params.toString()}`);
      if (response.ok) {
        setGroups((await response.json()).groups ?? {});
      }
    } catch {}
    setLoading(false);
  }, [fromDate, toDate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectDay = useCallback((dayVisits: Visit[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = dayVisits.every((v) => next.has(v._id));
      if (allSelected) {
        dayVisits.forEach((v) => next.delete(v._id));
      } else {
        dayVisits.forEach((v) => next.add(v._id));
      }
      return next;
    });
  }, []);

  async function clearHistory() {
    const confirmed = window.confirm("Clear all browsing history?");
    if (!confirmed) return;
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    await fetch(`/api/history?${params.toString()}`, { method: "DELETE" });
    setSelectedIds(new Set());
    load();
    toast.success("History cleared");
  }

  async function deleteVisit(visitId: string) {
    setDeletingId(visitId);
    try {
      const res = await fetch(`/api/history/${visitId}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedIds((prev) => {
          if (!prev.has(visitId)) return prev;
          const next = new Set(prev);
          next.delete(visitId);
          return next;
        });
        toast.success("Visit deleted");
      }
    } catch {}
    setDeletingId(null);
    load();
  }

  function exportHistory() {
    const allVisits = Object.values(groups).flat();
    const csv = [
      ["Date", "Time", "Title", "Domain", "URL"].join(","),
      ...allVisits.map((visit) =>
        [
          new Date(visit.visitedAt).toISOString().slice(0, 10),
          new Date(visit.visitedAt).toLocaleTimeString(),
          `"${(visit.websiteId?.title ?? "").replace(/"/g, '""')}"`,
          visit.websiteId?.domain ?? "",
          visit.websiteId?.url ?? "",
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `wesite-history-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("History CSV exported successfully!");
  }

  // Quick Preset Date Ranges
  const setPresetRange = (preset: "today" | "7d" | "30d" | "all") => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    if (preset === "today") {
      setFromDate(todayStr);
      setToDate(todayStr);
      setSliderFilter("today");
    } else if (preset === "7d") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setFromDate(d.toISOString().slice(0, 10));
      setToDate(todayStr);
      setSliderFilter("week");
    } else if (preset === "30d") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setFromDate(d.toISOString().slice(0, 10));
      setToDate(todayStr);
      setSliderFilter("month");
    } else {
      setFromDate("");
      setToDate("");
      setSliderFilter("all");
    }
  };

  // Base entries with search filtering
  const entries = useMemo(
    () =>
      Object.entries(groups).map(
        ([day, visits]) =>
          [
            day,
            visits.filter((visit) =>
              [visit.websiteId?.title, visit.websiteId?.domain, visit.websiteId?.url]
                .join(" ")
                .toLowerCase()
                .includes(query.toLowerCase()),
            ),
          ] as const,
      ),
    [groups, query],
  );

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, []);

  // Filter entries based on the timeline slider
  const filteredEntries = useMemo(() => {
    return entries.filter(([day, visits]) => {
      if (!visits.length) return false;
      if (sliderFilter === "all") return true;
      if (sliderFilter === "today") return day === todayStr;
      if (sliderFilter === "yesterday") return day === yesterdayStr;
      const dayDate = new Date(day).getTime();
      const now = Date.now();
      const diffDays = (now - dayDate) / (1000 * 60 * 60 * 24);
      if (sliderFilter === "week") return diffDays <= 7;
      if (sliderFilter === "month") return diffDays <= 30;
      if (sliderFilter === "older") return diffDays > 30;
      return true;
    });
  }, [entries, sliderFilter, todayStr, yesterdayStr]);

  const visibleVisits = useMemo(() => filteredEntries.flatMap(([, visits]) => visits), [filteredEntries]);
  const activeDays = filteredEntries.filter(([, visits]) => visits.length).length;

  const selectAllVisits = useCallback(() => {
    if (selectedIds.size === visibleVisits.length && visibleVisits.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleVisits.map((v) => v._id)));
    }
  }, [selectedIds.size, visibleVisits]);

  const deleteSelectedVisits = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const confirmed = window.confirm(`Delete ${count} selected history ${count === 1 ? "entry" : "entries"}?`);
    if (!confirmed) return;

    setIsBatchDeleting(true);
    try {
      const res = await fetch("/api/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (res.ok) {
        toast.success(`Deleted ${count} history ${count === 1 ? "entry" : "entries"}`);
        setSelectedIds(new Set());
        load();
      } else {
        toast.error("Failed to delete selected entries");
      }
    } catch {
      toast.error("Failed to delete selected entries");
    } finally {
      setIsBatchDeleting(false);
    }
  }, [selectedIds, load]);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--nb-bg)" }}>
      <Navbar search={query} onSearchChange={setQuery} />

      {/* Mobile adaptive tab switcher (< lg screens) */}
      <div className="lg:hidden shrink-0 border-b-2 border-nb-border bg-nb-card px-3 py-2 z-10">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-nb-surface p-1 border-2 border-nb-border shadow-nb-xs">
          <button
            type="button"
            onClick={() => setMobileTab("history")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-black transition-all cursor-pointer ${
              mobileTab === "history"
                ? "bg-indigo-600 text-white shadow-nb-xs"
                : "text-nb-muted hover:text-nb-fg"
            }`}
          >
            <Clock3 className="size-3.5" />
            <span>History ({visibleVisits.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("filters")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-black transition-all cursor-pointer ${
              mobileTab === "filters"
                ? "bg-indigo-600 text-white shadow-nb-xs"
                : "text-nb-muted hover:text-nb-fg"
            }`}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Filters &amp; Stats</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left & Right Columns, True No-Scroll Design */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden w-full mx-auto nb-page-enter">
        {/* ===================================================================== */}
        {/* LEFT COLUMN: Fixed Header, Analytics Bento, Range Filters, & Actions  */}
        {/* ===================================================================== */}
        <aside
          className={`lg:flex flex-col h-full w-full lg:w-[360px] xl:w-[400px] shrink-0 border-r-2 border-nb-border bg-nb-card overflow-hidden ${
            mobileTab !== "history" ? "flex flex-1" : "hidden"
          }`}
        >
          {/* Left Column Header (Fixed) */}
          <div className="shrink-0 flex items-center justify-between p-3.5 sm:p-4 border-b-2 border-nb-border bg-nb-card/90">
            <div className="flex items-center gap-2.5">
              <span
                className="flex size-9 items-center justify-center rounded-xl border-2 border-nb-border shadow-nb-xs"
                style={{ background: "var(--nb-warning)", color: "var(--nb-accent-fg)" }}
              >
                <Clock3 className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-black tracking-tight" style={{ color: "var(--nb-fg)" }}>
                    Browsing History
                  </h1>
                  <span className="nb-tag font-mono font-bold text-[10px]">
                    {visibleVisits.length}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-nb-muted truncate max-w-[200px]">
                  Revisit your activity &amp; trails
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => load()}
                disabled={loading}
                className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm size-8 cursor-pointer disabled:opacity-50"
                title="Refresh history"
                aria-label="Refresh history"
              >
                <RotateCcw className={`size-3.5 ${loading ? "animate-spin text-indigo-500" : ""}`} />
              </button>
            </div>
          </div>

          {/* Left Column Scrollable Body */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 sm:p-4 space-y-4">
            {/* Quick Stats Bento */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border-2 border-nb-border bg-nb-surface p-2.5 shadow-nb-xs space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-nb-muted block">
                  Visits Shown
                </span>
                <p className="text-xl font-black text-nb-fg">{visibleVisits.length}</p>
                <p className="text-[10px] text-nb-muted">In current view</p>
              </div>

              <div className="rounded-xl border-2 border-nb-border bg-nb-surface p-2.5 shadow-nb-xs space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-nb-muted block">
                  Active Days
                </span>
                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{activeDays}</p>
                <p className="text-[10px] text-nb-muted">Recorded timeline</p>
              </div>
            </div>

            {/* Quick Presets Filter Buttons */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-nb-fg uppercase tracking-wider text-[10px]">
                Quick Date Presets
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "today", label: "Today" },
                  { id: "7d", label: "7 Days" },
                  { id: "30d", label: "30 Days" },
                  { id: "all", label: "All Time" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setPresetRange(preset.id as "today" | "7d" | "30d" | "all")}
                    className="rounded-lg border-2 border-nb-border bg-nb-surface py-1 text-center text-[11px] font-bold text-nb-fg shadow-nb-xs hover:bg-nb-surface-alt hover:border-indigo-500 transition-all cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range Filter Inputs */}
            <div className="rounded-xl border-2 border-nb-border bg-nb-surface p-3 shadow-nb-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-nb-fg flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-indigo-500" />
                  <span>Custom Date Range</span>
                </span>
                {(fromDate || toDate) && (
                  <button
                    type="button"
                    onClick={() => { setFromDate(""); setToDate(""); setSliderFilter("all"); }}
                    className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="size-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block text-[11px] font-bold text-nb-muted">
                  From
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                    className="nb-input mt-1 w-full text-xs"
                  />
                </label>
                <label className="block text-[11px] font-bold text-nb-muted">
                  To
                  <input
                    type="date"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                    className="nb-input mt-1 w-full text-xs"
                  />
                </label>
              </div>
            </div>

            {/* Action Buttons: Export CSV & Clear History */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={exportHistory}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-nb-border bg-nb-surface py-2 text-xs font-black text-nb-fg shadow-nb-xs hover:bg-nb-surface-alt transition-colors cursor-pointer"
              >
                <Download className="size-4 text-indigo-500" />
                <span>Export CSV Trail</span>
              </button>

              <button
                type="button"
                onClick={clearHistory}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-nb-border bg-rose-50 dark:bg-rose-950/20 py-2 text-xs font-black text-rose-600 shadow-nb-xs hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <Trash2 className="size-4" />
                <span>Clear Browsing History</span>
              </button>
            </div>

            {/* Pro Tip Callout */}
            <div className="rounded-xl border border-nb-border/40 bg-nb-surface-alt/70 p-3 text-[11px] text-nb-muted leading-relaxed">
              💡 <strong>History Trail:</strong> Visits are automatically recorded when opening websites. Use the timeline slider to swiftly navigate between days!
            </div>
          </div>
        </aside>

        {/* ===================================================================== */}
        {/* RIGHT COLUMN: Timeline Slider, Search & Scrollable Visit Stream       */}
        {/* ===================================================================== */}
        <section
          className={`flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-nb-bg ${
            mobileTab === "history" ? "flex flex-1" : "hidden lg:flex"
          }`}
        >
          {/* Top Control Bar: Search & Timeline Filter Slider */}
          <div className="shrink-0 border-b-2 border-nb-border bg-nb-card p-3 sm:px-5 sm:py-3 space-y-2.5">
            {/* Search Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 min-w-0 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-nb-muted pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter history by title, domain or url..."
                  className="w-full rounded-xl border-2 border-nb-border bg-nb-surface pl-9 pr-8 py-1.5 text-xs font-bold text-nb-fg placeholder:text-nb-muted shadow-nb-xs focus:outline-none focus:border-indigo-600 transition-colors"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nb-muted hover:text-nb-fg cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={selectAllVisits}
                  className="rounded-xl border-2 border-nb-border bg-nb-surface px-2.5 py-1.5 text-xs font-bold text-nb-fg shadow-nb-xs hover:bg-nb-surface-alt transition-colors cursor-pointer hidden sm:flex items-center gap-1.5"
                >
                  <Check className="size-3.5 text-emerald-500" />
                  <span>{selectedIds.size === visibleVisits.length && visibleVisits.length > 0 ? "Deselect All" : "Select All"}</span>
                </button>
              </div>
            </div>

            {/* Horizontal Timeline Filter Slider with Smooth Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollSlider("left")}
                className="size-7 flex items-center justify-center rounded-lg border-2 border-nb-border bg-nb-surface text-nb-muted hover:text-nb-fg shadow-nb-xs shrink-0 cursor-pointer"
                title="Scroll filters left"
                aria-label="Scroll filters left"
              >
                <ChevronLeft className="size-3.5" />
              </button>

              <div
                ref={sliderRef}
                className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5"
              >
                {SLIDER_FILTERS.map((cat) => {
                  const isActive = sliderFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSliderFilter(cat.id)}
                      className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-1 text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                        isActive
                          ? "border-nb-border bg-indigo-600 text-white shadow-nb-xs font-black"
                          : "border-nb-border/40 bg-nb-surface text-nb-muted hover:text-nb-fg hover:border-nb-border"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollSlider("right")}
                className="size-7 flex items-center justify-center rounded-lg border-2 border-nb-border bg-nb-surface text-nb-muted hover:text-nb-fg shadow-nb-xs shrink-0 cursor-pointer"
                title="Scroll filters right"
                aria-label="Scroll filters right"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Main Scrollable History Stream */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3 sm:p-5 space-y-4">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="size-8 animate-spin text-indigo-600" />
                <p className="text-xs font-black text-nb-fg">Retrieving Browsing Trail...</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-2xl border-2 border-dashed border-nb-border/50 bg-nb-card space-y-2">
                <History className="size-10 text-nb-muted opacity-40 mx-auto" />
                <p className="text-sm font-black text-nb-fg">No History Found</p>
                <p className="text-xs text-nb-muted max-w-sm">
                  {query
                    ? `No visits match "${query}". Try another search term or clear the filter.`
                    : "No visits recorded for this timeline period. Launch saved websites to build your history trail!"}
                </p>
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="mt-2 rounded-xl border-2 border-nb-border bg-nb-surface px-3 py-1 text-xs font-bold text-nb-fg shadow-nb-xs hover:bg-nb-surface-alt transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              filteredEntries.map(([day, visits]) => {
                if (!visits.length) return null;
                const isDayAllSelected = visits.length > 0 && visits.every((v) => selectedIds.has(v._id));

                return (
                  <section
                    key={day}
                    className="rounded-2xl border-2 border-nb-border bg-nb-card p-3 sm:p-4 shadow-nb-xs space-y-2.5 animate-in fade-in duration-150"
                  >
                    {/* Day Header */}
                    <div className="flex items-center justify-between pb-1 border-b border-nb-border/30">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-indigo-500" />
                        <h2 className="text-xs sm:text-sm font-black text-nb-fg">
                          {day === todayStr ? `Today • ${day}` : day === yesterdayStr ? `Yesterday • ${day}` : day}
                        </h2>
                        <span className="rounded-md border border-nb-border/40 bg-nb-surface px-1.5 py-0.2 text-[10px] font-mono font-bold text-nb-muted">
                          {visits.length} {visits.length === 1 ? "visit" : "visits"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSelectDay(visits as Visit[])}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        {isDayAllSelected ? "Deselect day" : "Select day"}
                      </button>
                    </div>

                    {/* Day Visit Items List */}
                    <div className="rounded-xl border-2 border-nb-border bg-nb-surface overflow-hidden">
                      {visits.map((visit) => (
                        <HistoryRow
                          key={visit._id}
                          visit={visit}
                          isSelected={selectedIds.has(visit._id)}
                          onToggleSelect={toggleSelect}
                          onDelete={deleteVisit}
                          isDeleting={deletingId === visit._id}
                        />
                      ))}
                    </div>
                  </section>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* Floating Batch Selection Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 sm:gap-3 rounded-2xl border-2 border-[var(--nb-border)] bg-[var(--nb-card)] p-2.5 sm:px-4 sm:py-3 shadow-[6px_6px_0_0_var(--nb-shadow)] max-w-[94vw] animate-in fade-in slide-in-from-bottom-4">
          <span className="text-xs sm:text-sm font-black whitespace-nowrap text-nb-fg">
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-0.5 bg-nb-border opacity-30 shrink-0" />
          <button
            type="button"
            onClick={selectAllVisits}
            className="nb-btn nb-btn-surface nb-btn-sm text-xs font-bold whitespace-nowrap cursor-pointer"
          >
            {selectedIds.size === visibleVisits.length ? "Deselect All" : "Select All"}
          </button>
          <button
            type="button"
            onClick={deleteSelectedVisits}
            disabled={isBatchDeleting}
            className="nb-btn nb-btn-danger nb-btn-sm text-xs font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isBatchDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            <span>Delete ({selectedIds.size})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            aria-label="Clear selection"
            title="Clear selection"
            className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm size-7 shrink-0 cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
