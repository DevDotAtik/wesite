"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  KeyRound,
  Loader2,
  Lock,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import Navbar from "@/components/navbar";
import { setThemePreference, type ThemePreference } from "@/lib/theme";
import { toast } from "sonner";

type User = {
  name: string;
  email: string;
  avatarUrl?: string;
  themePreference?: ThemePreference;
  twoFactorEnabled?: boolean;
  createdAt?: string;
};

type TwoFactorSetupData = {
  secret: string;
  otpAuthUri: string;
  qrCodeDataUrl: string;
  recoveryCodes: string[];
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [trash, setTrash] = useState<Array<{ _id: string; title: string; domain: string; url: string }>>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // 2FA state in settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [remainingCodesCount, setRemainingCodesCount] = useState(0);
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);
  const [showNewCodesModal, setShowNewCodesModal] = useState<string[] | null>(null);
  const [copiedCodes, setCopiedCodes] = useState(false);

  async function load() {
    const [me, trashed, twoFa] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/websites?trashed=true"),
      fetch("/api/auth/2fa"),
    ]);

    if (me.ok) {
      const payload = await me.json();
      setUser(payload.user);
    }
    if (trashed.ok) setTrash((await trashed.json()).websites ?? []);
    if (twoFa.ok) {
      const payload = await twoFa.json();
      setTwoFactorEnabled(payload.enabled);
      setRemainingCodesCount(payload.remainingRecoveryCodesCount ?? 0);
    }
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
    setThemePreference(themePreference);
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

  // 2FA Setup Flow in Settings
  async function start2FASetup() {
    setSetupLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data?.error ?? "Failed to initialize 2FA setup");
        return;
      }
      setSetupData(data);
    } catch {
      toast.error("Network error starting 2FA setup");
    } finally {
      setSetupLoading(false);
    }
  }

  async function confirmEnable2FA(e: React.FormEvent) {
    e.preventDefault();
    if (!setupData || setupCode.length < 6) return;
    setSetupLoading(true);
    try {
      const response = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enable",
          secret: setupData.secret,
          code: setupCode.trim(),
          recoveryCodes: setupData.recoveryCodes,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data?.error ?? "Failed to verify 2FA code");
        return;
      }
      toast.success("Two-Factor Authentication is now active!");
      setTwoFactorEnabled(true);
      setRemainingCodesCount(setupData.recoveryCodes.length);
      setSetupData(null);
      setSetupCode("");
      load();
    } catch {
      toast.error("Network error verifying 2FA");
    } finally {
      setSetupLoading(false);
    }
  }

  async function disable2FA(e: React.FormEvent) {
    e.preventDefault();
    setDisableLoading(true);
    try {
      const response = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "disable",
          password: disablePassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data?.error ?? "Could not disable 2FA. Check your password.");
        return;
      }
      toast.success("Two-Factor Authentication has been disabled.");
      setTwoFactorEnabled(false);
      setShowDisableDialog(false);
      setDisablePassword("");
      load();
    } catch {
      toast.error("Network error disabling 2FA");
    } finally {
      setDisableLoading(false);
    }
  }

  async function regenerateRecoveryCodes() {
    const password = prompt("Please enter your account password to generate new backup recovery codes:");
    if (!password) return;

    try {
      const response = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regenerate-codes",
          password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data?.error ?? "Could not regenerate recovery codes. Incorrect password.");
        return;
      }
      setShowNewCodesModal(data.recoveryCodes);
      setRemainingCodesCount(data.remainingRecoveryCodesCount);
      toast.success("8 new backup codes generated!");
    } catch {
      toast.error("Network error generating codes");
    }
  }

  function downloadCodes(codes: string[]) {
    const textContent =
      `WESITE BACKUP RECOVERY CODES\n` +
      `Account: ${user?.email}\n` +
      `Date: ${new Date().toISOString()}\n\n` +
      `Keep these codes in a safe place. Each code can only be used once.\n\n` +
      codes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
      `\n`;

    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wesite-backup-codes.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Backup codes downloaded!");
  }

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
              <p className="mt-1 text-sm" style={{ color: "var(--nb-muted)" }}>Tune your space, security, theme, and data controls.</p>
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              <span className="nb-tag nb-tag-success">Free 2FA</span>
              <span className="nb-tag nb-tag-primary">Theme sync</span>
              <span className="nb-tag nb-tag-accent">Export / import</span>
            </div>
          </div>

          <div className="grid gap-5 p-4 sm:p-6 lg:p-8 lg:grid-cols-[1.08fr_0.92fr]">
            {/* Left Column: Profile Form + Security / 2FA Card */}
            <div className="space-y-5">
              {/* Profile Form */}
              <form onSubmit={saveProfile} className="nb-card-static nb-card-enter p-5" style={{ background: "var(--nb-surface)" }}>
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

              {/* Security & Free Two-Factor Authentication (2FA) */}
              <div className="nb-card-static nb-card-enter p-5" style={{ background: "var(--nb-surface)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="size-4" style={{ color: "var(--nb-primary)" }} />
                    <h2 className="text-sm font-extrabold" style={{ color: "var(--nb-fg)" }}>
                      Two-Factor Authentication (2FA)
                    </h2>
                  </div>
                  <span className="nb-tag nb-tag-success text-[10px]">
                    100% Free • TOTP
                  </span>
                </div>

                <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--nb-muted)" }}>
                  Use any standard authenticator app (Google Authenticator, Microsoft Authenticator, Apple Passwords, Authy) to secure your account. Zero recurring fees, zero SMS costs.
                </p>

                {/* Status indicator */}
                <div className="mt-4 flex items-center justify-between rounded-lg border-2 p-3" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface-alt)" }}>
                  <div className="flex items-center gap-2.5">
                    {twoFactorEnabled ? (
                      <span className="flex size-7 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="size-4" />
                      </span>
                    ) : (
                      <span className="flex size-7 items-center justify-center rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        <ShieldAlert className="size-4" />
                      </span>
                    )}
                    <div>
                      <span className="text-xs font-bold block" style={{ color: "var(--nb-fg)" }}>
                        {twoFactorEnabled ? "2FA is Active" : "2FA is Disabled"}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--nb-muted)" }}>
                        {twoFactorEnabled
                          ? `${remainingCodesCount} backup recovery code(s) remaining`
                          : "Account is protected by password only"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {twoFactorEnabled ? (
                      <span className="nb-tag nb-tag-success text-[10px]">
                        Protected
                      </span>
                    ) : (
                      <span className="nb-tag nb-tag-danger text-[10px]">
                        Unprotected
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions for Enabled vs Disabled */}
                {!twoFactorEnabled && !setupData ? (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={start2FASetup}
                      disabled={setupLoading}
                      className="nb-btn nb-btn-primary nb-btn-sm w-full"
                    >
                      {setupLoading ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
                      Set Up Free 2FA Now
                    </button>
                  </div>
                ) : null}

                {/* In-page 2FA Setup Flow */}
                {setupData ? (
                  <div className="mt-4 rounded-xl border-2 p-4" style={{ borderColor: "var(--nb-border)", background: "var(--nb-card)" }}>
                    <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--nb-border)" }}>
                      <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--nb-fg)" }}>
                        <ShieldCheck className="size-4 text-emerald-500" />
                        Configure Authenticator App
                      </span>
                      <button
                        type="button"
                        onClick={() => setSetupData(null)}
                        className="text-[10px] font-bold text-slate-400 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="my-3 flex flex-col items-center">
                      <div className="rounded-lg border-2 p-2 bg-white" style={{ borderColor: "var(--nb-border)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={setupData.qrCodeDataUrl} alt="2FA QR Code" className="size-40" />
                      </div>
                      <span className="mt-2 text-[11px] font-mono font-medium text-slate-500">
                        Scan with Google Authenticator or Apple Passwords
                      </span>
                    </div>

                    <div className="mb-3 rounded-lg border p-2 text-xs" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface-alt)" }}>
                      <span className="text-[10px] font-mono text-slate-400 block">MANUAL SECRET KEY</span>
                      <code className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 select-all">
                        {setupData.secret}
                      </code>
                    </div>

                    <div className="mb-3 rounded-lg border p-2.5 text-xs" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px]">8 Backup Recovery Codes</span>
                        <button
                          type="button"
                          onClick={() => downloadCodes(setupData.recoveryCodes)}
                          className="nb-btn nb-btn-ghost nb-btn-sm h-6 px-1.5 text-[10px]"
                        >
                          <Download className="size-3" /> Save Codes
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-[10px]">
                        {setupData.recoveryCodes.map((c) => (
                          <span key={c} className="rounded border px-1 py-0.5 text-center" style={{ borderColor: "var(--nb-border)" }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={confirmEnable2FA} className="space-y-2.5">
                      <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                        Enter 6-digit code to verify:
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={setupCode}
                          onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="123456"
                          className="nb-input mt-1.5 text-center font-mono text-base font-bold tracking-[0.25em]"
                          required
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={setupLoading || setupCode.length < 6}
                        className="nb-btn nb-btn-primary nb-btn-sm w-full"
                      >
                        {setupLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                        Verify & Activate 2FA
                      </button>
                    </form>
                  </div>
                ) : null}

                {/* Manage Enabled 2FA */}
                {twoFactorEnabled && !setupData ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={regenerateRecoveryCodes}
                      className="nb-btn nb-btn-surface nb-btn-sm text-xs"
                    >
                      <RotateCcw className="size-3.5" />
                      Regenerate Backup Codes
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDisableDialog(true)}
                      className="nb-btn nb-btn-danger nb-btn-sm text-xs"
                    >
                      Disable 2FA
                    </button>
                  </div>
                ) : null}

                {/* Disable 2FA Prompt */}
                {showDisableDialog ? (
                  <form onSubmit={disable2FA} className="mt-3 rounded-lg border-2 p-3 space-y-2.5" style={{ borderColor: "var(--nb-danger)", background: "var(--nb-surface-alt)" }}>
                    <span className="text-xs font-bold block" style={{ color: "var(--nb-danger)" }}>
                      Confirm Disabling Two-Factor Authentication
                    </span>
                    <label className="block text-xs">
                      Enter your password to confirm:
                      <input
                        type="password"
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                        placeholder="Your password"
                        required
                        className="nb-input mt-1"
                      />
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={disableLoading || !disablePassword}
                        className="nb-btn nb-btn-danger nb-btn-sm text-xs"
                      >
                        {disableLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
                        Disable
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDisableDialog(false);
                          setDisablePassword("");
                        }}
                        className="nb-btn nb-btn-surface nb-btn-sm text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}

                {/* Newly Generated Recovery Codes Modal/Display */}
                {showNewCodesModal ? (
                  <div className="mt-3 rounded-lg border-2 p-3" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface-alt)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">New Backup Recovery Codes</span>
                      <button
                        type="button"
                        onClick={() => setShowNewCodesModal(null)}
                        className="text-[10px] text-slate-400 font-bold hover:underline"
                      >
                        Dismiss
                      </button>
                    </div>
                    <p className="mt-1 text-[11px]" style={{ color: "var(--nb-muted)" }}>
                      Old codes have been invalidated. Save these new single-use codes:
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-[11px]">
                      {showNewCodesModal.map((code) => (
                        <span key={code} className="rounded border px-1.5 py-0.5 text-center" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
                          {code}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(showNewCodesModal.join("\n"));
                          setCopiedCodes(true);
                          setTimeout(() => setCopiedCodes(false), 2000);
                          toast.success("Copied to clipboard!");
                        }}
                        className="nb-btn nb-btn-surface nb-btn-sm text-[10px]"
                      >
                        {copiedCodes ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                        {copiedCodes ? "Copied" : "Copy All"}
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadCodes(showNewCodesModal)}
                        className="nb-btn nb-btn-surface nb-btn-sm text-[10px]"
                      >
                        <Download className="size-3" /> Download .txt
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Right Column: Data Management + Trash */}
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
              <div className="nb-card-static nb-card-enter p-5" style={{ background: "var(--nb-surface)" }}>
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
