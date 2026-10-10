"use client";

import { useEffect, useState } from "react";
import { BarChart3, Flame, FolderOpen, Loader2, Trash2, TrendingUp } from "lucide-react";
import Navbar from "@/components/navbar";
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
    { label: "Websites", value: summary?.totalWebsites ?? 0, accent: "var(--nb-primary)" },
    { label: "Folders", value: summary?.totalFolders ?? 0, accent: "var(--nb-accent)" },
    { label: "Visits", value: summary?.totalVisits ?? 0, accent: "var(--nb-primary)" },
    { label: "Today", value: summary?.visitsToday ?? 0, accent: "var(--nb-warning)" },
    { label: "Avg/day", value: summary?.averageVisitsPerDay ?? 0, accent: "var(--nb-primary)" },
    { label: "Favorites", value: summary?.favoriteWebsites ?? 0, accent: "var(--nb-warning)" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--nb-bg)" }}>
      <Navbar />
      <main className="w-full px-3 py-4 sm:px-6 sm:py-8 lg:px-8 nb-page-enter">
        <div className="nb-card-static max-w-full overflow-hidden">
          <div className="nb-section-header flex-wrap sm:flex-nowrap gap-3">
            <div className="flex items-center gap-3">
              <span className="nb-section-icon" style={{ background: "var(--nb-primary)" }}>
                <BarChart3 className="size-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>Analytics</h1>
                <p className="mt-0.5 text-xs sm:text-sm" style={{ color: "var(--nb-muted)" }}>A clearer view of bookmarks, activity, tasks, and health.</p>
              </div>
            </div>
            <div className="w-full sm:w-auto sm:ml-auto flex items-center justify-end gap-1 rounded-xl border-2 p-0.5" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
              {(["7d", "30d"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  className={`nb-btn nb-btn-sm text-[10px] flex-1 sm:flex-initial justify-center ${range === option ? "nb-btn-primary" : "nb-btn-ghost"}`}
                >
                  {option === "7d" ? "7 Days" : "30 Days"}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 sm:p-6 lg:p-8 min-w-0 max-w-full">
            {loading ? (
              <div className="grid min-h-72 place-items-center">
                <Loader2 className="size-8 animate-spin" style={{ color: "var(--nb-primary)" }} />
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-6 min-w-0">
                  {summaryCards.map((card) => (
                    <div key={card.label} className="nb-card-static nb-card-enter p-3 sm:p-4 transition-transform hover:-translate-y-0.5 min-w-0" style={{ background: "var(--nb-surface-alt)" }}>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider truncate" style={{ color: "var(--nb-muted)" }}>{card.label}</p>
                        <span className="size-2 rounded-full shrink-0" style={{ background: card.accent }} />
                      </div>
                      <p className="mt-2 text-2xl font-black truncate" style={{ color: "var(--nb-fg)" }}>{card.value}</p>
                    </div>
                  ))}
                </div>

                {/* Streak & Peak Stats */}
                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 min-w-0">
                  {streak ? (
                    <>
                      <div className="nb-card-static p-3 sm:p-4 min-w-0" style={{ background: "var(--nb-surface-alt)" }}>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider truncate" style={{ color: "var(--nb-muted)" }}>Current Streak</p>
                          <span className="size-2 rounded-full bg-[var(--nb-warning)] shrink-0" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5 sm:gap-2">
                          <p className="text-2xl sm:text-3xl font-black" style={{ color: "var(--nb-fg)" }}>{streak.currentStreak}</p>
                          <p className="text-xs font-bold" style={{ color: "var(--nb-muted)" }}>days</p>
                        </div>
                      </div>
                      <div className="nb-card-static p-3 sm:p-4 min-w-0" style={{ background: "var(--nb-surface-alt)" }}>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider truncate" style={{ color: "var(--nb-muted)" }}>Longest Streak</p>
                          <span className="size-2 rounded-full bg-[var(--nb-success)] shrink-0" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5 sm:gap-2">
                          <p className="text-2xl sm:text-3xl font-black" style={{ color: "var(--nb-fg)" }}>{streak.longestStreak}</p>
                          <p className="text-xs font-bold" style={{ color: "var(--nb-muted)" }}>days</p>
                        </div>
                      </div>
                    </>
                  ) : null}
                  {peakStats ? (
                    <>
                      <div className="nb-card-static p-3 sm:p-4 min-w-0" style={{ background: "var(--nb-surface-alt)" }}>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider truncate" style={{ color: "var(--nb-muted)" }}>Most Active</p>
                          <span className="size-2 rounded-full bg-[var(--nb-primary)] shrink-0" />
                        </div>
                        <p className="mt-2 text-xl sm:text-2xl font-black truncate" style={{ color: "var(--nb-fg)" }}>{peakStats.mostActiveHour}</p>
                      </div>
                      <div className="nb-card-static p-3 sm:p-4 min-w-0" style={{ background: "var(--nb-surface-alt)" }}>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider truncate" style={{ color: "var(--nb-muted)" }}>Best Day</p>
                          <span className="size-2 rounded-full bg-[var(--nb-accent)] shrink-0" />
                        </div>
                        <p className="mt-2 text-xl sm:text-2xl font-black truncate" style={{ color: "var(--nb-fg)" }}>{peakStats.mostActiveWeekday}</p>
                      </div>
                    </>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-4 sm:gap-5 xl:grid-cols-2 min-w-0 max-w-full">
                  {/* At a Glance */}
                  <section className="nb-card-static p-4 sm:p-5 xl:col-span-2 min-w-0 max-w-full overflow-hidden" style={{ background: "var(--nb-surface-alt)" }}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-extrabold" style={{ color: "var(--nb-fg)" }}>At a glance</h2>
                        <p className="text-xs sm:text-sm" style={{ color: "var(--nb-muted)" }}>Activity, retention, and workspace balance.</p>
                      </div>
                      <div className="nb-tag text-xs">
                        <TrendingUp className="size-3.5" style={{ color: "var(--nb-primary)" }} />
                        {summary?.completedTodos ?? 0} completed tasks
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3 min-w-0">
                      {[
                        { label: "Todos open", value: summary?.activeTodos ?? 0, icon: FolderOpen, accent: "var(--nb-primary)" },
                        { label: "Archived trash", value: summary?.trashedWebsites ?? 0, icon: Trash2, accent: "var(--nb-muted)" },
                        { label: "Completed tasks", value: summary?.completedTodos ?? 0, icon: Flame, accent: "var(--nb-success)" },
                      ].map((item) => (
                        <div key={item.label} className="nb-card-sm p-4 min-w-0" style={{ background: "var(--nb-card)" }}>
                          <div className="flex items-center justify-between gap-2 text-sm font-bold" style={{ color: "var(--nb-fg)" }}>
                            <span className="flex items-center gap-2 truncate">
                              <item.icon className="size-4 shrink-0" style={{ color: item.accent }} />
                              <span className="truncate">{item.label}</span>
                            </span>
                            <span className="size-2 rounded-full shrink-0" style={{ background: item.accent }} />
                          </div>
                          <p className="mt-3 text-2xl sm:text-3xl font-black" style={{ color: "var(--nb-fg)" }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Charts */}
                  <section className="nb-card-static nb-card-enter p-4 sm:p-5 min-w-0 max-w-full overflow-hidden">
                    <h2 className="text-sm font-extrabold" style={{ color: "var(--nb-fg)" }}>Visits Over Time</h2>
                    <VisitsLineChart data={visits} />
                  </section>
                  <section className="nb-card-static nb-card-enter p-4 sm:p-5 min-w-0 max-w-full overflow-hidden">
                    <h2 className="text-sm font-extrabold" style={{ color: "var(--nb-fg)" }}>Most Visited</h2>
                    <TopWebsitesBarChart data={top} />
                  </section>
                  <section className="nb-card-static nb-card-enter p-4 sm:p-5 min-w-0 max-w-full overflow-hidden">
                    <h2 className="text-sm font-extrabold" style={{ color: "var(--nb-fg)" }}>Folder Distribution</h2>
                    <FolderDistributionPieChart data={folders} />
                  </section>
                  <section className="nb-card-static nb-card-enter p-4 sm:p-5 min-w-0 max-w-full overflow-hidden">
                    <h2 className="text-sm font-extrabold" style={{ color: "var(--nb-fg)" }}>Activity Heatmap</h2>
                    <div className="mt-4 min-w-0 max-w-full">
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
