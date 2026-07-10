"use client";

export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "wesite-theme-preference";
export const THEME_CHANGE_EVENT = "wesite-theme-change";

export function resolveThemePreference(preference: ThemePreference, systemDark: boolean) {
  return preference === "system" ? (systemDark ? "dark" : "light") : preference;
}

export function applyThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") {
    return;
  }

  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = resolveThemePreference(preference, systemDark);
  const root = document.documentElement;

  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function readThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}
