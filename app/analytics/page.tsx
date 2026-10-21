"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart2,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Flame,
  Folder,
  FolderOpen,
  Globe,
  Heart,
  LayoutGrid,
  LineChart,
  ListTodo,
  Loader2,
  PieChart,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/navbar";
import ActivityHeatmap from "@/components/charts/ActivityHeatmap";
import FolderDistributionPieChart, {
  FolderDistributionItem,
} from "@/components/charts/FolderDistributionPieChart";
import TopWebsitesBarChart, {
  TopWebsiteItem,
} from "@/components/charts/TopWebsitesBarChart";
import VisitsLineChart from "@/components/charts/VisitsLineChart";
import { clientTzOffsetMinutes } from "@/lib/date-buckets";
import { fetchWithAuth } from "@/lib/auth-client";

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

type TimeRange = "7d" | "14d" | "30d" | "90d";
type TabView = "overview" | "traffic" | "folders" | "habits";

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [peakStats, setPeakStats] = useState<PeakStats | null>(null);
  const [visits, setVisits] = useState<{ date: string; visits: number }[]>([]);
  const [top, setTop] = useState<TopWebsiteItem[]>([]);
  const [folders, setFolders] = useState<FolderDistributionItem[]>([]);
  const [heatmap, setHeatmap] = useState<{ date: string; count: number }[]>([]);
  const [range, setRange] = useState<TimeRange>("30d");
  const [tabView, setTabView] = useState<TabView>("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load all analytics data
  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const tz = String(clientTzOffsetMinutes());
      const [summaryRes, visitsRes, topRes, foldersRes, heatmapRes, streakRes, peakRes] =
        await Promise.all([
          fetchWithAuth(`/api/analytics/summary?tz=${tz}`),
          fetchWithAuth(`/api/analytics/visits-over-time?range=${range}&tz=${tz}`),
          fetchWithAuth("/api/analytics/top-websites?limit=15"),
          fetchWithAuth("/api/analytics/folder-distribution"),
          fetchWithAuth(`/api/analytics/heatmap?tz=${tz}`),
          fetchWithAuth(`/api/analytics/streak?tz=${tz}`),
          fetchWithAuth(`/api/analytics/peak-stats?tz=${tz}`),
        ]);

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (visitsRes.ok) setVisits((await visitsRes.json()).data ?? []);
      if (topRes.ok) {
        const payload = await topRes.json();
        setTop(
          (payload.websites ?? []).map((website: {
            title: string;
            domain: string;
            url: string;
            visitCount: number;
            faviconUrl?: string;
            folderId?: { name: string; color: string } | null;
          }) => ({
            name: website.title || website.domain,
            domain: website.domain,
            url: website.url,
            visits: website.visitCount,
            faviconUrl: website.faviconUrl,
            folderId: website.folderId,
          })),
        );
      }
      if (foldersRes.ok) setFolders((await foldersRes.json()).data ?? []);
      if (heatmapRes.ok) setHeatmap((await heatmapRes.json()).data ?? []);
      if (streakRes.ok) setStreak(await streakRes.json());
      if (peakRes.ok) setPeakStats(await peakRes.json());

      if (isRefresh) {
        toast.success("Analytics refreshed with latest activity!");
      }
    } catch {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  // Task completion calculation
  const taskStats = useMemo(() => {
    const active = summary?.activeTodos ?? 0;
    const completed = summary?.completedTodos ?? 0;
    const total = active + completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { active, completed, total, rate };
  }, [summary]);

  // Export Analytics Summary Report
  const exportReport = () => {
    const reportData = {
      exportedAt: new Date().toISOString(),
      summary,
      streak,
      peakStats,
      range,
      visitsHistory: visits,
      topWebsites: top,
      folderDistribution: folders,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `wesite-analytics-${range}-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Analytics report downloaded successfully!");
  };

  const summaryCards = [
    {
      id: "websites",
      label: "Websites",
      value: summary?.totalWebsites ?? 0,
      icon: Globe,
      accent: "var(--nb-primary)",
      description: "Total saved bookmarks",
      targetTab: "overview",
    },
    {
      id: "folders",
      label: "Folders",
      value: summary?.totalFolders ?? 0,
      icon: Folder,
      accent: "var(--nb-accent)",
      description: "Organized categories",
      targetTab: "folders",
    },
    {
      id: "visits",
      label: "Total Visits",
      value: summary?.totalVisits ?? 0,
      icon: TrendingUp,
      accent: "var(--nb-primary)",
      description: "All-time page opens",
      targetTab: "traffic",
    },
    {
      id: "today",
      label: "Visits Today",
      value: summary?.visitsToday ?? 0,
      icon: Clock,
      accent: "#f59e0b",
      description: "Activity recorded today",
      targetTab: "traffic",
    },
    {
      id: "avg",
      label: "Daily Average",
      value: summary?.averageVisitsPerDay ?? 0,
      icon: Zap,
      accent: "var(--nb-primary)",
      description: "Visits / active day",
      targetTab: "traffic",
    },
    {
      id: "favorites",
      label: "Favorites",
      value: summary?.favoriteWebsites ?? 0,
      icon: Star,
      accent: "#f59e0b",
      description: "Starred essential sites",
      targetTab: "overview",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--nb-bg)" }}>
      <Navbar />

      <main className="w-full px-3 py-4 sm:px-6 sm:py-8 lg:px-8 max-w-7xl mx-auto nb-page-enter">
        <div className="nb-card-static rounded-2xl p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header & Controls Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-nb-border pb-6">
            <div className="flex items-center gap-3">
              <span
                className="flex size-11 items-center justify-center rounded-2xl border-2 border-nb-border shadow-nb-sm"
                style={{ background: "var(--nb-primary)", color: "var(--nb-primary-fg)" }}
              >
                <BarChart3 className="size-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--nb-fg)" }}>
                    Analytics & Insights
                  </h1>
                  <span className="nb-tag font-mono font-bold text-xs">
                    {range.toUpperCase()}
                  </span>
                </div>
                <p className="mt-0.5 text-xs sm:text-sm font-medium" style={{ color: "var(--nb-muted)" }}>
                  Track browsing velocity, folder distribution, habit streaks, and task completion.
                </p>
              </div>
            </div>

            {/* Time Range & Export Actions */}
            <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
              {/* Range Selector */}
              <div
                className="flex items-center rounded-xl border-2 border-nb-border p-0.5 shadow-nb-xs"
                style={{ background: "var(--nb-surface)" }}
              >
                {(
                  [
                    { id: "7d", label: "7 Days" },
                    { id: "14d", label: "14 Days" },
                    { id: "30d", label: "30 Days" },
                    { id: "90d", label: "90 Days" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRange(opt.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      range === opt.id
                        ? "bg-[var(--nb-primary)] text-white shadow-nb-xs font-black"
                        : "text-nb-muted hover:text-nb-fg"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Export Button */}
              <button
                type="button"
                onClick={exportReport}
                className="nb-btn nb-btn-surface nb-btn-sm flex items-center gap-1.5"
                title="Export analytics report JSON"
              >
                <Download className="size-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => load(true)}
                disabled={refreshing}
                className="nb-btn nb-btn-surface nb-btn-sm flex items-center gap-1.5"
                title="Refresh metrics"
              >
                <RotateCcw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Interactive Navigation View Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin border-b-2 border-nb-border/30">
            {[
              { id: "overview", label: "Overview", icon: LayoutGrid },
              { id: "traffic", label: "Visits & Traffic", icon: LineChart },
              { id: "folders", label: "Folders & Content", icon: PieChart },
              { id: "habits", label: "Habits & Heatmap", icon: Flame },
            ].map((tab) => {
              const isActive = tabView === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTabView(tab.id as TabView)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl border-2 px-3.5 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "border-nb-border bg-[var(--nb-primary)] text-white shadow-nb-xs font-black"
                      : "border-transparent bg-transparent text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="grid min-h-80 place-items-center">
              <div className="text-center space-y-3">
                <Loader2 className="size-9 animate-spin text-[var(--nb-primary)] mx-auto" />
                <p className="text-sm font-bold text-nb-muted">Compiling your workspace intelligence...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards Grid (Clickable Drilldowns) */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-6 min-w-0">
                {summaryCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.label}
                      type="button"
                      onClick={() => setTabView(card.targetTab as TabView)}
                      className="nb-card-static nb-card-enter p-3 sm:p-4 text-left transition-all hover:-translate-y-1 hover:shadow-nb-sm group"
                      style={{ background: "var(--nb-surface-alt)" }}
                      title={`Filter to ${card.targetTab} view`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-nb-muted truncate">
                          {card.label}
                        </span>
                        <span
                          className="flex size-6 items-center justify-center rounded-lg border border-nb-border/30 bg-nb-surface text-nb-fg group-hover:scale-110 transition-transform"
                        >
                          <Icon className="size-3" style={{ color: card.accent }} />
                        </span>
                      </div>
                      <p className="mt-2 text-2xl sm:text-3xl font-black text-nb-fg truncate">
                        {card.value}
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium text-nb-muted truncate">
                        {card.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Habit Streak, Peak Times & Productivity Momentum Bento */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Current Streak */}
                <div
                  className="rounded-2xl border-2 border-nb-border p-4 shadow-nb-xs transition-all"
                  style={{ background: "var(--nb-surface)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-nb-muted">
                      Current Streak
                    </span>
                    <span className="flex size-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      <Flame className="size-3.5 animate-pulse" />
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-nb-fg">
                      {streak?.currentStreak ?? 0}
                    </span>
                    <span className="text-xs font-bold text-nb-muted">consecutive days</span>
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    🔥 Active browsing momentum
                  </p>
                </div>

                {/* Longest Streak */}
                <div
                  className="rounded-2xl border-2 border-nb-border p-4 shadow-nb-xs transition-all"
                  style={{ background: "var(--nb-surface)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-nb-muted">
                      Longest Streak
                    </span>
                    <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                      <Trophy className="size-3.5" />
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-nb-fg">
                      {streak?.longestStreak ?? 0}
                    </span>
                    <span className="text-xs font-bold text-nb-muted">days record</span>
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-nb-muted">
                    🏆 Personal best active run
                  </p>
                </div>

                {/* Most Active Hour */}
                <div
                  className="rounded-2xl border-2 border-nb-border p-4 shadow-nb-xs transition-all"
                  style={{ background: "var(--nb-surface)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-nb-muted">
                      Peak Browsing Time
                    </span>
                    <span className="flex size-6 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-500 border border-indigo-500/30">
                      <Clock className="size-3.5" />
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-nb-fg truncate">
                      {peakStats?.mostActiveHour || "N/A"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-nb-muted">
                    ⚡ Highest visit volume time
                  </p>
                </div>

                {/* Best Weekday */}
                <div
                  className="rounded-2xl border-2 border-nb-border p-4 shadow-nb-xs transition-all"
                  style={{ background: "var(--nb-surface)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-nb-muted">
                      Most Active Day
                    </span>
                    <span className="flex size-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      <Calendar className="size-3.5" />
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-nb-fg truncate">
                      {peakStats?.mostActiveWeekday || "N/A"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-nb-muted">
                    📅 Primary research day
                  </p>
                </div>
              </div>

              {/* Task Completion Velocity Bar */}
              <div
                className="rounded-2xl border-2 border-nb-border p-4 sm:p-5 shadow-nb-xs"
                style={{ background: "var(--nb-surface-alt)" }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-600 text-white font-black shadow-nb-xs">
                      <CheckCircle2 className="size-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-nb-fg">
                        Task Execution Velocity
                      </h3>
                      <p className="text-xs text-nb-muted">
                        {taskStats.completed} completed of {taskStats.total} total todos ({taskStats.rate}%)
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/todo"
                    className="nb-btn nb-btn-surface nb-btn-sm flex items-center gap-1.5 self-end sm:self-auto font-bold"
                  >
                    <span>Manage Todos</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>

                {/* Interactive Progress Bar */}
                <div className="h-3 w-full rounded-full border border-nb-border bg-nb-surface overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${taskStats.rate}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-bold text-nb-muted">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-indigo-500" />
                    <span>{taskStats.active} pending tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>{taskStats.completed} completed tasks</span>
                  </div>
                </div>
              </div>

              {/* Main Charts Bento Grid */}
              <div className="grid gap-5 xl:grid-cols-2">
                {/* 1. Visits Over Time Chart (Shown in overview or traffic) */}
                {(tabView === "overview" || tabView === "traffic") && (
                  <section className="nb-card-static rounded-2xl p-4 sm:p-5 border-2 border-nb-border shadow-nb-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                          <TrendingUp className="size-4" />
                        </span>
                        <h2 className="text-sm sm:text-base font-black text-nb-fg">
                          Visits Over Time ({range.toUpperCase()})
                        </h2>
                      </div>
                    </div>
                    <VisitsLineChart data={visits} />
                  </section>
                )}

                {/* 2. Most Visited Websites (Shown in overview or traffic) */}
                {(tabView === "overview" || tabView === "traffic") && (
                  <section className="nb-card-static rounded-2xl p-4 sm:p-5 border-2 border-nb-border shadow-nb-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500 text-black">
                          <Trophy className="size-4" />
                        </span>
                        <h2 className="text-sm sm:text-base font-black text-nb-fg">
                          Most Visited Websites
                        </h2>
                      </div>
                    </div>
                    <TopWebsitesBarChart data={top} />
                  </section>
                )}

                {/* 3. Folder Distribution Donut (Shown in overview or folders) */}
                {(tabView === "overview" || tabView === "folders") && (
                  <section className="nb-card-static rounded-2xl p-4 sm:p-5 border-2 border-nb-border shadow-nb-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                          <FolderOpen className="size-4" />
                        </span>
                        <h2 className="text-sm sm:text-base font-black text-nb-fg">
                          Folder Distribution
                        </h2>
                      </div>
                    </div>
                    <FolderDistributionPieChart data={folders} />
                  </section>
                )}

                {/* 4. Activity Heatmap (Shown in overview or habits) */}
                {(tabView === "overview" || tabView === "habits") && (
                  <section className="nb-card-static rounded-2xl p-4 sm:p-5 border-2 border-nb-border shadow-nb-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500 text-white">
                          <Flame className="size-4" />
                        </span>
                        <h2 className="text-sm sm:text-base font-black text-nb-fg">
                          Annual Activity Heatmap
                        </h2>
                      </div>
                    </div>
                    <ActivityHeatmap data={heatmap} />
                  </section>
                )}
              </div>

              {/* Smart Workspace Insights & Takeaways */}
              <div
                className="rounded-2xl border-2 border-nb-border p-4 sm:p-5 shadow-nb-xs"
                style={{ background: "var(--nb-surface)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="size-4 text-amber-500 animate-pulse" />
                  <h3 className="text-sm font-black text-nb-fg">
                    Workspace Health & Productivity Insights
                  </h3>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 text-xs">
                  <div className="rounded-xl border border-nb-border/30 bg-nb-surface-alt p-3 space-y-1">
                    <p className="font-black text-nb-fg flex items-center gap-1.5">
                      <TrendingUp className="size-3.5 text-indigo-500" />
                      <span>Browsing Frequency</span>
                    </p>
                    <p className="text-nb-muted leading-relaxed">
                      You average <strong>{summary?.averageVisitsPerDay ?? 0} visits</strong> per active day. Peak browsing occurs around <strong>{peakStats?.mostActiveHour || "afternoon"}</strong>.
                    </p>
                  </div>

                  <div className="rounded-xl border border-nb-border/30 bg-nb-surface-alt p-3 space-y-1">
                    <p className="font-black text-nb-fg flex items-center gap-1.5">
                      <Folder className="size-3.5 text-amber-500" />
                      <span>Categorization Rate</span>
                    </p>
                    <p className="text-nb-muted leading-relaxed">
                      You have <strong>{summary?.totalWebsites ?? 0} bookmarks</strong> organized across <strong>{summary?.totalFolders ?? 0} folders</strong>, maintaining a tidy workspace.
                    </p>
                  </div>

                  <div className="rounded-xl border border-nb-border/30 bg-nb-surface-alt p-3 space-y-1">
                    <p className="font-black text-nb-fg flex items-center gap-1.5">
                      <Flame className="size-3.5 text-emerald-500" />
                      <span>Consistency Score</span>
                    </p>
                    <p className="text-nb-muted leading-relaxed">
                      Active on <strong>{streak?.totalActiveDays ?? 0} days</strong> this year with an ongoing streak of <strong>{streak?.currentStreak ?? 0} days</strong>!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
