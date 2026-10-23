"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, LineChart, TrendingUp, Zap } from "lucide-react";

interface VisitsLineChartProps {
  data: { date: string; visits: number }[];
  height?: number;
}

export default function VisitsLineChart({ data, height = 240 }: VisitsLineChartProps) {
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return { total: 0, average: 0, peak: { date: "", visits: 0 } };
    }
    let total = 0;
    let peak = { date: "", visits: -1 };

    for (const item of data) {
      total += item.visits;
      if (item.visits > peak.visits) {
        peak = { date: item.date, visits: item.visits };
      }
    }
    const average = Number((total / data.length).toFixed(1));
    return { total, average, peak };
  }, [data]);

  return (
    <div className="w-full space-y-3">
      {/* Interactive Controls & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-nb-border/30 pb-2.5">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[var(--nb-primary)]" />
            <span className="font-bold text-nb-muted">Total:</span>
            <span className="font-black text-nb-fg">{stats.total} visits</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" />
            <span className="font-bold text-nb-muted">Avg:</span>
            <span className="font-black text-nb-fg">{stats.average}/day</span>
          </div>
          {stats.peak.visits > 0 ? (
            <div className="hidden md:flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <Zap className="size-3" />
              <span>Peak: {stats.peak.visits} on {stats.peak.date.slice(5)}</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1 text-[11px] font-medium text-nb-muted">
              <span>Ready to record traffic</span>
            </div>
          )}
        </div>

        {/* Toggle Area vs Bar */}
        <div className="flex items-center gap-1 rounded-lg border-2 border-nb-border bg-nb-surface p-0.5 shadow-nb-xs">
          <button
            type="button"
            onClick={() => setChartType("area")}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold transition-all cursor-pointer ${
              chartType === "area"
                ? "bg-[var(--nb-primary)] text-white font-black"
                : "text-nb-muted hover:text-nb-fg"
            }`}
            title="Area trend view"
          >
            <LineChart className="size-3" />
            <span className="hidden sm:inline">Trend</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType("bar")}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold transition-all cursor-pointer ${
              chartType === "bar"
                ? "bg-[var(--nb-primary)] text-white font-black"
                : "text-nb-muted hover:text-nb-fg"
            }`}
            title="Daily bars view"
          >
            <BarChart3 className="size-3" />
            <span className="hidden sm:inline">Bars</span>
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div
        className="w-full min-w-0 max-w-full overflow-hidden relative"
        style={{ height: `${height}px`, minHeight: `${height}px` }}
      >
        {!isMounted ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
        <ResponsiveContainer width="100%" height={height}>
          {chartType === "area" ? (
            <AreaChart data={data} margin={{ left: -15, right: 10, top: 12, bottom: 0 }}>
              <defs>
                <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--nb-primary)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--nb-primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--nb-border)" strokeOpacity={0.15} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fontFamily: "Space Grotesk", fontWeight: 600, fill: "var(--nb-muted)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--nb-border)", strokeWidth: 1.5 }}
                tickFormatter={(value: string) => {
                  if (!value) return "";
                  const parts = value.split("-");
                  if (parts.length === 3) {
                    return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
                  }
                  return value;
                }}
                minTickGap={18}
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
                  const count = Number(payload[0].value);
                  const diffFromAvg = stats.average > 0 ? count - stats.average : 0;
                  return (
                    <div
                      className="rounded-xl border-3 border-nb-border p-3 shadow-nb-md space-y-1 font-sans text-xs"
                      style={{ background: "var(--nb-card)", color: "var(--nb-fg)" }}
                    >
                      <p className="font-extrabold text-nb-muted uppercase tracking-wider text-[10px]">
                        {label}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-[var(--nb-primary)]" />
                        <span className="text-base font-black">{count} visits</span>
                      </div>
                      {stats.average > 0 && (
                        <p className={`text-[10px] font-bold ${diffFromAvg >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                          {diffFromAvg >= 0 ? `+${diffFromAvg.toFixed(1)} above daily avg` : `${diffFromAvg.toFixed(1)} below daily avg`}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              {stats.average > 0 && (
                <ReferenceLine
                  y={stats.average}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
              )}
              <Area
                type="monotone"
                dataKey="visits"
                stroke="var(--nb-primary)"
                fill="url(#visitsGradient)"
                strokeWidth={3}
                dot={{ r: 2, fill: "var(--nb-primary)", stroke: "var(--nb-surface)", strokeWidth: 1.5 }}
                activeDot={{ r: 5, fill: "var(--nb-primary)", stroke: "var(--nb-surface)", strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ left: -15, right: 10, top: 12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--nb-border)" strokeOpacity={0.15} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fontFamily: "Space Grotesk", fontWeight: 600, fill: "var(--nb-muted)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--nb-border)", strokeWidth: 1.5 }}
                tickFormatter={(value: string) => {
                  if (!value) return "";
                  const parts = value.split("-");
                  if (parts.length === 3) {
                    return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
                  }
                  return value;
                }}
                minTickGap={14}
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
                  const count = Number(payload[0].value);
                  return (
                    <div
                      className="rounded-xl border-3 border-nb-border p-3 shadow-nb-md space-y-1 font-sans text-xs"
                      style={{ background: "var(--nb-card)", color: "var(--nb-fg)" }}
                    >
                      <p className="font-extrabold text-nb-muted uppercase tracking-wider text-[10px]">
                        {label}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-[var(--nb-primary)]" />
                        <span className="text-base font-black">{count} visits</span>
                      </div>
                    </div>
                  );
                }}
              />
              {stats.average > 0 && (
                <ReferenceLine
                  y={stats.average}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
              )}
              <Bar
                dataKey="visits"
                fill="var(--nb-primary)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
