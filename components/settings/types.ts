export type ThemePreference = "light" | "dark" | "system";

export type SettingsUser = {
  name: string;
  email: string;
  avatarUrl?: string;
  googleAvatarUrl?: string;
  authProvider?: "email" | "google";
  hasPassword?: boolean;
  themePreference?: ThemePreference;
  twoFactorEnabled?: boolean;
  createdAt?: string;
};

export type TrashItem = {
  _id: string;
  title: string;
  domain: string;
  url: string;
};

export type SectionId = "profile" | "appearance" | "preferences" | "security" | "data" | "about";

export type PatchResult = { ok: boolean; error?: string };

export type PatchProfile = (payload: Record<string, unknown>, successMessage?: string) => Promise<PatchResult>;

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}