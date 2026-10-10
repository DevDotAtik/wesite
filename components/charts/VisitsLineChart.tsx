"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function VisitsLineChart({ data }: { data: { date: string; visits: number }[] }) {
  return (
    <div className="w-full min-w-0 max-w-full h-[240px] sm:h-[260px] overflow-hidden mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -15, right: 8, top: 10, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fontFamily: "Space Grotesk", fontWeight: 600, fill: "var(--nb-muted)" }}
            tickLine={false}
            axisLine={false}
            stroke="var(--nb-border)"
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
          <Area type="monotone" dataKey="visits" stroke="var(--nb-primary)" fill="var(--nb-primary)" fillOpacity={0.18} strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
