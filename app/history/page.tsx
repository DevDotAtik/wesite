"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Check, Clock3, Copy, Download, ExternalLink, Loader2, Trash2, X } from "lucide-react";
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
      <main className="w-full px-4 py-5 sm:px-6 sm:py-8 lg:px-8 nb-page-enter">
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

          <div className="p-4 sm:p-6 lg:p-8">
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
                {entries.map(([day, visits]) =>
                  visits.length ? (
                    <section key={day} className="nb-card-static nb-card-enter p-4" style={{ background: "var(--nb-surface)" }}>
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
                            <div className="flex items-center gap-1 shrink-0">
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
                                onClick={() => deleteVisit(visit._id)}
                                disabled={deletingId === visit._id}
                                className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm disabled:opacity-50"
                                style={{ color: "var(--nb-danger)" }}
                                title="Delete visit"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
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
