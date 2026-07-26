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

  const summaryCards = [
    { label: "Websites", value: summary?.totalWebsites ?? 0, color: "var(--nb-bruto-yellow)" },
    { label: "Folders", value: summary?.totalFolders ?? 0, color: "var(--nb-bruto-blue)" },
    { label: "Visits", value: summary?.totalVisits ?? 0, color: "var(--nb-bruto-mint)" },
    { label: "Today", value: summary?.visitsToday ?? 0, color: "var(--nb-bruto-orange)" },
    { label: "Avg/day", value: summary?.averageVisitsPerDay ?? 0, color: "var(--nb-bruto-purple)" },
    { label: "Favorites", value: summary?.favoriteWebsites ?? 0, color: "var(--nb-bruto-coral)" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--nb-bg)" }}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="nb-card-static">
          <div className="nb-section-header">
            <span className="nb-section-icon" style={{ background: "var(--nb-primary)" }}>
              <BarChart3 className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>Analytics</h1>
              <p className="mt-1 text-sm" style={{ color: "var(--nb-muted)" }}>A clearer view of bookmarks, activity, tasks, and health.</p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
              {summaryCards.map((card) => (
                <div key={card.label} className="nb-card-static p-4" style={{ background: card.color }}>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--nb-fg)", opacity: 0.6 }}>{card.label}</p>
                  <p className="mt-2 text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>{card.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              {/* At a Glance */}
              <section className="nb-card-static p-5 xl:col-span-2" style={{ background: "var(--nb-surface-alt)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-extrabold" style={{ color: "var(--nb-fg)" }}>At a glance</h2>
                    <p className="text-sm" style={{ color: "var(--nb-muted)" }}>Activity, retention, and workspace balance.</p>
                  </div>
                  <div className="nb-tag">
                    <TrendingUp className="size-3.5" style={{ color: "var(--nb-primary)" }} />
                    {summary?.completedTodos ?? 0} completed tasks
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    { label: "Todos open", value: summary?.activeTodos ?? 0, icon: FolderOpen, color: "var(--nb-bruto-blue)" },
                    { label: "Archived trash", value: summary?.trashedWebsites ?? 0, icon: Trash2, color: "var(--nb-bruto-coral)" },
                    { label: "Completed tasks", value: summary?.completedTodos ?? 0, icon: Flame, color: "var(--nb-bruto-mint)" },
                  ].map((item) => (
                    <div key={item.label} className="nb-card-sm p-4" style={{ background: item.color }}>
                      <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--nb-fg)", opacity: 0.7 }}>
                        <item.icon className="size-4" />
                        {item.label}
                      </div>
                      <p className="mt-3 text-3xl font-extrabold" style={{ color: "var(--nb-fg)" }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Charts */}
              <section className="nb-card-static p-5">
                <h2 className="text-sm font-extrabold" style={{ color: "var(--nb-fg)" }}>Visits Over Time</h2>
                <VisitsLineChart data={visits} />
              </section>
              <section className="nb-card-static p-5">
                <h2 className="text-sm font-extrabold" style={{ color: "var(--nb-fg)" }}>Most Visited</h2>
                <TopWebsitesBarChart data={top} />
              </section>
              <section className="nb-card-static p-5">
                <h2 className="text-sm font-extrabold" style={{ color: "var(--nb-fg)" }}>Folder Distribution</h2>
                <FolderDistributionPieChart data={folders} />
              </section>
              <section className="nb-card-static p-5">
                <h2 className="text-sm font-extrabold" style={{ color: "var(--nb-fg)" }}>Activity Heatmap</h2>
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
