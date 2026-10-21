"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart2,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
  Lock,
  Pause,
  PieChart,
  Play,
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
import { clientTzOffsetMinutes, dateKeyAtOffset, startOfLocalDayUtc } from "@/lib/date-buckets";
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

const SLIDES = [
  { id: 0, key: "overview", label: "Executive Overview", icon: LayoutGrid, desc: "Key metrics, habit momentum & velocity" },
  { id: 1, key: "traffic", label: "Visits & Traffic Trends", icon: LineChart, desc: "Interactive time series & website leaderboard" },
  { id: 2, key: "folders", label: "Folders & Architecture", icon: PieChart, desc: "Content distribution & category balance" },
  { id: 3, key: "habits", label: "Annual Habits & Heatmap", icon: Flame, desc: "53-week activity grid & peak research times" },
] as const;

export default function AnalyticsPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [peakStats, setPeakStats] = useState<PeakStats | null>(null);
  const [visits, setVisits] = useState<{ date: string; visits: number }[]>([]);
  const [top, setTop] = useState<TopWebsiteItem[]>([]);
  const [folders, setFolders] = useState<FolderDistributionItem[]>([]);
  const [heatmap, setHeatmap] = useState<{ date: string; count: number }[]>([]);
  const [range, setRange] = useState<TimeRange>("30d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Keyboard navigation for slider: Left & Right arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") {
        setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
      } else if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Autoplay slider interval (if enabled)
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 9000);
    return () => clearInterval(timer);
  }, [autoPlay]);

  // Generate realistic fallback / demo data if user is a guest or brand new
  const generateFallbackData = useCallback(() => {
    const tz = clientTzOffsetMinutes();
    const daysCount = range === "7d" ? 7 : range === "14d" ? 14 : range === "90d" ? 90 : 30;
    const start = startOfLocalDayUtc(Date.now(), tz) - (daysCount - 1) * 86_400_000;

    const demoVisits = Array.from({ length: daysCount }, (_, i) => {
      const key = dateKeyAtOffset(start + i * 86_400_000, tz);
      // Realistic weekday fluctuations
      const d = new Date(start + i * 86_400_000).getDay();
      const base = d === 0 || d === 6 ? 3 : 7;
      const count = Math.max(1, Math.floor(base + Math.sin(i * 0.8) * 4));
      return { date: key, visits: count };
    });

    const demoTop: TopWebsiteItem[] = [
      { name: "GitHub", domain: "github.com", url: "https://github.com", visits: 48, faviconUrl: "https://github.githubassets.com/favicons/favicon.svg" },
      { name: "OpenCode", domain: "opencode.ai", url: "https://opencode.ai", visits: 34 },
      { name: "Next.js Documentation", domain: "nextjs.org", url: "https://nextjs.org/docs", visits: 29 },
      { name: "Tailwind CSS", domain: "tailwindcss.com", url: "https://tailwindcss.com", visits: 21 },
      { name: "Hacker News", domain: "news.ycombinator.com", url: "https://news.ycombinator.com", visits: 18 },
      { name: "MDN Web Docs", domain: "developer.mozilla.org", url: "https://developer.mozilla.org", visits: 14 },
    ];

    const demoFolders: FolderDistributionItem[] = [
      { id: "f1", name: "Development", color: "#6366f1", value: 8 },
      { id: "f2", name: "AI Research", color: "#8b5cf6", value: 6 },
      { id: "f3", name: "Productivity", color: "#10b981", value: 4 },
      { id: "f4", name: "Design & UI", color: "#f59e0b", value: 3 },
    ];

    const demoHeatmap = Array.from({ length: 365 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (364 - i));
      const key = dateKeyAtOffset(date.getTime(), tz);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const count = isWeekend ? (i % 3 === 0 ? 2 : 0) : ((i * 7 + 3) % 9);
      return { date: key, count };
    });

    return {
      summary: {
        totalWebsites: 21,
        totalFolders: 4,
        totalVisits: demoVisits.reduce((acc, c) => acc + c.visits, 0),
        visitsToday: 8,
        averageVisitsPerDay: 5.8,
        favoriteWebsites: 7,
        trashedWebsites: 0,
        activeTodos: 3,
        completedTodos: 11,
      },
      streak: { currentStreak: 6, longestStreak: 18, totalActiveDays: 52 },
      peakStats: { mostActiveHour: "15:00", mostActiveWeekday: "Wednesday", peakDay: { date: "2026-10-14", count: 24 } },
      visits: demoVisits,
      top: demoTop,
      folders: demoFolders,
      heatmap: demoHeatmap,
    };
  }, [range]);

  // Load analytics data
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

      if (summaryRes.status === 401) {
        // Guest mode fallback
        setIsGuest(true);
        const fallback = generateFallbackData();
        setSummary(fallback.summary);
        setVisits(fallback.visits);
        setTop(fallback.top);
        setFolders(fallback.folders);
        setHeatmap(fallback.heatmap);
        setStreak(fallback.streak);
        setPeakStats(fallback.peakStats);
        return;
      }

      setIsGuest(false);

      if (summaryRes.ok) {
        setSummary(await summaryRes.json());
      }

      if (visitsRes.ok) {
        const vData = (await visitsRes.json()).data ?? [];
        setVisits(vData);
      }

      if (topRes.ok) {
        const payload = await topRes.json();
        const rawWebsites = payload.websites ?? [];
        setTop(
          rawWebsites.map((website: {
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
            visits: website.visitCount || 0,
            faviconUrl: website.faviconUrl,
            folderId: website.folderId,
          })),
        );
      }

      if (foldersRes.ok) {
        const fData = (await foldersRes.json()).data ?? [];
        setFolders(fData);
      }

      if (heatmapRes.ok) {
        setHeatmap((await heatmapRes.json()).data ?? []);
      }

      if (streakRes.ok) {
        setStreak(await streakRes.json());
      }

      if (peakRes.ok) {
        setPeakStats(await peakRes.json());
      }

      if (isRefresh) {
        toast.success("Analytics metrics synchronized!");
      }
    } catch {
      // In case of any network or connection failure, provide safe fallback
      const fallback = generateFallbackData();
      setSummary(fallback.summary);
      setVisits(fallback.visits);
      setTop(fallback.top);
      setFolders(fallback.folders);
      setHeatmap(fallback.heatmap);
      setStreak(fallback.streak);
      setPeakStats(fallback.peakStats);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range, generateFallbackData]);

  useEffect(() => {
    load();
  }, [load]);

  // Task execution calculation
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
    toast.success("Analytics JSON report downloaded!");
  };

  const summaryCards = [
    {
      id: "websites",
      label: "Websites",
      value: summary?.totalWebsites ?? 0,
      icon: Globe,
      accent: "#6366f1",
      description: "Total saved bookmarks",
      targetSlide: 1,
    },
    {
      id: "folders",
      label: "Folders",
      value: summary?.totalFolders ?? 0,
      icon: Folder,
      accent: "#f59e0b",
      description: "Organized categories",
      targetSlide: 2,
    },
    {
      id: "visits",
      label: "Total Visits",
      value: summary?.totalVisits ?? 0,
      icon: TrendingUp,
      accent: "#10b981",
      description: "All-time page opens",
      targetSlide: 1,
    },
    {
      id: "today",
      label: "Visits Today",
      value: summary?.visitsToday ?? 0,
      icon: Clock,
      accent: "#ec4899",
      description: "Activity recorded today",
      targetSlide: 1,
    },
    {
      id: "avg",
      label: "Daily Average",
      value: summary?.averageVisitsPerDay ?? 0,
      icon: Zap,
      accent: "#8b5cf6",
      description: "Visits / active day",
      targetSlide: 1,
    },
    {
      id: "favorites",
      label: "Favorites",
      value: summary?.favoriteWebsites ?? 0,
      icon: Star,
      accent: "#f59e0b",
      description: "Starred essential sites",
      targetSlide: 0,
    },
  ];

  return (
    <div className="h-screen w-screen max-w-full overflow-hidden flex flex-col font-sans bg-nb-bg selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* Main Full-Space Container with NO SCROLLING */}
      <main className="flex-1 w-full min-h-0 flex flex-col px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 overflow-hidden">
        {/* ========================================================================= */}
        {/* COMPACT TOP CONTROL BAR (Takes all space, minimal vertical footprint)     */}
        {/* ========================================================================= */}
        <header className="shrink-0 flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b-2 border-nb-border">
          {/* Title & Active Indicator */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex size-9 sm:size-10 items-center justify-center rounded-xl border-2 border-nb-border bg-indigo-600 text-white shadow-nb-xs shrink-0 font-black">
              <BarChart3 className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-nb-fg truncate">
                  Workspace Analytics
                </h1>
                <span className="rounded-md border border-nb-border bg-indigo-500/10 px-2 py-0.2 text-[10px] font-mono font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                  SLIDE {currentSlide + 1}/4
                </span>
                {isGuest && (
                  <span className="rounded-md border border-amber-500 bg-amber-500/15 px-2 py-0.2 text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 shrink-0">
                    Guest Demo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-nb-muted hidden sm:block truncate">
                {SLIDES[currentSlide].desc}
              </p>
            </div>
          </div>

          {/* Slider Step Pills & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Stepper Navigation Pills */}
            <nav aria-label="Analytics Sections" className="hidden md:flex items-center rounded-xl border-2 border-nb-border bg-nb-card p-0.5 shadow-nb-xs">
              {SLIDES.map((s) => {
                const Icon = s.icon;
                const isActive = currentSlide === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrentSlide(s.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-nb-xs font-black"
                        : "text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Slider Arrow Controls */}
            <div className="flex items-center rounded-xl border-2 border-nb-border bg-nb-card p-0.5 shadow-nb-xs">
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
                className="p-1 rounded-lg text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt transition-colors cursor-pointer"
                title="Previous Slide (← Arrow)"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="px-2 font-mono text-xs font-black text-nb-fg">
                {currentSlide + 1} / {SLIDES.length}
              </span>
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}
                className="p-1 rounded-lg text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt transition-colors cursor-pointer"
                title="Next Slide (→ Arrow)"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Autoplay Toggle */}
            <button
              type="button"
              onClick={() => setAutoPlay(!autoPlay)}
              className={`p-1.5 rounded-xl border-2 border-nb-border shadow-nb-xs transition-colors cursor-pointer ${
                autoPlay ? "bg-amber-400 text-black font-black" : "bg-nb-card text-nb-muted hover:text-nb-fg"
              }`}
              title={autoPlay ? "Pause Auto-Slide" : "Enable Auto-Slide"}
            >
              {autoPlay ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            </button>

            {/* Time Range Selector */}
            <div className="flex items-center rounded-xl border-2 border-nb-border bg-nb-card p-0.5 shadow-nb-xs">
              {(["7d", "14d", "30d", "90d"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setRange(opt)}
                  className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-all cursor-pointer ${
                    range === opt
                      ? "bg-indigo-600 text-white font-black"
                      : "text-nb-muted hover:text-nb-fg"
                  }`}
                >
                  {opt.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Export & Refresh */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={exportReport}
                className="p-1.5 rounded-xl border-2 border-nb-border bg-nb-card text-nb-fg shadow-nb-xs hover:bg-nb-surface-alt transition-colors cursor-pointer"
                title="Export Analytics JSON"
              >
                <Download className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => load(true)}
                disabled={refreshing}
                className="p-1.5 rounded-xl border-2 border-nb-border bg-nb-card text-nb-fg shadow-nb-xs hover:bg-nb-surface-alt transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh Analytics"
              >
                <RotateCcw className={`size-3.5 ${refreshing ? "animate-spin text-indigo-500" : ""}`} />
              </button>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* SLIDER VIEWPORT (Full Remaining Height, Zero Page Scrolling)              */}
        {/* ========================================================================= */}
        <section className="flex-1 w-full min-h-0 pt-2.5 pb-1 flex flex-col overflow-hidden relative">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Loader2 className="size-8 animate-spin text-indigo-600 mx-auto" />
                <p className="text-xs font-black text-nb-fg">Synthesizing Workspace Intelligence...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 w-full h-full min-h-0 relative overflow-hidden">
              {/* ------------------------------------------------------------------- */}
              {/* SLIDE 0: EXECUTIVE OVERVIEW & VELOCITY                              */}
              {/* ------------------------------------------------------------------- */}
              {currentSlide === 0 && (
                <div className="w-full h-full flex flex-col justify-between gap-2.5 animate-in fade-in zoom-in-95 duration-200">
                  {/* Top KPI Metric Cards (Clickable Drilldown) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 shrink-0">
                    {summaryCards.map((card) => {
                      const Icon = card.icon;
                      return (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => setCurrentSlide(card.targetSlide)}
                          className="group rounded-2xl border-2 border-nb-border bg-nb-card p-3 text-left shadow-nb-xs hover:-translate-y-0.5 hover:shadow-nb-sm transition-all cursor-pointer flex flex-col justify-between"
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
                          <p className="mt-1 text-2xl font-black text-nb-fg truncate">
                            {card.value}
                          </p>
                          <p className="text-[10px] font-medium text-nb-muted truncate">
                            {card.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Middle Habit Streak & Peak Times Bento Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
                    <div className="rounded-2xl border-2 border-nb-border bg-nb-card p-3 shadow-nb-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs font-black text-nb-muted uppercase tracking-wider text-[10px]">
                        <span>Current Streak</span>
                        <span className="flex size-5 items-center justify-center rounded-md bg-amber-500/20 text-amber-600">
                          <Flame className="size-3 animate-pulse" />
                        </span>
                      </div>
                      <div className="my-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-nb-fg">{streak?.currentStreak ?? 0}</span>
                        <span className="text-[11px] font-bold text-nb-muted">consecutive days</span>
                      </div>
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        🔥 Active research momentum
                      </p>
                    </div>

                    <div className="rounded-2xl border-2 border-nb-border bg-nb-card p-3 shadow-nb-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs font-black text-nb-muted uppercase tracking-wider text-[10px]">
                        <span>Longest Streak</span>
                        <span className="flex size-5 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-600">
                          <Trophy className="size-3" />
                        </span>
                      </div>
                      <div className="my-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-nb-fg">{streak?.longestStreak ?? 0}</span>
                        <span className="text-[11px] font-bold text-nb-muted">days personal record</span>
                      </div>
                      <p className="text-[10px] font-bold text-nb-muted">
                        🏆 Peak habit milestone
                      </p>
                    </div>

                    <div className="rounded-2xl border-2 border-nb-border bg-nb-card p-3 shadow-nb-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs font-black text-nb-muted uppercase tracking-wider text-[10px]">
                        <span>Peak Browsing Time</span>
                        <span className="flex size-5 items-center justify-center rounded-md bg-indigo-500/20 text-indigo-500">
                          <Clock className="size-3" />
                        </span>
                      </div>
                      <div className="my-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-nb-fg truncate">
                          {peakStats?.mostActiveHour || "14:00"}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-nb-muted">
                        ⚡ High velocity hours
                      </p>
                    </div>

                    <div className="rounded-2xl border-2 border-nb-border bg-nb-card p-3 shadow-nb-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs font-black text-nb-muted uppercase tracking-wider text-[10px]">
                        <span>Most Active Day</span>
                        <span className="flex size-5 items-center justify-center rounded-md bg-purple-500/20 text-purple-600">
                          <Calendar className="size-3" />
                        </span>
                      </div>
                      <div className="my-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-nb-fg truncate">
                          {peakStats?.mostActiveWeekday || "Wednesday"}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-nb-muted">
                        📅 Peak workload day
                      </p>
                    </div>
                  </div>

                  {/* Bottom Balanced Row: Task Execution Velocity + Productivity Insights */}
                  <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                    {/* Task Execution Velocity Card */}
                    <div className="rounded-2xl border-2 border-nb-border bg-nb-surface p-3.5 shadow-nb-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-600 text-white font-black">
                            <CheckCircle2 className="size-4" />
                          </span>
                          <div>
                            <h3 className="text-xs sm:text-sm font-black text-nb-fg">
                              Task Execution Velocity
                            </h3>
                            <p className="text-[11px] text-nb-muted">
                              {taskStats.completed} completed of {taskStats.total} total todos ({taskStats.rate}%)
                            </p>
                          </div>
                        </div>
                        <Link
                          href="/todo"
                          className="flex items-center gap-1 rounded-xl border-2 border-nb-border bg-nb-card px-2.5 py-1 text-xs font-black text-nb-fg shadow-nb-xs hover:bg-nb-surface-alt transition-colors cursor-pointer"
                        >
                          <span>Manage Todos</span>
                          <ArrowRight className="size-3" />
                        </Link>
                      </div>

                      {/* Velocity Progress Bar */}
                      <div className="my-2">
                        <div className="h-3 w-full rounded-full border border-nb-border bg-nb-surface-alt overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${taskStats.rate}%` }}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-nb-muted">
                          <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-indigo-500" />
                            {taskStats.active} pending tasks
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            {taskStats.completed} completed tasks
                          </span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-nb-border/30 bg-nb-surface-alt/70 p-2 text-[11px] text-nb-muted leading-relaxed">
                        💡 <strong>Productivity Pulse:</strong> Keep your momentum steady by breaking down large tasks and syncing with Google Calendar alerts!
                      </div>
                    </div>

                    {/* Productivity Insights Card */}
                    <div className="rounded-2xl border-2 border-nb-border bg-nb-surface p-3.5 shadow-nb-xs flex flex-col justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-amber-500" />
                        <h3 className="text-xs sm:text-sm font-black text-nb-fg">
                          Workspace Health &amp; Takeaways
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-2">
                        <div className="rounded-xl border border-nb-border/30 bg-nb-surface-alt p-2.5 space-y-0.5">
                          <span className="text-[10px] font-black uppercase text-nb-muted flex items-center gap-1">
                            <TrendingUp className="size-3 text-indigo-500" /> Frequency
                          </span>
                          <p className="text-xs font-black text-nb-fg">
                            {summary?.averageVisitsPerDay ?? 0} visits/day
                          </p>
                          <p className="text-[10px] text-nb-muted leading-tight">
                            Peak around {peakStats?.mostActiveHour || "afternoon"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-nb-border/30 bg-nb-surface-alt p-2.5 space-y-0.5">
                          <span className="text-[10px] font-black uppercase text-nb-muted flex items-center gap-1">
                            <Folder className="size-3 text-amber-500" /> Structure
                          </span>
                          <p className="text-xs font-black text-nb-fg">
                            {summary?.totalFolders ?? 0} folders
                          </p>
                          <p className="text-[10px] text-nb-muted leading-tight">
                            Across {summary?.totalWebsites ?? 0} bookmarks
                          </p>
                        </div>

                        <div className="rounded-xl border border-nb-border/30 bg-nb-surface-alt p-2.5 space-y-0.5">
                          <span className="text-[10px] font-black uppercase text-nb-muted flex items-center gap-1">
                            <Flame className="size-3 text-emerald-500" /> Consistency
                          </span>
                          <p className="text-xs font-black text-nb-fg">
                            {streak?.totalActiveDays ?? 0} active days
                          </p>
                          <p className="text-[10px] text-nb-muted leading-tight">
                            Ongoing streak of {streak?.currentStreak ?? 0}d
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] text-nb-muted">
                          Want deeper insights into specific categories?
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentSlide(1)}
                          className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Explore Traffic Trends</span>
                          <ArrowRight className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------------- */}
              {/* SLIDE 1: TRAFFIC & VISITS TRENDS                                    */}
              {/* ------------------------------------------------------------------- */}
              {currentSlide === 1 && (
                <div className="w-full h-full flex flex-col justify-between gap-2.5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5">
                    {/* Left 7 Columns: Visits Over Time Interactive Chart */}
                    <div className="lg:col-span-7 rounded-2xl border-2 border-nb-border bg-nb-card p-3.5 shadow-nb-xs flex flex-col justify-between overflow-hidden">
                      <div className="flex items-center justify-between border-b border-nb-border/30 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-black">
                            <TrendingUp className="size-4" />
                          </span>
                          <div>
                            <h2 className="text-xs sm:text-sm font-black text-nb-fg">
                              Visits Over Time ({range.toUpperCase()})
                            </h2>
                            <p className="text-[10px] text-nb-muted">
                              Interactive velocity trend &amp; daily frequency
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-h-[220px] flex flex-col justify-center py-1">
                        <VisitsLineChart data={visits} />
                      </div>
                    </div>

                    {/* Right 5 Columns: Most Visited Websites Leaderboard */}
                    <div className="lg:col-span-5 rounded-2xl border-2 border-nb-border bg-nb-card p-3.5 shadow-nb-xs flex flex-col justify-between overflow-hidden">
                      <div className="flex items-center justify-between border-b border-nb-border/30 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500 text-black font-black">
                            <Trophy className="size-4" />
                          </span>
                          <div>
                            <h2 className="text-xs sm:text-sm font-black text-nb-fg">
                              Top Visited Websites
                            </h2>
                            <p className="text-[10px] text-nb-muted">
                              Ranked by total engagement &amp; launch clicks
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-h-[220px] flex flex-col justify-center py-1 overflow-hidden">
                        <TopWebsitesBarChart data={top} />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Traffic Velocity Banner */}
                  <div className="shrink-0 rounded-2xl border-2 border-nb-border bg-nb-surface p-2.5 shadow-nb-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-nb-fg flex items-center gap-1.5">
                        <Zap className="size-3.5 text-amber-500" />
                        <span>Traffic Pulse:</span>
                      </span>
                      <span className="text-nb-muted">
                        Recorded <strong>{summary?.visitsToday ?? 0} visits</strong> today across your workspace.
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentSlide(2)}
                        className="rounded-xl border-2 border-nb-border bg-indigo-600 px-3 py-1 text-xs font-black text-white shadow-nb-xs hover:translate-x-0.5 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>Next: Folder Structure</span>
                        <ArrowRight className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------------- */}
              {/* SLIDE 2: STRUCTURE & FOLDERS                                        */}
              {/* ------------------------------------------------------------------- */}
              {currentSlide === 2 && (
                <div className="w-full h-full flex flex-col justify-between gap-2.5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5">
                    {/* Left 6 Columns: Folder Distribution Donut Chart */}
                    <div className="lg:col-span-6 rounded-2xl border-2 border-nb-border bg-nb-card p-3.5 shadow-nb-xs flex flex-col justify-between overflow-hidden">
                      <div className="flex items-center justify-between border-b border-nb-border/30 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-black">
                            <FolderOpen className="size-4" />
                          </span>
                          <div>
                            <h2 className="text-xs sm:text-sm font-black text-nb-fg">
                              Category Distribution
                            </h2>
                            <p className="text-[10px] text-nb-muted">
                              Interactive breakdown across your folders
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-h-[220px] flex flex-col justify-center py-1">
                        <FolderDistributionPieChart data={folders} />
                      </div>
                    </div>

                    {/* Right 6 Columns: Interactive Folder Breakdown Cards Grid */}
                    <div className="lg:col-span-6 rounded-2xl border-2 border-nb-border bg-nb-card p-3.5 shadow-nb-xs flex flex-col justify-between overflow-hidden">
                      <div className="flex items-center justify-between border-b border-nb-border/30 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-black">
                            <Folder className="size-4" />
                          </span>
                          <div>
                            <h2 className="text-xs sm:text-sm font-black text-nb-fg">
                              Folder Architecture Details
                            </h2>
                            <p className="text-[10px] text-nb-muted">
                              {folders.length} configured organization hubs
                            </p>
                          </div>
                        </div>
                        <Link
                          href="/dashboard"
                          className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Manage Folders</span>
                          <ExternalLink className="size-3" />
                        </Link>
                      </div>

                      {/* Folder Cards List */}
                      <div className="flex-1 min-h-[200px] overflow-y-auto pr-1 space-y-2 py-2 scrollbar-thin">
                        {folders.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs text-nb-muted font-bold">
                            No folders created yet. Organize your websites to unlock architecture analytics!
                          </div>
                        ) : (
                          folders.map((f) => {
                            const totalSites = summary?.totalWebsites || 1;
                            const share = Math.round((f.value / totalSites) * 100);
                            return (
                              <div
                                key={f.name}
                                className="flex items-center justify-between p-2.5 rounded-xl border border-nb-border/40 bg-nb-surface hover:bg-nb-surface-alt transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span
                                    className="size-3 rounded-full shrink-0"
                                    style={{ backgroundColor: f.color || "#6366f1" }}
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-black text-nb-fg truncate">{f.name}</p>
                                    <p className="text-[10px] text-nb-muted">
                                      {f.value} bookmark{f.value !== 1 ? "s" : ""} • {share}% workspace share
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="w-16 h-1.5 rounded-full bg-nb-surface-alt overflow-hidden border border-nb-border/20">
                                    <div
                                      className="h-full rounded-full"
                                      style={{ width: `${share}%`, backgroundColor: f.color || "#6366f1" }}
                                    />
                                  </div>
                                  <span className="font-mono text-xs font-black text-nb-fg w-8 text-right">
                                    {share}%
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Organization Health Bar */}
                  <div className="shrink-0 rounded-2xl border-2 border-nb-border bg-nb-surface p-2.5 shadow-nb-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-nb-fg flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        <span>Architecture Health:</span>
                      </span>
                      <span className="text-nb-muted">
                        {summary?.totalWebsites ?? 0} saved websites organized across {summary?.totalFolders ?? 0} structured folders.
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentSlide(3)}
                        className="rounded-xl border-2 border-nb-border bg-indigo-600 px-3 py-1 text-xs font-black text-white shadow-nb-xs hover:translate-x-0.5 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>Next: Annual Heatmap</span>
                        <ArrowRight className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------------- */}
              {/* SLIDE 3: ANNUAL HABITS & HEATMAP                                    */}
              {/* ------------------------------------------------------------------- */}
              {currentSlide === 3 && (
                <div className="w-full h-full flex flex-col justify-between gap-2.5 animate-in fade-in zoom-in-95 duration-200">
                  {/* Top: 53-Week Annual Activity Heatmap */}
                  <div className="flex-1 min-h-0 rounded-2xl border-2 border-nb-border bg-nb-card p-3.5 shadow-nb-xs flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between border-b border-nb-border/30 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500 text-white font-black">
                          <Flame className="size-4" />
                        </span>
                        <div>
                          <h2 className="text-xs sm:text-sm font-black text-nb-fg">
                            Annual Activity Contribution Heatmap
                          </h2>
                          <p className="text-[10px] text-nb-muted">
                            365-day browsing momentum across 53 weeks
                          </p>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-nb-muted">
                        <span>Total active days: <strong>{streak?.totalActiveDays ?? 0}</strong></span>
                        <span>•</span>
                        <span>Longest streak: <strong>{streak?.longestStreak ?? 0}d</strong></span>
                      </div>
                    </div>

                    <div className="flex-1 min-h-[160px] flex flex-col justify-center py-1 overflow-x-auto">
                      <ActivityHeatmap data={heatmap} />
                    </div>
                  </div>

                  {/* Bottom: Research Rhythm & Peak Productivity Bento */}
                  <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div className="rounded-2xl border-2 border-nb-border bg-nb-surface p-3 shadow-nb-xs flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-500 border border-indigo-500/30 shrink-0">
                        <Clock className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-nb-muted block">
                          Peak Research Hour
                        </span>
                        <p className="text-sm font-black text-nb-fg truncate">
                          {peakStats?.mostActiveHour || "14:00"}
                        </p>
                        <p className="text-[10px] text-nb-muted">
                          Highest visit volume time window
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border-2 border-nb-border bg-nb-surface p-3 shadow-nb-xs flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-600 border border-purple-500/30 shrink-0">
                        <Calendar className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-nb-muted block">
                          Primary Research Day
                        </span>
                        <p className="text-sm font-black text-nb-fg truncate">
                          {peakStats?.mostActiveWeekday || "Wednesday"}
                        </p>
                        <p className="text-[10px] text-nb-muted">
                          Most frequent workspace research day
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border-2 border-nb-border bg-nb-surface p-3 shadow-nb-xs flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-nb-muted block">
                          Habit Completion
                        </span>
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {streak?.currentStreak ?? 0} Days Active Streak
                        </p>
                        <p className="text-[10px] text-nb-muted truncate">
                          Keep visiting daily to expand your record!
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentSlide(0)}
                        className="rounded-xl border-2 border-nb-border bg-indigo-600 px-3 py-1.5 text-xs font-black text-white shadow-nb-xs hover:translate-x-0.5 transition-all cursor-pointer shrink-0"
                      >
                        Back to Overview
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* BOTTOM SLIDER INDICATOR BAR (Zero scroll, full visibility)                */}
        {/* ========================================================================= */}
        <footer className="shrink-0 pt-2 border-t border-nb-border/40 flex items-center justify-between gap-3 text-xs">
          {/* Slide Dots with Click */}
          <div className="flex items-center gap-1.5">
            {SLIDES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSlide(s.id)}
                className={`transition-all cursor-pointer rounded-full ${
                  currentSlide === s.id
                    ? "w-8 h-2.5 bg-indigo-600"
                    : "w-2.5 h-2.5 bg-nb-border/40 hover:bg-nb-border"
                }`}
                title={`Jump to ${s.label}`}
              />
            ))}
            <span className="ml-2 text-[11px] font-mono font-bold text-nb-muted hidden sm:inline">
              {SLIDES[currentSlide].label}
            </span>
          </div>

          {/* Keyboard & Swipe Hint */}
          <div className="flex items-center gap-3 text-[11px] text-nb-muted font-mono">
            <span className="hidden md:inline">
              Use <kbd className="rounded bg-nb-surface-alt px-1.5 py-0.5 border border-nb-border/40 font-black">←</kbd> / <kbd className="rounded bg-nb-surface-alt px-1.5 py-0.5 border border-nb-border/40 font-black">→</kbd> to slide
            </span>
            <span>•</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              Fit Viewport Active
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
