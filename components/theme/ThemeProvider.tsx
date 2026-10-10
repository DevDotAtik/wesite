"use client";

import { useEffect } from "react";
import { THEME_CHANGE_EVENT, THEME_STORAGE_KEY, resolveThemePreference, type ThemePreference } from "@/lib/theme";
import { PREFERENCES_CHANGE_EVENT, applyDisplayPreferences, readPreferences } from "@/lib/preferences";

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

    const syncPreferences = () => applyDisplayPreferences(readPreferences());

    syncTheme();
    syncPreferences();

    const handleStorage = () => syncTheme();
    const handleThemeChange = () => syncTheme();
    const handlePreferenceChange = () => syncPreferences();

    media.addEventListener("change", syncTheme);
    window.addEventListener("storage", handleStorage);
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener(PREFERENCES_CHANGE_EVENT, handlePreferenceChange);

    return () => {
      media.removeEventListener("change", syncTheme);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener(PREFERENCES_CHANGE_EVENT, handlePreferenceChange);
    };
  }, []);

  return null;
}
