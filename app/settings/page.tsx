"use client";

import { useEffect, useState } from "react";
import { BellRing, Database, Info, Loader2, Lock, LogOut, Palette, Sparkles, User } from "lucide-react";
import Navbar from "@/components/navbar";
import { setThemePreference, type ThemePreference } from "@/lib/theme";
import ProfileSection from "@/components/settings/ProfileSection";
import AppearanceSection from "@/components/settings/AppearanceSection";
import PreferencesSection from "@/components/settings/PreferencesSection";
import SecuritySection from "@/components/settings/SecuritySection";
import DataSection from "@/components/settings/DataSection";
import AboutSection from "@/components/settings/AboutSection";
import { getInitials, type PatchResult, type SectionId, type SettingsUser, type TrashItem } from "@/components/settings/types";

const sections: Array<{ id: SectionId; label: string; icon: typeof User; description: string }> = [
  { id: "profile", label: "Profile", icon: User, description: "Photo, name and email" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme and motion" },
  { id: "preferences", label: "Notifications", icon: BellRing, description: "Alerts you care about" },
  { id: "security", label: "Security", icon: Lock, description: "2FA and password" },
  { id: "data", label: "Data & privacy", icon: Database, description: "Export, trash and account" },
  { id: "about", label: "About", icon: Info, description: "Version, shortcuts and legal" },
];

function SidebarAvatar({ user }: { user: SettingsUser }) {
  const displaySrc = user.avatarUrl || user.googleAvatarUrl || "";
  return (
    <span
      className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border-3 font-extrabold"
      style={{
        borderColor: "var(--nb-border)",
        background: "var(--nb-accent)",
        color: "var(--nb-accent-fg)",
        boxShadow: "var(--nb-shadow-sm)",
      }}
    >
      {displaySrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={displaySrc} alt="" className="size-full object-cover" />
      ) : (
        getInitials(user.name)
      )}
    </span>
  );
}

export default function SettingsPage() {
  const [user, setUser] = useState<SettingsUser | null>(null);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [activeSection, setActiveSection] = useState<SectionId>("profile");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [me, trashed] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/websites?trashed=true"),
    ]);

    if (me.ok) {
      const payload = await me.json();
      setUser(payload.user);
    }
    if (trashed.ok) setTrash((await trashed.json()).websites ?? []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function patchProfile(payload: Record<string, unknown>): Promise<PatchResult> {
    setSaving(true);
    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        return { ok: false, error: data?.error ?? "Could not save changes" };
      }
      if (typeof payload.themePreference === "string") {
        setThemePreference(payload.themePreference as ThemePreference);
      }
      await load();
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error saving changes" };
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const activeMeta = sections.find((section) => section.id === activeSection) ?? sections[0];

  return (
    <div className="min-h-screen" style={{ background: "var(--nb-bg)" }}>
      <Navbar userName={user?.name} />
      <main className="w-full px-4 py-5 sm:px-6 sm:py-8 lg:px-8 nb-page-enter">
        <div className="nb-card-static">
          <div className="nb-section-header">
            <span className="nb-section-icon" style={{ background: "var(--nb-accent)", color: "var(--nb-accent-fg)" }}>
              <Sparkles className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>Settings</h1>
              <p className="mt-1 text-sm" style={{ color: "var(--nb-muted)" }}>Tune your profile, appearance, security and data controls.</p>
            </div>
            <div className="ml-auto hidden flex-wrap gap-2 md:flex">
              <span className="nb-tag nb-tag-success">Free 2FA</span>
              <span className="nb-tag nb-tag-primary">Theme sync</span>
              <span className="nb-tag nb-tag-accent">Export / import</span>
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-[264px_1fr]">
            {/* Sidebar — desktop */}
            <aside className="hidden border-r-3 lg:flex lg:flex-col" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface-alt)" }}>
              <div className="p-5">
                {user ? (
                  <button
                    type="button"
                    onClick={() => setActiveSection("profile")}
                    className="flex w-full items-center gap-3 rounded-2xl border-3 p-3 text-left transition-all hover:translate-x-0.5"
                    style={{ borderColor: "var(--nb-border)", background: "var(--nb-card)", boxShadow: "var(--nb-shadow-sm)" }}
                  >
                    <SidebarAvatar user={user} />
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-extrabold" style={{ color: "var(--nb-fg)" }}>
                        {user.name}
                      </span>
                      <span className="block truncate text-[11px]" style={{ color: "var(--nb-muted)" }}>
                        {user.email}
                      </span>
                    </div>
                  </button>
                ) : (
                  <div className="nb-shimmer h-16 rounded-2xl border-3" style={{ borderColor: "var(--nb-border)" }} />
                )}
              </div>

              <nav className="flex-1 space-y-1 px-3" aria-label="Settings sections">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const active = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      aria-current={active ? "page" : undefined}
                      className={`nb-sidebar-item ${active ? "nb-sidebar-item-active" : ""}`}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1">{section.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-3">
                <button type="button" onClick={logout} className="nb-sidebar-item text-left">
                  <LogOut className="size-4 shrink-0" />
                  Sign out
                </button>
              </div>
            </aside>

            {/* Tabs — mobile */}
            <div className="scrollbar-none overflow-x-auto border-b-3 lg:hidden" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface-alt)" }}>
              <div className="flex gap-1 p-2" role="tablist" aria-label="Settings sections">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const active = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-xl border-3 px-3 py-2 text-xs font-bold whitespace-nowrap ${
                        active ? "nb-btn-primary" : ""
                      }`}
                      style={{
                        borderColor: "var(--nb-border)",
                        background: active ? "var(--nb-primary)" : "var(--nb-surface)",
                        color: active ? "var(--nb-primary-fg)" : "var(--nb-fg)",
                        boxShadow: active ? "var(--nb-shadow-sm)" : undefined,
                      }}
                    >
                      <Icon className="size-3.5" />
                      {section.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="mb-5 lg:hidden">
                <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "var(--nb-muted)" }}>
                  {activeMeta.label}
                </p>
              </div>

              {!user ? (
                <div className="space-y-5">
                  <div className="nb-shimmer h-64 rounded-2xl border-3" style={{ borderColor: "var(--nb-border)" }} />
                  <div className="nb-shimmer h-64 rounded-2xl border-3" style={{ borderColor: "var(--nb-border)" }} />
                </div>
              ) : (
                <>
                  {activeSection === "profile" ? (
                    <ProfileSection user={user} onPatch={patchProfile} saving={saving} />
                  ) : null}
                  {activeSection === "appearance" ? (
                    <AppearanceSection user={user} onPatch={patchProfile} saving={saving} />
                  ) : null}
                  {activeSection === "preferences" ? <PreferencesSection /> : null}
                  {activeSection === "security" ? <SecuritySection user={user} onPatch={patchProfile} saving={saving} /> : null}
                  {activeSection === "data" ? (
                    <DataSection user={user} trash={trash} onRefresh={load} onLogout={logout} />
                  ) : null}
                  {activeSection === "about" ? <AboutSection /> : null}

                  <div className="mt-6 flex items-center gap-2 text-[11px]" style={{ color: "var(--nb-muted)" }}>
                    <Loader2 className="size-3.5 animate-spin" style={{ opacity: saving ? 1 : 0 }} />
                    {saving ? "Saving…" : "All changes saved"}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}