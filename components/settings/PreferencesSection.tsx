"use client";

import { BellRing } from "lucide-react";
import { readPreferences, setPreferences, usePreferences } from "@/lib/preferences";
import SectionCard from "./SectionCard";
import Switch from "./Switch";

type NotificationKey = "emailDigest" | "monitorAlerts" | "webflowRuns" | "productNews";

export default function PreferencesSection() {
  const prefs = usePreferences();

  function update(key: NotificationKey, value: boolean) {
    setPreferences({ ...readPreferences(), [key]: value });
  }

  const rows: Array<{ key: NotificationKey; label: string; description: string }> = [
    {
      key: "monitorAlerts",
      label: "Downtime alerts",
      description: "Notify when a monitored website goes down or recovers.",
    },
    {
      key: "webflowRuns",
      label: "WebFlow run updates",
      description: "Surface updates for triggered WebFlow automations.",
    },
    {
      key: "productNews",
      label: "Product news & tips",
      description: "Hear about new features and productivity tips.",
    },
    {
      key: "emailDigest",
      label: "Weekly digest",
      description: "A summary of your saved links, todos and activity.",
    },
  ];

  return (
    <SectionCard
      icon={BellRing}
      title="Notifications"
      description="Choose what deserves your attention. Stored locally on this device for now."
    >
      <div className="rounded-xl border-3" style={{ borderColor: "var(--nb-border)" }}>
        {rows.map((row, index) => (
          <div key={row.key} className="p-4" style={index === 0 ? undefined : { borderTop: "3px solid var(--nb-border)" }}>
            <Switch
              checked={prefs[row.key]}
              onChange={(value) => update(row.key, value)}
              label={row.label}
              description={row.description}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}