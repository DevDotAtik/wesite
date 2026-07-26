"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, RotateCcw, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import Navbar from "@/components/navbar";
import { applyThemePreference, type ThemePreference } from "@/lib/theme";

type User = {
  name: string;
  email: string;
  avatarUrl?: string;
  themePreference?: ThemePreference;
  createdAt?: string;
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [trash, setTrash] = useState<Array<{ _id: string; title: string; domain: string; url: string }>>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const [me, trashed] = await Promise.all([fetch("/api/auth/me"), fetch("/api/websites?trashed=true")]);
    if (me.ok) {
      const payload = await me.json();
      setUser(payload.user);
      if (payload.user?.themePreference) applyThemePreference(payload.user.themePreference);
    }
    if (trashed.ok) setTrash((await trashed.json()).websites ?? []);
  }

  useEffect(() => { const timer = window.setTimeout(() => { load(); }, 0); return () => window.clearTimeout(timer); }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const themePreference = form.get("themePreference") as ThemePreference;
    const response = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), email: form.get("email"), avatarUrl: form.get("avatarUrl"), themePreference }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Could not save profile");
      return;
    }
    applyThemePreference(themePreference);
    setStatus("Saved");
    load();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function importBookmarks(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const response = await fetch("/api/websites/import", { method: "POST", body: await file.text() });
    setStatus(response.ok ? "Imported bookmarks" : "Import failed");
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--nb-bg)" }}>
      <Navbar userName={user?.name} />
      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="nb-card-static">
          <div className="nb-section-header">
            <span className="nb-section-icon" style={{ background: "var(--nb-accent)" }}>
              <Sparkles className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>Settings</h1>
              <p className="mt-1 text-sm" style={{ color: "var(--nb-muted)" }}>Tune your space, theme, and privacy controls.</p>
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              <span className="nb-tag nb-tag-primary">Theme sync</span>
              <span className="nb-tag nb-tag-accent">Export / import</span>
              <span className="nb-tag nb-tag-danger">Private trash</span>
            </div>
          </div>

          <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1.08fr_0.92fr]">
            {/* Profile Form */}
            <form onSubmit={saveProfile} className="nb-card-static p-5" style={{ background: "var(--nb-surface)" }}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4" style={{ color: "var(--nb-primary)" }} />
                <h2 className="text-sm font-extrabold" style={{ color: "var(--nb-fg)" }}>Profile & Theme</h2>
              </div>
              <div className="mt-4 grid gap-4">
                <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                  Name
                  <input name="name" defaultValue={user?.name} className="nb-input mt-2" />
                </label>
                <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                  Email
                  <input name="email" defaultValue={user?.email} className="nb-input mt-2" />
                </label>
                <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                  Avatar URL
                  <input name="avatarUrl" defaultValue={user?.avatarUrl} className="nb-input mt-2" />
                </label>
                <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                  Theme
                  <select name="themePreference" defaultValue={user?.themePreference ?? "system"} className="nb-input mt-2">
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>
              </div>

              {error ? <p className="nb-tag nb-tag-danger mt-4 w-full text-center">{error}</p> : null}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button type="submit" className="nb-btn nb-btn-primary nb-btn-sm">Save changes</button>
                <button type="button" onClick={logout} className="nb-btn nb-btn-surface nb-btn-sm">Logout</button>
                {status ? (
                  <span className="nb-tag nb-tag-success">
                    <CheckCircle2 className="size-3.5" />
                    {status}
                  </span>
                ) : null}
              </div>
            </form>

            <section className="space-y-5">
              {/* Data Management */}
              <div className="nb-card-static p-5" style={{ background: "var(--nb-surface)" }}>
                <div className="flex items-center gap-2">
                  <ExternalLink className="size-4" style={{ color: "var(--nb-primary)" }} />
                  <h2 className="text-sm font-extrabold" style={{ color: "var(--nb-fg)" }}>Data Management</h2>
                </div>
                <p className="mt-2 text-sm" style={{ color: "var(--nb-muted)" }}>Move bookmarks in and out of Wesite with clean export/import flows.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => window.location.assign("/api/websites/export")} className="nb-btn nb-btn-surface nb-btn-sm">Export JSON</button>
                  <button type="button" onClick={() => window.location.assign("/api/websites/export?format=html")} className="nb-btn nb-btn-surface nb-btn-sm">Export HTML</button>
                  <label className="nb-btn nb-btn-surface nb-btn-sm cursor-pointer">
                    Import HTML
                    <input type="file" accept=".html,.htm" onChange={importBookmarks} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Trash */}
              <div className="nb-card-static p-5" style={{ background: "var(--nb-surface)" }}>
                <div className="flex items-center gap-2">
                  <Trash2 className="size-4" style={{ color: "var(--nb-danger)" }} />
                  <h2 className="text-sm font-extrabold" style={{ color: "var(--nb-fg)" }}>Trash</h2>
                </div>
                <div className="mt-3 space-y-2">
                  {trash.map((website) => (
                    <div key={website._id} className="nb-card-sm flex items-center justify-between gap-3 p-3">
                      <span className="truncate text-sm font-semibold" style={{ color: "var(--nb-fg)" }}>{website.title || website.domain}</span>
                      <div className="flex items-center gap-2">
                        <a href={website.url} target="_blank" rel="noreferrer" className="nb-btn nb-btn-surface nb-btn-sm">View</a>
                        <button
                          type="button"
                          onClick={async () => {
                            const response = await fetch(`/api/websites/${website._id}/restore`, { method: "POST" });
                            if (!response.ok) {
                              const payload = await response.json().catch(() => null);
                              setError(payload?.error ?? "Could not restore from trash");
                              return;
                            }
                            setStatus("Restored from trash");
                            load();
                          }}
                          className="nb-btn nb-btn-primary nb-btn-sm"
                        >
                          <RotateCcw className="size-3.5" />
                          Restore
                        </button>
                      </div>
                    </div>
                  ))}
                  {!trash.length ? <p className="text-sm font-semibold" style={{ color: "var(--nb-muted)" }}>Trash is empty.</p> : null}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
