"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function TopWebsitesBarChart({ data }: { data: { name: string; visits: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "Space Grotesk", fontWeight: 600, fill: "var(--nb-muted)" }} tickLine={false} axisLine={false} stroke="var(--nb-border)" />
        <YAxis tick={{ fontSize: 11, fontFamily: "Space Grotesk", fontWeight: 600, fill: "var(--nb-muted)" }} tickLine={false} axisLine={false} allowDecimals={false} stroke="var(--nb-border)" />
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
  );
}
