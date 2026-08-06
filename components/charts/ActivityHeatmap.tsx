"use client";

import { clientTzOffsetMinutes, dateKeyAtOffset } from "@/lib/date-buckets";

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ActivityHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const map = new Map(data.map((item) => [item.date, item.count]));
  const today = new Date();
  const tzOffset = clientTzOffsetMinutes();
  const days = Array.from({ length: 365 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (364 - index));
    const key = dateKeyAtOffset(date.getTime(), tzOffset);
    const count = map.get(key) ?? 0;
    return { key, count, date };
  });

  // Calculate month label positions
  const weeks: { start: Date; monthIndex: number }[] = [];
  let lastMonth = -1;
  for (let i = 0; i < days.length; i += 7) {
    const weekStart = days[i].date;
    const month = weekStart.getMonth();
    if (month !== lastMonth) {
      weeks.push({ start: weekStart, monthIndex: month });
      lastMonth = month;
    }
  }

  return (
    <div>
      {/* Month labels */}
      <div className="mb-1 grid grid-flow-col text-[9px] font-bold" style={{ color: "var(--nb-muted)" }}>
        {weeks.map((week, index) => (
          <span key={index} className="truncate">
            {monthLabels[week.monthIndex]}
          </span>
        ))}
      </div>

      <div className="flex gap-1">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-1 text-[9px] font-bold" style={{ color: "var(--nb-muted)" }}>
          {dayLabels.map((label, index) => (
            <span key={label} className="flex h-3 items-center" style={{ visibility: index % 2 === 1 ? "visible" : "hidden" }}>
              {label}
            </span>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-2">
          {days.map((day) => (
            <span
              key={day.key}
              title={`${day.key}: ${day.count} visit${day.count !== 1 ? "s" : ""}`}
              className="nb-heatmap-cell"
              style={{
                background:
                  day.count === 0
                    ? "var(--nb-surface-alt)"
                    : day.count < 3
                      ? "var(--nb-bruto-blue)"
                      : day.count < 7
                        ? "var(--nb-primary)"
                        : "var(--nb-secondary)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-2 text-[9px] font-bold" style={{ color: "var(--nb-muted)" }}>
        <span>Less</span>
        {["var(--nb-surface-alt)", "var(--nb-bruto-blue)", "var(--nb-primary)", "var(--nb-secondary)"].map((color) => (
          <span
            key={color}
            className="inline-block h-2.5 w-2.5 rounded-sm border"
            style={{ background: color, borderColor: "var(--nb-border)" }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
