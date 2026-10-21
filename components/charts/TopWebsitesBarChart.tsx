"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ExternalLink, Globe, LayoutList, BarChart3, Trophy } from "lucide-react";

export type TopWebsiteItem = {
  name: string;
  visits: number;
  url?: string;
  domain?: string;
  faviconUrl?: string;
  folderId?: { name: string; color: string } | null;
};

interface TopWebsitesBarChartProps {
  data: TopWebsiteItem[];
}

export default function TopWebsitesBarChart({ data }: TopWebsitesBarChartProps) {
  const [viewMode, setViewMode] = useState<"leaderboard" | "chart">("leaderboard");
  const [limit, setLimit] = useState<5 | 10>(5);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const displayData = useMemo(() => {
    return (data || []).slice(0, limit);
  }, [data, limit]);

  const maxVisits = useMemo(() => {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map((d) => d.visits), 1);
  }, [data]);

  const totalVisits = useMemo(() => {
    return (data || []).reduce((acc, curr) => acc + curr.visits, 0);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[240px] flex items-center justify-center text-xs font-bold text-nb-muted">
        No website visit data recorded yet. Browse your saved websites to see activity here!
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-nb-border/30 pb-2.5">
        <div className="flex items-center gap-2">
          <Trophy className="size-3.5 text-amber-500" />
          <span className="text-xs font-bold text-nb-muted">
            Leaderboard ({totalVisits} total visits)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Limit toggle (5 vs 10) */}
          <div className="flex items-center gap-1 rounded-lg border-2 border-nb-border bg-nb-surface p-0.5 shadow-nb-xs">
            {([5, 10] as const).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setLimit(num)}
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition-all ${
                  limit === num
                    ? "bg-[var(--nb-primary)] text-white font-black"
                    : "text-nb-muted hover:text-nb-fg"
                }`}
              >
                Top {num}
              </button>
            ))}
          </div>

          {/* View Mode (Leaderboard list vs Bar chart) */}
          <div className="flex items-center gap-1 rounded-lg border-2 border-nb-border bg-nb-surface p-0.5 shadow-nb-xs">
            <button
              type="button"
              onClick={() => setViewMode("leaderboard")}
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold transition-all ${
                viewMode === "leaderboard"
                  ? "bg-[var(--nb-primary)] text-white font-black"
                  : "text-nb-muted hover:text-nb-fg"
              }`}
              title="Interactive leaderboard view"
            >
              <LayoutList className="size-3" />
              <span className="hidden sm:inline">Rankings</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("chart")}
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold transition-all ${
                viewMode === "chart"
                  ? "bg-[var(--nb-primary)] text-white font-black"
                  : "text-nb-muted hover:text-nb-fg"
              }`}
              title="Bar chart view"
            >
              <BarChart3 className="size-3" />
              <span className="hidden sm:inline">Bars</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content View */}
      {viewMode === "leaderboard" ? (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
          {displayData.map((item, index) => {
            const percentage = totalVisits > 0 ? Math.round((item.visits / totalVisits) * 100) : 0;
            const rankMedal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;

            return (
              <div
                key={item.name + index}
                className="group flex items-center justify-between gap-3 rounded-xl border-2 border-nb-border bg-nb-surface p-2.5 shadow-nb-xs transition-all hover:-translate-x-0.5"
              >
                {/* Left: Rank, Favicon, Title */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="flex size-6 items-center justify-center font-mono font-black text-xs text-nb-fg shrink-0">
                    {rankMedal}
                  </span>

                  {item.faviconUrl ? (
                    <img
                      src={item.faviconUrl}
                      alt=""
                      className="size-5 rounded-md border border-nb-border/40 object-contain bg-white p-0.5 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex size-5 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-500 border border-nb-border/30 shrink-0">
                      <Globe className="size-3" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-black text-nb-fg">{item.name}</p>
                      {item.folderId?.name && (
                        <span
                          className="hidden sm:inline-flex rounded-md px-1.5 py-0.2 text-[9px] font-bold border truncate"
                          style={{
                            backgroundColor: `${item.folderId.color || "#6366f1"}20`,
                            color: item.folderId.color || "#6366f1",
                            borderColor: `${item.folderId.color || "#6366f1"}50`,
                          }}
                        >
                          {item.folderId.name}
                        </span>
                      )}
                    </div>
                    {/* Share Bar */}
                    <div className="mt-1 h-1.5 w-full max-w-xs rounded-full bg-nb-surface-alt overflow-hidden border border-nb-border/20">
                      <div
                        className="h-full rounded-full bg-[var(--nb-primary)] transition-all duration-300"
                        style={{ width: `${(item.visits / maxVisits) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Visits Count + Link */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="font-mono text-xs font-black text-nb-fg block">
                      {item.visits} <span className="text-[10px] font-normal text-nb-muted">visits</span>
                    </span>
                    <span className="text-[10px] font-mono text-nb-muted block">
                      {percentage}% share
                    </span>
                  </div>

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-nb-border/30 p-1.5 text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt transition-colors"
                      title={`Visit ${item.url}`}
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="w-full min-w-0 max-w-full h-[240px] sm:h-[270px] overflow-hidden">
          {!isMounted ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <BarChart data={displayData} margin={{ left: -15, right: 8, top: 10, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fontFamily: "Space Grotesk", fontWeight: 600, fill: "var(--nb-muted)" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--nb-border)", strokeWidth: 1.5 }}
                  tickFormatter={(value: string) => {
                    if (!value) return "";
                    return value.length > 8 ? `${value.slice(0, 8)}…` : value;
                  }}
                  minTickGap={10}
                />
                <YAxis
                  domain={[0, (dataMax: number) => Math.max(dataMax || 0, 5)]}
                  tick={{ fontSize: 10, fontFamily: "Space Grotesk", fontWeight: 600, fill: "var(--nb-muted)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  stroke="var(--nb-border)"
                  width={28}
                />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as TopWebsiteItem;
                  return (
                    <div
                      className="rounded-xl border-3 border-nb-border p-3 shadow-nb-md space-y-1 font-sans text-xs"
                      style={{ background: "var(--nb-card)", color: "var(--nb-fg)" }}
                    >
                      <p className="font-extrabold text-nb-fg text-xs truncate max-w-xs">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-[var(--nb-primary)]" />
                        <span className="font-black text-sm">{item.visits} visits</span>
                      </div>
                      {item.domain && <p className="text-[10px] font-mono text-nb-muted">{item.domain}</p>}
                    </div>
                  );
                }}
              />
              <Bar dataKey="visits" fill="var(--nb-primary)" radius={[6, 6, 0, 0]}>
                {displayData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? "var(--nb-primary)" : index === 1 ? "var(--nb-secondary)" : "var(--nb-accent)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
