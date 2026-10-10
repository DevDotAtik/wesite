"use client";

import { useSyncExternalStore } from "react";

export const PREFERENCES_STORAGE_KEY = "wesite-preferences";
export const PREFERENCES_CHANGE_EVENT = "wesite-preferences-change";

export type DisplayPreferences = {
  reduceMotion: boolean;
  smoothScroll: boolean;
};

export type NotificationPreferences = {
  emailDigest: boolean;
  monitorAlerts: boolean;
  webflowRuns: boolean;
  productNews: boolean;
};

export type Preferences = DisplayPreferences & NotificationPreferences;

export const DEFAULT_PREFERENCES: Preferences = {
  reduceMotion: false,
  smoothScroll: true,
  emailDigest: false,
  monitorAlerts: true,
  webflowRuns: true,
  productNews: false,
};

let cachedRaw: string | null | undefined;
let cachedSnapshot: Preferences = DEFAULT_PREFERENCES;

export function readPreferences(): Preferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
  } catch {
    return DEFAULT_PREFERENCES;
  }

  if (raw === cachedRaw) {
    return cachedSnapshot;
  }

  cachedRaw = raw;

  if (!raw) {
    cachedSnapshot = DEFAULT_PREFERENCES;
    return cachedSnapshot;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    cachedSnapshot = { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    cachedSnapshot = DEFAULT_PREFERENCES;
  }

  return cachedSnapshot;
}

export function applyDisplayPreferences(preferences: Preferences) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("nb-reduce-motion", preferences.reduceMotion);
  root.classList.toggle("nb-no-smooth-scroll", !preferences.smoothScroll);
}

export function setPreferences(next: Preferences) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next));
  applyDisplayPreferences(next);
  window.dispatchEvent(new Event(PREFERENCES_CHANGE_EVENT));
}

export function subscribePreferences(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", callback);
  window.addEventListener(PREFERENCES_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PREFERENCES_CHANGE_EVENT, callback);
  };
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribePreferences, readPreferences, readPreferences);
}
