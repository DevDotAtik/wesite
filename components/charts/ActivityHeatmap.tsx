"use client";

export default function ActivityHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const map = new Map(data.map((item) => [item.date, item.count]));
  const today = new Date();
  const days = Array.from({ length: 365 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (364 - index));
    const key = date.toISOString().slice(0, 10);
    const count = map.get(key) ?? 0;
    return { key, count };
  });

  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-2">
      {days.map((day) => (
        <span
          key={day.key}
          title={`${day.key}: ${day.count} visits`}
          className="size-3 rounded-sm"
          style={{
            background:
              day.count === 0
                ? "rgb(228 228 231)"
                : day.count < 3
                  ? "#bfdbfe"
                  : day.count < 7
                    ? "#60a5fa"
                    : "#2563eb",
          }}
        />
      ))}
    </div>
  );
}
