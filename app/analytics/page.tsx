"use client";

import { useEffect, useState } from "react";
import { BarChart3, Flame, FolderOpen, Trash2, TrendingUp } from "lucide-react";
import Navbar from "@/components/navbar";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ActivityHeatmap from "@/components/charts/ActivityHeatmap";
import FolderDistributionPieChart from "@/components/charts/FolderDistributionPieChart";
import TopWebsitesBarChart from "@/components/charts/TopWebsitesBarChart";
import VisitsLineChart from "@/components/charts/VisitsLineChart";
import { clientTzOffsetMinutes } from "@/lib/date-buckets";

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

type Streak = {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
};

type PeakStats = {
  mostActiveHour: string;
  mostActiveWeekday: string;
  peakDay: { date: string; count: number } | null;
};

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [peakStats, setPeakStats] = useState<PeakStats | null>(null);
  const [visits, setVisits] = useState([]);
  const [top, setTop] = useState([]);
  const [folders, setFolders] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [range, setRange] = useState<"7d" | "30d">("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const tz = String(clientTzOffsetMinutes());
      const [summaryRes, visitsRes, topRes, foldersRes, heatmapRes, streakRes, peakRes] = await Promise.all([
        fetch(`/api/analytics/summary?tz=${tz}`),
        fetch(`/api/analytics/visits-over-time?range=${range}&tz=${tz}`),
        fetch("/api/analytics/top-websites"),
        fetch("/api/analytics/folder-distribution"),
        fetch(`/api/analytics/heatmap?tz=${tz}`),
        fetch(`/api/analytics/streak?tz=${tz}`),
        fetch(`/api/analytics/peak-stats?tz=${tz}`),
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
      if (streakRes.ok) setStreak(await streakRes.json());
      if (peakRes.ok) setPeakStats(await peakRes.json());
      setLoading(false);
    }
    load();
  }, [range]);

  const summaryCards = [
    { label: "Websites", value: summary?.totalWebsites ?? 0, color: "var(--nb-bruto-yellow)" },
    { label: "Folders", value: summary?.totalFolders ?? 0, color: "var(--nb-bruto-blue)" },
    { label: "Visits", value: summary?.totalVisits ?? 0, color: "var(--nb-bruto-mint)" },
    { label: "Today", value: summary?.visitsToday ?? 0, color: "var(--nb-bruto-orange)" },
    { label: "Avg/day", value: summary?.averageVisitsPerDay ?? 0, color: "var(--nb-bruto-purple)" },
    { label: "Favorites", value: summary?.favoriteWebsites ?? 0, color: "var(--nb-bruto-coral)" },
  ];

  return (
    <div className="min-h-[100dvh]" style={{ background: "var(--nb-bg)" }}>
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
            <div className="ml-auto flex items-center gap-1 rounded-xl border-3 p-0.5" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
              {(["7d", "30d"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  className={`nb-btn nb-btn-sm text-[10px] ${range === option ? "nb-btn-primary" : "nb-btn-ghost"}`}
                >
                  {option === "7d" ? "7 Days" : "30 Days"}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="min-h-72">
                <LoadingSkeleton />
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
                  {summaryCards.map((card) => (
                    <div key={card.label} className="nb-card-static p-4" style={{ background: card.color }}>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--nb-fg)", opacity: 0.6 }}>{card.label}</p>
                      <p className="mt-2 text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>{card.value}</p>
                    </div>
                  ))}
                </div>

                {/* Streak & Peak Stats */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {streak ? (
                    <>
                      <div className="nb-card-static p-4" style={{ background: "var(--nb-bruto-orange)" }}>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--nb-fg)", opacity: 0.6 }}>Current Streak</p>
                        <div className="mt-2 flex items-baseline gap-2">
                          <p className="text-3xl font-extrabold" style={{ color: "var(--nb-fg)" }}>{streak.currentStreak}</p>
                          <p className="text-xs font-bold" style={{ color: "var(--nb-fg)", opacity: 0.6 }}>days</p>
                        </div>
                      </div>
                      <div className="nb-card-static p-4" style={{ background: "var(--nb-bruto-mint)" }}>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--nb-fg)", opacity: 0.6 }}>Longest Streak</p>
                        <div className="mt-2 flex items-baseline gap-2">
                          <p className="text-3xl font-extrabold" style={{ color: "var(--nb-fg)" }}>{streak.longestStreak}</p>
                          <p className="text-xs font-bold" style={{ color: "var(--nb-fg)", opacity: 0.6 }}>days</p>
                        </div>
                      </div>
                    </>
                  ) : null}
                  {peakStats ? (
                    <>
                      <div className="nb-card-static p-4" style={{ background: "var(--nb-bruto-purple)" }}>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--nb-fg)", opacity: 0.6 }}>Most Active Hour</p>
                        <p className="mt-2 text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>{peakStats.mostActiveHour}</p>
                      </div>
                      <div className="nb-card-static p-4" style={{ background: "var(--nb-bruto-cyan)" }}>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--nb-fg)", opacity: 0.6 }}>Best Weekday</p>
                        <p className="mt-2 text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>{peakStats.mostActiveWeekday}</p>
                      </div>
                    </>
                  ) : null}
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
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
