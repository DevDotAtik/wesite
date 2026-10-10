"use client";

import { useMemo } from "react";
import { clientTzOffsetMinutes, dateKeyAtOffset } from "@/lib/date-buckets";

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ActivityHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const map = useMemo(() => new Map(data.map((item) => [item.date, item.count])), [data]);
  const today = useMemo(() => new Date(), []);
  const tzOffset = clientTzOffsetMinutes();

  const days = useMemo(() => {
    return Array.from({ length: 365 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (364 - index));
      const key = dateKeyAtOffset(date.getTime(), tzOffset);
      const count = map.get(key) ?? 0;
      return { key, count, date };
    });
  }, [today, tzOffset, map]);

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

  return (
    <div className="w-full min-w-0 max-w-full">
      {/* Horizontally scrollable heatmap container on mobile */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
        <div className="inline-flex flex-col min-w-max">
          {/* Synchronized Month labels */}
          <div className="flex gap-1.5 mb-1.5 items-center">
            {/* Spacer matching day-of-week labels width */}
            <div className="w-6 shrink-0" />
            {/* 53 week columns */}
            <div className="flex gap-1">
              {weekColumns.map((col, idx) => (
                <div key={idx} className="w-3 text-[9px] font-bold shrink-0 relative" style={{ color: "var(--nb-muted)" }}>
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
            <div className="flex flex-col gap-1 text-[9px] font-bold w-6 shrink-0 pt-0.5" style={{ color: "var(--nb-muted)" }}>
              {dayLabels.map((label, index) => (
                <span key={label} className="flex h-3 items-center" style={{ visibility: index % 2 === 1 ? "visible" : "hidden" }}>
                  {label}
                </span>
              ))}
            </div>

            {/* Heatmap cells (7 rows x 53 columns) */}
            <div className="grid grid-flow-col grid-rows-7 gap-1">
              {days.map((day) => (
                <span
                  key={day.key}
                  title={`${day.key}: ${day.count} visit${day.count !== 1 ? "s" : ""}`}
                  className="nb-heatmap-cell shrink-0"
                  style={{
                    background:
                      day.count === 0
                        ? "var(--nb-surface-alt)"
                        : day.count < 3
                          ? "#a5b4fc"
                          : day.count < 7
                            ? "var(--nb-primary)"
                            : "#4338ca",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend & mobile scroll guide */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[9px] font-bold" style={{ color: "var(--nb-muted)" }}>
        <span className="sm:hidden text-[9px] text-[var(--nb-muted)] font-medium">
          ← Scroll horizontally for full year →
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          <span>Less</span>
          {["var(--nb-surface-alt)", "#a5b4fc", "var(--nb-primary)", "#4338ca"].map((color) => (
            <span
              key={color}
              className="inline-block h-2.5 w-2.5 rounded-sm border"
              style={{ background: color, borderColor: "var(--nb-border)" }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
