"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function TopWebsitesBarChart({ data }: { data: { name: string; visits: number }[] }) {
  return (
    <div className="w-full min-w-0 max-w-full h-[240px] sm:h-[260px] overflow-hidden mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -15, right: 8, top: 10, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fontFamily: "Space Grotesk", fontWeight: 600, fill: "var(--nb-muted)" }}
            tickLine={false}
            axisLine={false}
            stroke="var(--nb-border)"
            tickFormatter={(value: string) => {
              if (!value) return "";
              return value.length > 8 ? `${value.slice(0, 8)}…` : value;
            }}
            minTickGap={10}
          />
          <YAxis
            tick={{ fontSize: 10, fontFamily: "Space Grotesk", fontWeight: 600, fill: "var(--nb-muted)" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            stroke="var(--nb-border)"
            width={28}
          />
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
          <Bar dataKey="visits" fill="var(--nb-primary)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
