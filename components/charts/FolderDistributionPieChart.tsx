"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Folder, PieChart as PieChartIcon, BarChart2 } from "lucide-react";

export type FolderDistributionItem = {
  id?: string;
  name: string;
  value: number;
  color?: string;
};

interface FolderDistributionPieChartProps {
  data: FolderDistributionItem[];
}

const fallbackColors = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#14b8a6",
  "#f97316",
];

export default function FolderDistributionPieChart({ data }: FolderDistributionPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [viewType, setViewType] = useState<"donut" | "bars">("donut");

  const total = useMemo(() => {
    return (data || []).reduce((acc, curr) => acc + curr.value, 0);
  }, [data]);

  const activeItem = useMemo(() => {
    if (activeIndex !== null && data && data[activeIndex]) {
      return data[activeIndex];
    }
    return null;
  }, [activeIndex, data]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[240px] flex items-center justify-center text-xs font-bold text-nb-muted">
        No folder distribution data yet. Create folders to organize your bookmarks!
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-nb-border/30 pb-2.5">
        <div className="flex items-center gap-2">
          <Folder className="size-3.5 text-indigo-500" />
          <span className="text-xs font-bold text-nb-muted">
            {data.length} categories • {total} bookmarks
          </span>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 rounded-lg border-2 border-nb-border bg-nb-surface p-0.5 shadow-nb-xs">
          <button
            type="button"
            onClick={() => setViewType("donut")}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold transition-all ${
              viewType === "donut"
                ? "bg-[var(--nb-primary)] text-white font-black"
                : "text-nb-muted hover:text-nb-fg"
            }`}
          >
            <PieChartIcon className="size-3" />
            <span className="hidden sm:inline">Donut</span>
          </button>
          <button
            type="button"
            onClick={() => setViewType("bars")}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold transition-all ${
              viewType === "bars"
                ? "bg-[var(--nb-primary)] text-white font-black"
                : "text-nb-muted hover:text-nb-fg"
            }`}
          >
            <BarChart2 className="size-3" />
            <span className="hidden sm:inline">Breakdown</span>
          </button>
        </div>
      </div>

      {viewType === "donut" ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Donut Chart with Dynamic Center Content */}
          <div className="relative w-full sm:w-1/2 h-[220px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={3}
                  stroke="var(--nb-border)"
                  strokeWidth={2}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}-${index}`}
                      fill={entry.color || fallbackColors[index % fallbackColors.length]}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                      className="cursor-pointer transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as FolderDistributionItem;
                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    return (
                      <div
                        className="rounded-xl border-3 border-nb-border p-2.5 shadow-nb-md space-y-0.5 font-sans text-xs"
                        style={{ background: "var(--nb-card)", color: "var(--nb-fg)" }}
                      >
                        <p className="font-black text-nb-fg">{item.name}</p>
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: item.color || "#6366f1" }}
                          />
                          <span className="font-bold text-sm">
                            {item.value} sites ({pct}%)
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Dynamic KPI */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-xl sm:text-2xl font-black text-nb-fg">
                {activeItem ? activeItem.value : total}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-nb-muted max-w-[90px] truncate">
                {activeItem ? activeItem.name : "Total Sites"}
              </span>
            </div>
          </div>

          {/* Legend Pills List */}
          <div className="w-full sm:w-1/2 space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {data.map((item, index) => {
              const color = item.color || fallbackColors[index % fallbackColors.length];
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              const isHovered = activeIndex === index;

              return (
                <div
                  key={item.name + index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`flex items-center justify-between rounded-lg border-2 p-1.5 text-xs transition-all cursor-pointer ${
                    isHovered
                      ? "border-nb-border bg-nb-surface-alt shadow-nb-xs scale-[1.02]"
                      : "border-nb-border/30 bg-nb-surface hover:border-nb-border"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-black truncate text-nb-fg">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                    <span className="font-bold text-nb-fg">{item.value}</span>
                    <span className="text-nb-muted text-[10px]">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Breakdown Bars View */
        <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1 scrollbar-thin">
          {data.map((item, index) => {
            const color = item.color || fallbackColors[index % fallbackColors.length];
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;

            return (
              <div key={item.name + index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-black text-nb-fg">{item.name}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-nb-muted">
                    {item.value} bookmarks ({pct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-nb-surface-alt overflow-hidden border border-nb-border/20">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
