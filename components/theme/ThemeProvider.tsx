"use client";

import { useEffect } from "react";
import { THEME_CHANGE_EVENT, THEME_STORAGE_KEY, resolveThemePreference, type ThemePreference } from "@/lib/theme";

function resolveStoredPreference(): ThemePreference {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

export default function ThemeProvider() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const syncTheme = () => {
      const preference = resolveStoredPreference();
      const resolved = resolveThemePreference(preference, media.matches);
      const root = document.documentElement;

      root.classList.toggle("dark", resolved === "dark");
      root.dataset.theme = resolved;
      root.style.colorScheme = resolved;
    };

    syncTheme();

    const handleStorage = () => syncTheme();
    const handleThemeChange = () => syncTheme();

    media.addEventListener("change", syncTheme);
    window.addEventListener("storage", handleStorage);
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);

    return () => {
      media.removeEventListener("change", syncTheme);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    };
  }, []);

  return null;
}
