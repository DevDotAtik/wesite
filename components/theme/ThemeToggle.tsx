"use client";

import { useEffect, useState } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { applyThemePreference, readThemePreference, type ThemePreference } from "@/lib/theme";

const themes: ThemePreference[] = ["system", "light", "dark"];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>("system");

  useEffect(() => {
    const sync = () => setTheme(readThemePreference());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("wesite-theme-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("wesite-theme-change", sync);
    };
  }, []);

  function cycleTheme() {
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    applyThemePreference(nextTheme);
    setTheme(nextTheme);
  }

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Laptop;

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      title={`Theme: ${theme}`}
      onClick={cycleTheme}
      className="nb-btn nb-btn-icon nb-btn-surface nb-btn-sm"
    >
      <Icon className="size-4" />
    </button>
  );
}
