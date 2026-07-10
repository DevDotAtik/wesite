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
      if (payload.user?.themePreference) {
        applyThemePreference(payload.user.themePreference);
      }
    }
    if (trashed.ok) setTrash((await trashed.json()).websites ?? []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const themePreference = form.get("themePreference") as ThemePreference;
    const response = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        avatarUrl: form.get("avatarUrl"),
        themePreference,
      }),
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
    <div className="min-h-screen bg-transparent">
      <Navbar userName={user?.name} />
      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_18px_50px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="border-b border-[color:var(--border)] px-6 py-6 sm:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                <Sparkles className="size-5" />
              </span>
              <div>
                <h1 className="text-2xl font-semibold">Settings</h1>
                <p className="mt-1 text-sm text-[color:var(--muted)]">Tune your space, theme, and privacy controls.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-[color:var(--muted)]">
              <span className="rounded-full border border-[color:var(--border)] px-3 py-1">Theme sync</span>
              <span className="rounded-full border border-[color:var(--border)] px-3 py-1">Export / import</span>
              <span className="rounded-full border border-[color:var(--border)] px-3 py-1">Private trash</span>
            </div>
          </div>

          <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1.08fr_0.92fr]">
            <form onSubmit={saveProfile} className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-blue-600" />
                <h2 className="text-sm font-semibold">Profile & Theme</h2>
              </div>
              <div className="mt-4 grid gap-4">
                <label className="block text-sm font-medium">
                  Name
                  <input name="name" defaultValue={user?.name} className="mt-2 h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 outline-none ring-0 focus:border-blue-500" />
                </label>
                <label className="block text-sm font-medium">
                  Email
                  <input name="email" defaultValue={user?.email} className="mt-2 h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 outline-none ring-0 focus:border-blue-500" />
                </label>
                <label className="block text-sm font-medium">
                  Avatar URL
                  <input name="avatarUrl" defaultValue={user?.avatarUrl} className="mt-2 h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 outline-none ring-0 focus:border-blue-500" />
                </label>
                <label className="block text-sm font-medium">
                  Theme
                  <select name="themePreference" defaultValue={user?.themePreference ?? "system"} className="mt-2 h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 outline-none ring-0 focus:border-blue-500">
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>
              </div>

              {error ? <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{error}</p> : null}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">Save changes</button>
                <button type="button" onClick={logout} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/10">
                  Logout
                </button>
                {status ? (
                  <span className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-300">
                    <CheckCircle2 className="size-4" />
                    {status}
                  </span>
                ) : null}
              </div>
            </form>

            <section className="space-y-5">
              <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <ExternalLink className="size-4 text-blue-600" />
                  <h2 className="text-sm font-semibold">Data Management</h2>
                </div>
                <p className="mt-2 text-sm text-[color:var(--muted)]">Move bookmarks in and out of Wesite with clean export/import flows.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => window.location.assign("/api/websites/export")} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10">Export JSON</button>
                  <button type="button" onClick={() => window.location.assign("/api/websites/export?format=html")} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10">Export HTML</button>
                  <label className="cursor-pointer rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10">
                    Import HTML
                    <input type="file" accept=".html,.htm" onChange={importBookmarks} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Trash2 className="size-4 text-red-500" />
                  <h2 className="text-sm font-semibold">Trash</h2>
                </div>
                <div className="mt-3 space-y-2">
                  {trash.map((website) => (
                    <div key={website._id} className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm">
                      <span className="truncate">{website.title || website.domain}</span>
                      <div className="flex items-center gap-2">
                        <a href={website.url} target="_blank" rel="noreferrer" className="rounded-lg px-2 py-1 text-xs text-[color:var(--muted)] hover:bg-black/5 dark:hover:bg-white/10">
                          View
                        </a>
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
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                        >
                          <RotateCcw className="size-3.5" />
                          Restore
                        </button>
                      </div>
                    </div>
                  ))}
                  {!trash.length ? <p className="text-sm text-[color:var(--muted)]">Trash is empty.</p> : null}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
