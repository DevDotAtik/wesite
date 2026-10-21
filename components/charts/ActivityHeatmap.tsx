"use client";

import { useMemo, useState } from "react";
import { clientTzOffsetMinutes, dateKeyAtOffset } from "@/lib/date-buckets";
import { Calendar, Flame, Sparkles } from "lucide-react";

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ActivityHeatmapProps {
  data: { date: string; count: number }[];
}

export default function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const map = useMemo(() => new Map(data.map((item) => [item.date, item.count])), [data]);
  const today = useMemo(() => new Date(), []);
  const tzOffset = clientTzOffsetMinutes();

  const [selectedDay, setSelectedDay] = useState<{
    key: string;
    count: number;
    date: Date;
  } | null>(null);

  const [filterMode, setFilterMode] = useState<"all" | "active" | "high">("all");

  const days = useMemo(() => {
    return Array.from({ length: 365 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (364 - index));
      const key = dateKeyAtOffset(date.getTime(), tzOffset);
      const count = map.get(key) ?? 0;
      return { key, count, date };
    });
  }, [today, tzOffset, map]);

  // Overall stats
  const stats = useMemo(() => {
    let activeDays = 0;
    let totalVisits = 0;
    let maxDay = { key: "", count: 0 };

    for (const d of days) {
      if (d.count > 0) {
        activeDays++;
        totalVisits += d.count;
        if (d.count > maxDay.count) {
          maxDay = { key: d.key, count: d.count };
        }
      }
    }
    return { activeDays, totalVisits, maxDay };
  }, [days]);

  // Calculate 53 week columns and month label alignments
  const weekColumns = useMemo(() => {
    const numWeeks = Math.ceil(days.length / 7);
    let lastMonth = -1;
    return Array.from({ length: numWeeks }, (_, weekIdx) => {
      const dayIndex = weekIdx * 7;
      const weekDate = days[dayIndex]?.date ?? today;
      const month = weekDate.getMonth();
      const showLabel = month !== lastMonth;
      if (showLabel) {
        lastMonth = month;
      }
      return {
        monthIndex: month,
        showLabel,
      };
    });
  }, [days, today]);

  // Determine cell color
  const getCellColor = (count: number) => {
    if (count === 0) return "var(--nb-surface-alt)";
    if (count < 3) return "#a5b4fc";
    if (count < 7) return "var(--nb-primary)";
    return "#4338ca";
  };

  return (
    <div className="w-full space-y-3">
      {/* Interactive Activity Header & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-nb-border/30 pb-2.5">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-nb-fg">
            <Flame className="size-3.5 text-amber-500" />
            <span>{stats.activeDays} active days</span>
            <span className="text-nb-muted font-normal">({stats.totalVisits} visits logged)</span>
          </div>
        </div>

        {/* Filter intensity */}
        <div className="flex items-center gap-1 rounded-lg border-2 border-nb-border bg-nb-surface p-0.5 shadow-nb-xs">
          {(["all", "active", "high"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterMode(mode)}
              className={`rounded px-2 py-0.5 text-[10px] font-bold capitalize transition-all ${
                filterMode === mode
                  ? "bg-[var(--nb-primary)] text-white font-black"
                  : "text-nb-muted hover:text-nb-fg"
              }`}
            >
              {mode === "all" ? "All Year" : mode === "active" ? "Active Days" : "Peak Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Day Inspector Callout */}
      {selectedDay && (
        <div className="flex items-center justify-between rounded-xl border-2 border-nb-border bg-nb-surface p-2.5 text-xs shadow-nb-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span
              className="size-3 rounded-full border border-black/20"
              style={{ backgroundColor: getCellColor(selectedDay.count) }}
            />
            <span className="font-black text-nb-fg">
              {selectedDay.date.toLocaleDateString(undefined, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {selectedDay.count} visit{selectedDay.count !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDay(null)}
            className="text-[10px] text-nb-muted hover:text-nb-fg underline"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Heatmap Grid Container */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
        <div className="inline-flex flex-col min-w-max">
          {/* Synchronized Month labels */}
          <div className="flex gap-1.5 mb-1.5 items-center">
            {/* Spacer matching day-of-week labels width */}
            <div className="w-6 shrink-0" />
            {/* 53 week columns */}
            <div className="flex gap-1">
              {weekColumns.map((col, idx) => (
                <div
                  key={idx}
                  className="w-3 text-[9px] font-bold shrink-0 relative"
                  style={{ color: "var(--nb-muted)" }}
                >
                  {col.showLabel ? (
                    <span className="absolute left-0 top-0 whitespace-nowrap">
                      {monthLabels[col.monthIndex]}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Grid rows with Day labels */}
          <div className="flex gap-1.5 items-start">
            {/* Day-of-week labels */}
            <div
              className="flex flex-col gap-1 text-[9px] font-bold w-6 shrink-0 pt-0.5"
              style={{ color: "var(--nb-muted)" }}
            >
              {dayLabels.map((label, index) => (
                <span
                  key={label}
                  className="flex h-3 items-center"
                  style={{ visibility: index % 2 === 1 ? "visible" : "hidden" }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Heatmap cells (7 rows x 53 columns) */}
            <div className="grid grid-flow-col grid-rows-7 gap-1">
              {days.map((day) => {
                const isSelected = selectedDay?.key === day.key;
                const isDimmed =
                  (filterMode === "active" && day.count === 0) ||
                  (filterMode === "high" && day.count < 5);

                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    title={`${day.key}: ${day.count} visit${day.count !== 1 ? "s" : ""}`}
                    className={`nb-heatmap-cell shrink-0 transition-transform hover:scale-125 focus:outline-none ${
                      isSelected ? "ring-2 ring-indigo-500 scale-125 z-10" : ""
                    } ${isDimmed ? "opacity-20" : "opacity-100"}`}
                    style={{
                      background: getCellColor(day.count),
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend & mobile scroll guide */}
      <div
        className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold"
        style={{ color: "var(--nb-muted)" }}
      >
        <span className="text-[10px] text-nb-muted font-medium flex items-center gap-1">
          <Calendar className="size-3" />
          <span>Click any block to inspect activity details</span>
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          <span>Less</span>
          {["var(--nb-surface-alt)", "#a5b4fc", "var(--nb-primary)", "#4338ca"].map((color) => (
            <span
              key={color}
              className="inline-block size-2.5 rounded-sm border"
              style={{ background: color, borderColor: "var(--nb-border)" }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
