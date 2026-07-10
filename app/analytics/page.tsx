"use client";

import { useEffect, useState } from "react";
import { BarChart3, Flame, FolderOpen, Trash2, TrendingUp } from "lucide-react";
import Navbar from "@/components/navbar";
import ActivityHeatmap from "@/components/charts/ActivityHeatmap";
import FolderDistributionPieChart from "@/components/charts/FolderDistributionPieChart";
import TopWebsitesBarChart from "@/components/charts/TopWebsitesBarChart";
import VisitsLineChart from "@/components/charts/VisitsLineChart";

type Summary = {
  totalWebsites: number;
  totalFolders: number;
  totalVisits: number;
  visitsToday: number;
  averageVisitsPerDay: number;
  favoriteWebsites: number;
  trashedWebsites: number;
  activeTodos: number;
  completedTodos: number;
};

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [visits, setVisits] = useState([]);
  const [top, setTop] = useState([]);
  const [folders, setFolders] = useState([]);
  const [heatmap, setHeatmap] = useState([]);

  useEffect(() => {
    async function load() {
      const [summaryRes, visitsRes, topRes, foldersRes, heatmapRes] = await Promise.all([
        fetch("/api/analytics/summary"),
        fetch("/api/analytics/visits-over-time?range=30d"),
        fetch("/api/analytics/top-websites"),
        fetch("/api/analytics/folder-distribution"),
        fetch("/api/analytics/heatmap"),
      ]);

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (visitsRes.ok) setVisits((await visitsRes.json()).data);
      if (topRes.ok) {
        const payload = await topRes.json();
        setTop(payload.websites.map((website: { title: string; domain: string; visitCount: number }) => ({
          name: website.title || website.domain,
          visits: website.visitCount,
        })));
      }
      if (foldersRes.ok) setFolders((await foldersRes.json()).data);
      if (heatmapRes.ok) setHeatmap((await heatmapRes.json()).data);
    }

    load();
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_18px_50px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="border-b border-[color:var(--border)] px-6 py-6 sm:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                <BarChart3 className="size-5" />
              </span>
              <div>
                <h1 className="text-2xl font-semibold">Analytics</h1>
                <p className="mt-1 text-sm text-[color:var(--muted)]">A clearer view of bookmarks, activity, tasks, and health.</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          {[
            ["Websites", summary?.totalWebsites ?? 0],
            ["Folders", summary?.totalFolders ?? 0],
            ["Visits", summary?.totalVisits ?? 0],
            ["Today", summary?.visitsToday ?? 0],
            ["Avg/day", summary?.averageVisitsPerDay ?? 0],
            ["Favorites", summary?.favoriteWebsites ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </div>
          ))}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-sm xl:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">At a glance</h2>
                    <p className="text-sm text-[color:var(--muted)]">Activity, retention, and workspace balance.</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)]">
                    <TrendingUp className="size-3.5 text-blue-600" />
                    {summary?.completedTodos ?? 0} completed tasks
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    { label: "Todos open", value: summary?.activeTodos ?? 0, icon: FolderOpen },
                    { label: "Archived trash", value: summary?.trashedWebsites ?? 0, icon: Trash2 },
                    { label: "Completed tasks", value: summary?.completedTodos ?? 0, icon: Flame },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                      <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
                        <item.icon className="size-4 text-blue-600" />
                        {item.label}
                      </div>
                      <p className="mt-3 text-3xl font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-sm">
                <h2 className="text-sm font-semibold">Visits Over Time</h2>
                <VisitsLineChart data={visits} />
              </section>
              <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-sm">
                <h2 className="text-sm font-semibold">Most Visited</h2>
                <TopWebsitesBarChart data={top} />
              </section>
              <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-sm">
                <h2 className="text-sm font-semibold">Folder Distribution</h2>
                <FolderDistributionPieChart data={folders} />
              </section>
              <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-sm">
                <h2 className="text-sm font-semibold">Activity Heatmap</h2>
                <div className="mt-5">
                  <ActivityHeatmap data={heatmap} />
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
