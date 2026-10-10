"use client";

import { useState } from "react";
import { Laptop, Moon, Palette, Sun } from "lucide-react";
import { setThemePreference } from "@/lib/theme";
import { readPreferences, setPreferences, usePreferences } from "@/lib/preferences";
import SectionCard from "./SectionCard";
import Switch from "./Switch";
import type { PatchProfile, SettingsUser, ThemePreference } from "./types";

const themeOptions: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
];

type AppearanceSectionProps = {
  user: SettingsUser;
  onPatch: PatchProfile;
  saving: boolean;
};

export default function AppearanceSection({ user, onPatch, saving }: AppearanceSectionProps) {
  const [theme, setTheme] = useState<ThemePreference>(user.themePreference ?? "system");
  const prefs = usePreferences();

  async function changeTheme(next: ThemePreference) {
    setTheme(next);
    setThemePreference(next);
    await onPatch({ themePreference: next });
  }

  function changeReduceMotion(value: boolean) {
    setPreferences({ ...readPreferences(), reduceMotion: value });
  }

  function changeSmoothScroll(value: boolean) {
    setPreferences({ ...readPreferences(), smoothScroll: value });
  }

  return (
    <SectionCard
      icon={Palette}
      title="Appearance"
      description="Look and feel of your workspace. Theme syncs across devices; the rest stays on this browser."
    >
      <div className="space-y-6">
        <div>
          <span className="text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
            Color theme
          </span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const active = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={saving}
                  onClick={() => changeTheme(option.value)}
                  className={`flex items-center justify-center gap-2 rounded-xl border-3 px-3 py-2.5 text-xs font-bold transition-all ${
                    active ? "nb-btn-primary" : ""
                  }`}
                  style={{
                    borderColor: "var(--nb-border)",
                    background: active ? "var(--nb-primary)" : "var(--nb-surface)",
                    color: active ? "var(--nb-primary-fg)" : "var(--nb-fg)",
                    boxShadow: active ? "var(--nb-shadow-sm)" : undefined,
                  }}
                >
                  <Icon className="size-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border-3" style={{ borderColor: "var(--nb-border)" }}>
          <div className="p-4">
            <Switch
              checked={prefs.reduceMotion}
              onChange={changeReduceMotion}
              label="Reduce animations"
              description="Disable entrance effects, hover pops and motion for a calmer experience."
            />
          </div>
          <div className="p-4" style={{ borderTop: "3px solid var(--nb-border)" }}>
            <Switch
              checked={prefs.smoothScroll}
              onChange={changeSmoothScroll}
              label="Smooth scrolling"
              description="Animate in-page scrolling between sections and anchors."
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}