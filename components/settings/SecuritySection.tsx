"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Copy,
  Download,
  KeyRound,
  Loader2,
  Lock,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import SectionCard from "./SectionCard";
import Switch from "./Switch";
import type { PatchProfile, SettingsUser } from "./types";

type TwoFactorSetupData = {
  secret: string;
  otpAuthUri: string;
  qrCodeDataUrl: string;
  recoveryCodes: string[];
};

type SecuritySectionProps = {
  user: SettingsUser;
  onPatch: PatchProfile;
  saving: boolean;
};

export default function SecuritySection({ user, onPatch, saving }: SecuritySectionProps) {
  const [enabled, setEnabled] = useState(false);
  const [remainingCodes, setRemainingCodes] = useState(0);
  const [loading, setLoading] = useState(false);

  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [setupCode, setSetupCode] = useState("");

  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);

  const [newCodes, setNewCodes] = useState<string[] | null>(null);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const loadStatus = useCallback(async () => {
    const response = await fetch("/api/auth/2fa");
    if (!response.ok) return;
    const payload = await response.json();
    setEnabled(payload.enabled);
    setRemainingCodes(payload.remainingRecoveryCodesCount ?? 0);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadStatus]);

  async function startSetup() {
    setLoading(true);
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
      setLoading(false);
    }
  }

  function handleToggle(value: boolean) {
    if (saving) return;
    if (value) {
      if (!enabled && !setupData) startSetup();
      return;
    }
    if (setupData) {
      setSetupData(null);
      setSetupCode("");
      return;
    }
    if (enabled) setShowDisableDialog(true);
  }

  async function confirmEnable(event: React.FormEvent) {
    event.preventDefault();
    if (!setupData || setupCode.length < 6) return;
    setLoading(true);
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
      toast.success("Two-Factor Authentication is now active");
      setEnabled(true);
      setRemainingCodes(setupData.recoveryCodes.length);
      setSetupData(null);
      setSetupCode("");
    } catch {
      toast.error("Network error verifying 2FA");
    } finally {
      setLoading(false);
    }
  }

  async function disable(event: React.FormEvent) {
    event.preventDefault();
    setDisableLoading(true);
    try {
      const response = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", password: disablePassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data?.error ?? "Could not disable 2FA. Check your password.");
        return;
      }
      toast.success("Two-Factor Authentication has been disabled");
      setEnabled(false);
      setShowDisableDialog(false);
      setDisablePassword("");
    } catch {
      toast.error("Network error disabling 2FA");
    } finally {
      setDisableLoading(false);
    }
  }

  async function regenerateCodes() {
    const password = prompt("Enter your account password to generate new backup recovery codes:");
    if (!password) return;
    try {
      const response = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate-codes", password }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data?.error ?? "Could not regenerate recovery codes. Incorrect password.");
        return;
      }
      setNewCodes(data.recoveryCodes);
      setRemainingCodes(data.remainingRecoveryCodesCount);
      toast.success("8 new backup codes generated");
    } catch {
      toast.error("Network error generating codes");
    }
  }

  function downloadCodes(codes: string[]) {
    const textContent =
      `WESITE BACKUP RECOVERY CODES\n` +
      `Account: ${user.email}\n` +
      `Date: ${new Date().toISOString()}\n\n` +
      `Keep these codes in a safe place. Each code can only be used once.\n\n` +
      codes.map((code, index) => `${index + 1}. ${code}`).join("\n") +
      `\n`;

    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "wesite-backup-codes.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Backup codes downloaded");
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    const payload: Record<string, unknown> = { newPassword };
    if (user.hasPassword) payload.currentPassword = currentPassword;

    const result = await onPatch(payload);
    if (!result.ok) {
      toast.error(result.error ?? "Could not update password");
      return;
    }
    toast.success(user.hasPassword ? "Password updated" : "Password created");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  const switchOn = enabled || Boolean(setupData);

  return (
    <div className="space-y-5">
      <SectionCard
        icon={Lock}
        title="Two-Factor Authentication"
        description="Add a second step at sign-in with any TOTP authenticator app. Free, no SMS fees."
        action={
          <span className={`nb-tag ${enabled ? "nb-tag-success" : "nb-tag-danger"}`}>
            {enabled ? "Protected" : "Unprotected"}
          </span>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-xl border-3 p-4" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface-alt)" }}>
            <div className="flex items-center gap-3">
              <span
                className={`flex size-8 items-center justify-center rounded-lg ${enabled ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
              >
                {enabled ? <ShieldCheck className="size-5" /> : <ShieldAlert className="size-5" />}
              </span>
              <div>
                <span className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                  {enabled ? "2FA is active" : "2FA is disabled"}
                </span>
                <span className="text-[11px]" style={{ color: "var(--nb-muted)" }}>
                  {enabled ? `${remainingCodes} backup recovery code(s) remaining` : "Account protected by password only"}
                </span>
              </div>
            </div>
            <Switch checked={switchOn} onChange={handleToggle} disabled={saving} label="Enable two-factor authentication" />
          </div>

          {setupData ? (
            <div className="rounded-xl border-3 p-4" style={{ borderColor: "var(--nb-border)", background: "var(--nb-card)" }}>
              <div className="flex items-center justify-between border-b-3 pb-3" style={{ borderColor: "var(--nb-border)" }}>
                <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                  <ShieldCheck className="size-4 text-emerald-500" />
                  Configure authenticator app
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSetupData(null);
                    setSetupCode("");
                  }}
                  className="text-[10px] font-bold hover:underline"
                  style={{ color: "var(--nb-muted)" }}
                >
                  Cancel
                </button>
              </div>

              <div className="my-3 flex flex-col items-center">
                <div className="rounded-lg border-3 bg-white p-2" style={{ borderColor: "var(--nb-border)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={setupData.qrCodeDataUrl} alt="2FA QR code" className="size-40" />
                </div>
                <span className="mt-2 text-[11px] font-medium" style={{ color: "var(--nb-muted)" }}>
                  Scan with Google Authenticator or Apple Passwords
                </span>
              </div>

              <div className="mb-3 rounded-lg border-3 p-2 text-xs" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface-alt)" }}>
                <span className="block font-mono text-[10px]" style={{ color: "var(--nb-muted)" }}>
                  MANUAL SECRET KEY
                </span>
                <code className="select-all font-mono text-xs font-bold" style={{ color: "var(--nb-primary)" }}>
                  {setupData.secret}
                </code>
              </div>

              <div className="mb-3 rounded-lg border-3 p-3 text-xs" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold" style={{ color: "var(--nb-fg)" }}>
                    8 backup recovery codes
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadCodes(setupData.recoveryCodes)}
                    className="nb-btn nb-btn-ghost nb-btn-sm h-6 px-1.5 text-[10px]"
                  >
                    <Download className="size-3" /> Save codes
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-[10px]">
                  {setupData.recoveryCodes.map((code) => (
                    <span key={code} className="rounded border-2 px-1 py-0.5 text-center" style={{ borderColor: "var(--nb-border)" }}>
                      {code}
                    </span>
                  ))}
                </div>
              </div>

              <form onSubmit={confirmEnable} className="space-y-2.5">
                <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                  Enter the 6-digit code to verify
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={setupCode}
                    onChange={(event) => setSetupCode(event.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="nb-input mt-1.5 text-center font-mono text-base font-bold tracking-[0.25em]"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading || setupCode.length < 6}
                  className="nb-btn nb-btn-primary nb-btn-sm w-full"
                >
                  {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  Verify & activate 2FA
                </button>
              </form>
            </div>
          ) : null}

          {enabled && !setupData ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={regenerateCodes} className="nb-btn nb-btn-surface nb-btn-sm">
                <RotateCcw className="size-3.5" />
                Regenerate backup codes
              </button>
              <button
                type="button"
                onClick={() => setShowDisableDialog(true)}
                className="nb-btn nb-btn-danger nb-btn-sm"
              >
                Disable 2FA
              </button>
            </div>
          ) : null}

          {showDisableDialog ? (
            <form onSubmit={disable} className="space-y-2.5 rounded-lg border-3 p-3" style={{ borderColor: "var(--nb-danger)", background: "var(--nb-surface-alt)" }}>
              <span className="block text-xs font-bold" style={{ color: "var(--nb-danger)" }}>
                Confirm disabling two-factor authentication
              </span>
              <label className="block text-xs" style={{ color: "var(--nb-fg)" }}>
                Enter your password to confirm
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(event) => setDisablePassword(event.target.value)}
                  placeholder="Your password"
                  required
                  className="nb-input mt-1"
                />
              </label>
              <div className="flex items-center gap-2">
                <button type="submit" disabled={disableLoading || !disablePassword} className="nb-btn nb-btn-danger nb-btn-sm">
                  {disableLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Disable
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDisableDialog(false);
                    setDisablePassword("");
                  }}
                  className="nb-btn nb-btn-surface nb-btn-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {newCodes ? (
            <div className="rounded-lg border-3 p-3" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface-alt)" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                  New backup recovery codes
                </span>
                <button
                  type="button"
                  onClick={() => setNewCodes(null)}
                  className="text-[10px] font-bold hover:underline"
                  style={{ color: "var(--nb-muted)" }}
                >
                  Dismiss
                </button>
              </div>
              <p className="mt-1 text-[11px]" style={{ color: "var(--nb-muted)" }}>
                Old codes are now invalid. Save these single-use codes:
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-[11px]">
                {newCodes.map((code) => (
                  <span key={code} className="rounded border-2 px-1.5 py-0.5 text-center" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
                    {code}
                  </span>
                ))}
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(newCodes.join("\n"));
                    setCopiedCodes(true);
                    setTimeout(() => setCopiedCodes(false), 2000);
                    toast.success("Copied to clipboard");
                  }}
                  className="nb-btn nb-btn-surface nb-btn-sm text-[10px]"
                >
                  {copiedCodes ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  {copiedCodes ? "Copied" : "Copy all"}
                </button>
                <button type="button" onClick={() => downloadCodes(newCodes)} className="nb-btn nb-btn-surface nb-btn-sm text-[10px]">
                  <Download className="size-3" /> Download .txt
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        icon={KeyRound}
        title={user.hasPassword ? "Password" : "Create a password"}
        description={
          user.hasPassword
            ? "Update the password used to sign in with email."
            : "You signed up with Google. Create a password to also sign in with email."
        }
      >
        <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-3">
          {user.hasPassword ? (
            <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
              Current password
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="nb-input mt-2"
              />
            </label>
          ) : null}
          <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className="nb-input mt-2"
            />
          </label>
          <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className="nb-input mt-2"
            />
          </label>
          <div className="sm:col-span-3">
            <button type="submit" disabled={saving} className="nb-btn nb-btn-primary nb-btn-sm">
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />}
              {user.hasPassword ? "Update password" : "Create password"}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}