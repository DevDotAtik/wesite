"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const colors = ["#6366f1", "#f59e0b", "#10b981", "#818cf8", "#fbbf24", "#34d399"];

export default function FolderDistributionPieChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full min-w-0 max-w-full h-[240px] sm:h-[260px] flex items-center justify-center text-xs font-bold text-[var(--nb-muted)]">
        No folder distribution data yet
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full h-[240px] sm:h-[260px] overflow-hidden mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={48}
            outerRadius={78}
            dataKey="value"
            nameKey="name"
            paddingAngle={3}
            stroke="var(--nb-border)"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              border: "3px solid var(--nb-border)",
              borderRadius: "12px",
              fontFamily: "Space Grotesk",
              fontWeight: 600,
              boxShadow: "5px 5px 0 0 var(--nb-shadow)",
              background: "var(--nb-card)",
              color: "var(--nb-fg)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
