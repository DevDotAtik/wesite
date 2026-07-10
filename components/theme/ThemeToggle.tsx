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
      className="grid size-8 place-items-center rounded-md border border-zinc-300 bg-white text-zinc-700 shadow-sm hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
    >
      <Icon className="size-4" />
    </button>
  );
}
