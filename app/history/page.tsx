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
    if (response.ok) {
      setGroups((await response.json()).groups ?? {});
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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
    <div className="min-h-screen bg-transparent">
      <Navbar search={query} onSearchChange={setQuery} />
      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_18px_50px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="border-b border-[color:var(--border)] px-6 py-6 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                  <Clock3 className="size-5" />
                </span>
                <div>
                  <h1 className="text-2xl font-semibold">History</h1>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">Search and revisit your browsing trail with less friction.</p>
                </div>
              </div>
              <button type="button" onClick={clearHistory} className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10">
                <Trash2 className="size-4" />
                Clear history
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Visits shown", visibleVisits.length],
                ["Days active", activeDays],
                ["Search matches", query ? visibleVisits.length : Object.values(groups).flat().length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5 p-4 sm:p-6">
            {entries.map(([day, visits]) =>
              visits.length ? (
                <section key={day} className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 shadow-sm">
                  <h2 className="mb-3 text-sm font-semibold text-[color:var(--muted)]">{day}</h2>
                  <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
                    {visits.map((visit) => (
                      <a
                        key={visit._id}
                        href={visit.websiteId?.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 border-b border-black/5 px-4 py-3 last:border-b-0 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                      >
                        {visit.websiteId?.faviconUrl ? (
                          <Image src={visit.websiteId.faviconUrl} alt="" width={28} height={28} className="size-7 rounded" unoptimized />
                        ) : (
                          <span className="size-7 rounded bg-blue-600" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{visit.websiteId?.title ?? "Deleted website"}</span>
                          <span className="block truncate text-xs text-[color:var(--muted)]">{visit.websiteId?.domain}</span>
                        </span>
                        <time className="text-xs text-[color:var(--muted)]">
                          {new Date(visit.visitedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </time>
                      </a>
                    ))}
                  </div>
                </section>
              ) : null,
            )}

            {!entries.some(([, visits]) => visits.length) ? (
              <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] text-center">
                <div>
                  <p className="text-sm font-medium">No history matches your search.</p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">Try another keyword or clear the filter.</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
