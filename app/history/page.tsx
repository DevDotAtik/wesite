"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check, Clock3, Copy, Download, ExternalLink, Loader2, MoreVertical, Share2, Trash2, X } from "lucide-react";
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

function CopyVisitButton({ url }: { url?: string }) {
  const [copied, setCopied] = useState(false);
  if (!url) return null;

  return (
    <button
      type="button"
      aria-label="Copy URL"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
          toast.success("URL copied to clipboard");
        } catch {}
      }}
      className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm shrink-0"
      title={copied ? "Copied!" : "Copy link"}
    >
      {copied ? <Check className="size-3.5 text-emerald-500 nb-pop-in" /> : <Copy className="size-3.5" />}
    </button>
  );
}

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
    document.addEventListener("mousedown", handleClose);
    document.addEventListener("touchstart", handleClose);
    return () => {
      document.removeEventListener("mousedown", handleClose);
      document.removeEventListener("touchstart", handleClose);
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
      className={`group relative flex items-center gap-2.5 sm:gap-3 border-b-[3px] px-3.5 py-3 last:border-b-0 transition-colors hover:bg-[var(--nb-surface-alt)] ${
        isSelected ? "bg-[var(--nb-primary)]/5" : ""
      } ${menuOpen ? "z-30" : "z-auto"}`}
      style={{ borderColor: "var(--nb-border)" }}
    >
      {/* Selection Checkbox: Always visible on mobile, hover/selected on desktop */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleSelect(visit._id);
        }}
        aria-label={isSelected ? "Deselect visit" : "Select visit"}
        title={isSelected ? "Deselect visit" : "Select visit"}
        className={`flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
          isSelected
            ? "border-[var(--nb-border)] bg-[var(--nb-primary)] text-white shadow-xs opacity-100"
            : "border-[var(--nb-border)]/50 bg-[var(--nb-surface)] text-[var(--nb-muted)] hover:border-[var(--nb-border)] hover:text-[var(--nb-fg)] opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        }`}
      >
        {isSelected ? (
          <Check className="size-3.5 stroke-[3]" />
        ) : (
          <span className="size-2 rounded-xs border border-current" />
        )}
      </button>

      {/* Main Content: Click to visit website */}
      <a
        href={visit.websiteId?.url}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3"
      >
        {visit.websiteId?.faviconUrl ? (
          <Image
            src={visit.websiteId.faviconUrl}
            alt=""
            width={28}
            height={28}
            className="size-7 shrink-0 rounded-lg border-[2px] object-contain p-0.5 bg-[var(--nb-surface)]"
            style={{ borderColor: "var(--nb-border)" }}
            unoptimized
          />
        ) : (
          <span
            className="nb-card-blue flex size-7 shrink-0 items-center justify-center rounded-lg border-[2px] text-[10px] font-black uppercase text-white"
            style={{ borderColor: "var(--nb-border)" }}
          >
            {(visit.websiteId?.title || visit.websiteId?.domain || "W").charAt(0).toUpperCase()}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <span
            className="block truncate text-sm font-bold group-hover:underline"
            style={{ color: "var(--nb-fg)" }}
          >
            {visit.websiteId?.title ?? "Deleted website"}
          </span>
          <span className="block truncate text-xs font-semibold" style={{ color: "var(--nb-muted)" }}>
            {visit.websiteId?.domain || visit.websiteId?.url}
          </span>
        </div>

        <time className="nb-tag shrink-0 text-[10px] hidden xs:inline-flex">
          {new Date(visit.visitedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </time>
      </a>

      {/* Mobile: Single 3-Dots Action Button */}
      <div className="relative sm:hidden shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          aria-label="More options"
          title="More options"
          className="flex size-8 items-center justify-center rounded-lg border-2 border-[var(--nb-border)] bg-[var(--nb-card)] text-[var(--nb-fg)] shadow-xs active:scale-95 transition-transform"
        >
          <MoreVertical className="size-4" />
        </button>

        {menuOpen && (
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-9 z-50 min-w-44 rounded-xl border-2 border-[var(--nb-border)] bg-[var(--nb-card)] p-1.5 shadow-[4px_4px_0_0_var(--nb-shadow)] space-y-0.5 text-xs font-bold animate-in fade-in zoom-in-95 duration-100"
            style={{ borderColor: "var(--nb-border)", background: "var(--nb-card)" }}
          >
            {visit.websiteId?.url ? (
              <a
                href={visit.websiteId.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-[var(--nb-surface-alt)] text-[var(--nb-fg)]"
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
                className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-[var(--nb-surface-alt)] text-[var(--nb-fg)]"
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
              className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-[var(--nb-surface-alt)] text-[var(--nb-fg)]"
            >
              <Check className="size-3.5 text-emerald-500" />
              <span>{isSelected ? "Deselect visit" : "Select visit"}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDelete(visit._id);
              }}
              className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-[var(--nb-surface-alt)] text-rose-500"
            >
              <Trash2 className="size-3.5" />
              <span>Delete visit</span>
            </button>
          </div>
        )}
      </div>

      {/* Desktop: Hover Action Buttons */}
      <div className="hidden sm:flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyVisitButton url={visit.websiteId?.url} />
        {visit.websiteId?.url ? (
          <a
            href={visit.websiteId.url}
            target="_blank"
            rel="noreferrer"
            className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm"
            title="Open website"
          >
            <ExternalLink className="size-3.5" />
          </a>
        ) : null}
        <button
          type="button"
          aria-label="Delete visit"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(visit._id);
          }}
          disabled={isDeleting}
          className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm disabled:opacity-50"
          style={{ color: "var(--nb-danger)" }}
          title="Delete visit"
        >
          {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [groups, setGroups] = useState<Record<string, Visit[]>>({});
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    const response = await fetch(`/api/history?${params.toString()}`);
    if (response.ok) setGroups((await response.json()).groups ?? {});
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
  }

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

  const visibleVisits = useMemo(() => entries.flatMap(([, visits]) => visits), [entries]);
  const activeDays = entries.filter(([, visits]) => visits.length).length;

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
    <div className="min-h-screen" style={{ background: "var(--nb-bg)" }}>
      <Navbar search={query} onSearchChange={setQuery} />
      <main className="w-full px-4 py-5 sm:px-6 sm:py-8 lg:px-8 nb-page-enter pb-24 sm:pb-8">
        <div className="nb-card-static">
          <div className="nb-section-header flex-wrap sm:flex-nowrap gap-3">
            <div className="flex items-center gap-3">
              <span className="nb-section-icon" style={{ background: "var(--nb-warning)", color: "var(--nb-accent-fg)" }}>
                <Clock3 className="size-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>History</h1>
                <p className="mt-0.5 text-xs sm:text-sm" style={{ color: "var(--nb-muted)" }}>Search and revisit your browsing trail with less friction.</p>
              </div>
            </div>
            <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap items-center gap-2">
              <button type="button" onClick={exportHistory} className="nb-btn nb-btn-surface nb-btn-sm flex-1 sm:flex-initial justify-center">
                <Download className="size-4" />
                Export CSV
              </button>
              <button type="button" onClick={clearHistory} className="nb-btn nb-btn-danger nb-btn-sm flex-1 sm:flex-initial justify-center">
                <Trash2 className="size-4" />
                Clear history
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* Date Range Filter */}
            <div className="mb-5 flex flex-wrap items-end gap-3">
              <label className="block text-xs font-bold w-full sm:w-auto" style={{ color: "var(--nb-fg)" }}>
                From
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="nb-input mt-1 w-full sm:w-auto"
                />
              </label>
              <label className="block text-xs font-bold w-full sm:w-auto" style={{ color: "var(--nb-fg)" }}>
                To
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="nb-input mt-1 w-full sm:w-auto"
                />
              </label>
              {(fromDate || toDate) ? (
                <button
                  type="button"
                  onClick={() => { setFromDate(""); setToDate(""); }}
                  className="nb-btn nb-btn-ghost nb-btn-sm"
                >
                  <X className="size-3.5" />
                  Clear dates
                </button>
              ) : null}
            </div>

            {/* Stats (Clean 3-Color Developer Theme) */}
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Visits shown", value: visibleVisits.length, accent: "var(--nb-warning)" },
                { label: "Days active", value: activeDays, accent: "var(--nb-primary)" },
                { label: "Search matches", value: query ? visibleVisits.length : Object.values(groups).flat().length, accent: "var(--nb-success)" },
              ].map((stat) => (
                <div key={stat.label} className="nb-card-static p-4" style={{ background: "var(--nb-surface-alt)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--nb-muted)" }}>{stat.label}</p>
                    <span className="size-2 rounded-full" style={{ background: stat.accent }} />
                  </div>
                  <p className="mt-2 text-2xl font-black" style={{ color: "var(--nb-fg)" }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Day Groups */}
            {loading ? (
              <div className="grid min-h-72 place-items-center">
                <Loader2 className="size-8 animate-spin" style={{ color: "var(--nb-primary)" }} />
              </div>
            ) : (
              <div className="space-y-5">
                {entries.map(([day, visits]) => {
                  if (!visits.length) return null;
                  const isDayAllSelected = visits.length > 0 && visits.every((v) => selectedIds.has(v._id));

                  return (
                    <section key={day} className="nb-card-static nb-card-enter p-4" style={{ background: "var(--nb-surface)" }}>
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-extrabold" style={{ color: "var(--nb-muted)" }}>{day}</h2>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSelectDay(visits as Visit[])}
                            className="text-xs font-bold hover:underline cursor-pointer"
                            style={{ color: "var(--nb-primary)" }}
                          >
                            {isDayAllSelected ? "Deselect day" : "Select day"}
                          </button>
                          <span className="nb-tag">{visits.length} visits</span>
                        </div>
                      </div>
                      <div className="nb-card-sm overflow-visible" style={{ background: "var(--nb-card)" }}>
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
                })}

                {!entries.some(([, visits]) => visits.length) ? (
                  <div className="nb-card-static grid min-h-72 place-items-center border-dashed text-center" style={{ borderStyle: "dashed" }}>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "var(--nb-fg)" }}>No history matches your search.</p>
                      <p className="mt-1 text-sm" style={{ color: "var(--nb-muted)" }}>Try another keyword or clear the filter.</p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Batch Selection Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 sm:gap-3 rounded-2xl border-2 border-[var(--nb-border)] bg-[var(--nb-card)] p-2.5 sm:px-4 sm:py-3 shadow-[6px_6px_0_0_var(--nb-shadow)] max-w-[94vw] animate-in fade-in slide-in-from-bottom-4">
          <span className="text-xs sm:text-sm font-extrabold whitespace-nowrap" style={{ color: "var(--nb-fg)" }}>
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-0.5 bg-[var(--nb-border)] opacity-30 shrink-0" />
          <button
            type="button"
            onClick={selectAllVisits}
            className="nb-btn nb-btn-surface nb-btn-sm text-xs font-bold whitespace-nowrap"
          >
            {selectedIds.size === visibleVisits.length ? "Deselect All" : "Select All"}
          </button>
          <button
            type="button"
            onClick={deleteSelectedVisits}
            disabled={isBatchDeleting}
            className="nb-btn nb-btn-danger nb-btn-sm text-xs font-bold whitespace-nowrap flex items-center gap-1.5"
          >
            {isBatchDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            <span>Delete ({selectedIds.size})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            aria-label="Clear selection"
            title="Clear selection"
            className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm size-7 shrink-0"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
