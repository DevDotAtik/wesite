"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Clock3, Trash2 } from "lucide-react";
import Navbar from "@/components/navbar";

type Visit = {
  _id: string;
  visitedAt: string;
  websiteId?: {
    title: string;
    domain: string;
    url: string;
    faviconUrl?: string;
  };
};

export default function HistoryPage() {
  const [groups, setGroups] = useState<Record<string, Visit[]>>({});
  const [query, setQuery] = useState("");

  async function load() {
    const response = await fetch("/api/history");
    if (response.ok) setGroups((await response.json()).groups ?? {});
  }

  useEffect(() => { const timer = window.setTimeout(() => { load(); }, 0); return () => window.clearTimeout(timer); }, []);

  async function clearHistory() {
    const confirmed = window.confirm("Clear all browsing history?");
    if (!confirmed) return;
    await fetch("/api/history", { method: "DELETE" });
    load();
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
            <span className="nb-section-icon" style={{ background: "var(--nb-warning)" }}>
              <Clock3 className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>History</h1>
              <p className="mt-1 text-sm" style={{ color: "var(--nb-muted)" }}>Search and revisit your browsing trail with less friction.</p>
            </div>
            <button type="button" onClick={clearHistory} className="nb-btn nb-btn-danger nb-btn-sm ml-auto">
              <Trash2 className="size-4" />
              Clear history
            </button>
          </div>

          <div className="p-4 sm:p-6">
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
            <div className="space-y-5">
              {entries.map(([day, visits]) =>
                visits.length ? (
                  <section key={day} className="nb-card-static p-4" style={{ background: "var(--nb-surface)" }}>
                    <h2 className="mb-3 text-sm font-extrabold" style={{ color: "var(--nb-muted)" }}>{day}</h2>
                    <div className="nb-card-sm overflow-hidden" style={{ background: "var(--nb-card)" }}>
                      {visits.map((visit) => (
                        <a
                          key={visit._id}
                          href={visit.websiteId?.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 border-b-[3px] px-4 py-3 last:border-b-0 transition-colors hover:bg-[var(--nb-surface-alt)]"
                          style={{ borderColor: "var(--nb-border)" }}
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
          </div>
        </div>
      </main>
    </div>
  );
}
