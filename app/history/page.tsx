"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Clock3, Download, Loader2, Trash2, X } from "lucide-react";
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

export default function HistoryPage() {
  const [groups, setGroups] = useState<Record<string, Visit[]>>({});
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    const response = await fetch(`/api/history?${params.toString()}`);
    if (response.ok) setGroups((await response.json()).groups ?? {});
    setLoading(false);
  }, [fromDate, toDate]);

  useEffect(() => { const timer = window.setTimeout(() => { load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function clearHistory() {
    const confirmed = window.confirm("Clear all browsing history?");
    if (!confirmed) return;
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    await fetch(`/api/history?${params.toString()}`, { method: "DELETE" });
    load();
  }

  async function deleteVisit(visitId: string) {
    setDeletingId(visitId);
    await fetch(`/api/history/${visitId}`, { method: "DELETE" });
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
              [visit.websiteId?.title, visit.websiteId?.domain, visit.websiteId?.url].join(" ").toLowerCase().includes(query.toLowerCase()),
            ),
          ] as const,
      ),
    [groups, query],
  );
  const visibleVisits = entries.flatMap(([, visits]) => visits);
  const activeDays = entries.filter(([, visits]) => visits.length).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--nb-bg)" }}>
      <Navbar search={query} onSearchChange={setQuery} />
      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="nb-card-static">
          <div className="nb-section-header">
            <span className="nb-section-icon" style={{ background: "var(--nb-warning)", color: "var(--nb-accent-fg)" }}>
              <Clock3 className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>History</h1>
              <p className="mt-1 text-sm" style={{ color: "var(--nb-muted)" }}>Search and revisit your browsing trail with less friction.</p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button type="button" onClick={exportHistory} className="nb-btn nb-btn-surface nb-btn-sm">
                <Download className="size-4" />
                Export CSV
              </button>
              <button type="button" onClick={clearHistory} className="nb-btn nb-btn-danger nb-btn-sm">
                <Trash2 className="size-4" />
                Clear history
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Date Range Filter */}
            <div className="mb-5 flex flex-wrap items-end gap-3">
              <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                From
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="nb-input mt-1"
                />
              </label>
              <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                To
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="nb-input mt-1"
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

            {/* Stats */}
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Visits shown", visibleVisits.length, "var(--nb-bruto-yellow)"],
                ["Days active", activeDays, "var(--nb-bruto-blue)"],
                ["Search matches", query ? visibleVisits.length : Object.values(groups).flat().length, "var(--nb-bruto-mint)"],
              ].map(([label, value, color]) => (
                <div key={String(label)} className="nb-card-static p-4" style={{ background: String(color) }}>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--nb-fg)", opacity: 0.6 }}>{String(label)}</p>
                  <p className="mt-2 text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>{value}</p>
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
                {entries.map(([day, visits]) =>
                  visits.length ? (
                    <section key={day} className="nb-card-static p-4" style={{ background: "var(--nb-surface)" }}>
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-extrabold" style={{ color: "var(--nb-muted)" }}>{day}</h2>
                        <span className="nb-tag">{visits.length} visits</span>
                      </div>
                      <div className="nb-card-sm overflow-hidden" style={{ background: "var(--nb-card)" }}>
                        {visits.map((visit) => (
                          <div
                            key={visit._id}
                            className="flex items-center gap-3 border-b-[3px] px-4 py-3 last:border-b-0 transition-colors hover:bg-[var(--nb-surface-alt)]"
                            style={{ borderColor: "var(--nb-border)" }}
                          >
                            <a
                              href={visit.websiteId?.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex min-w-0 flex-1 items-center gap-3"
                            >
                              {visit.websiteId?.faviconUrl ? (
                                <Image src={visit.websiteId.faviconUrl} alt="" width={28} height={28} className="size-7 rounded-lg border-[3px]" style={{ borderColor: "var(--nb-border)" }} unoptimized />
                              ) : (
                                <span className="nb-card-blue size-7 rounded-lg border-[3px]" style={{ borderColor: "var(--nb-border)" }} />
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold" style={{ color: "var(--nb-fg)" }}>{visit.websiteId?.title ?? "Deleted website"}</span>
                                <span className="block truncate text-xs" style={{ color: "var(--nb-muted)" }}>{visit.websiteId?.domain}</span>
                              </span>
                              <time className="nb-tag text-[10px]">
                                {new Date(visit.visitedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </time>
                            </a>
                            <button
                              type="button"
                              aria-label="Delete visit"
                              onClick={() => deleteVisit(visit._id)}
                              disabled={deletingId === visit._id}
                              className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm shrink-0 disabled:opacity-50"
                              style={{ color: "var(--nb-danger)" }}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null,
                )}

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
    </div>
  );
}
