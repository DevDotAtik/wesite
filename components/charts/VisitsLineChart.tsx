"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function VisitsLineChart({ data }: { data: { date: string; visits: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
        <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "Space Grotesk", fontWeight: 600 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fontFamily: "Space Grotesk", fontWeight: 600 }} tickLine={false} axisLine={false} allowDecimals={false} />
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
        <Area type="monotone" dataKey="visits" stroke="var(--nb-primary)" fill="var(--nb-bruto-blue)" strokeWidth={3} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
