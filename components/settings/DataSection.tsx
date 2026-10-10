"use client";

import { useState } from "react";
import { AlertTriangle, Database, Download, Loader2, RotateCcw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import SectionCard from "./SectionCard";
import type { SettingsUser, TrashItem } from "./types";

type DataSectionProps = {
  user: SettingsUser;
  trash: TrashItem[];
  onRefresh: () => void;
  onLogout: () => void;
};

export default function DataSection({ user, trash, onRefresh, onLogout }: DataSectionProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function importBookmarks(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const response = await fetch("/api/websites/import", { method: "POST", body: await file.text() });
    toast(response.ok ? "Imported bookmarks" : "Import failed", { description: response.ok ? undefined : "Check the file format" });
    if (response.ok) onRefresh();
    event.target.value = "";
  }

  async function restore(websiteId: string) {
    const response = await fetch(`/api/websites/${websiteId}/restore`, { method: "POST" });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error(payload?.error ?? "Could not restore from trash");
      return;
    }
    toast.success("Restored from trash");
    onRefresh();
  }

  async function deleteAccount() {
    if (confirmText !== user.email) return;
    setDeleting(true);
    try {
      const response = await fetch("/api/auth/me", { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        toast.error(payload?.error ?? "Could not delete account");
        return;
      }
      toast.success("Account deleted");
      window.location.href = "/login";
    } catch {
      toast.error("Network error deleting account");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionCard
        icon={Database}
        title="Data management"
        description="Move bookmarks and folders in and out of Wesite with clean export and import flows."
      >
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => window.location.assign("/api/websites/export")} className="nb-btn nb-btn-surface nb-btn-sm">
            <Download className="size-3.5" />
            Export JSON
          </button>
          <button type="button" onClick={() => window.location.assign("/api/websites/export?format=html")} className="nb-btn nb-btn-surface nb-btn-sm">
            <Download className="size-3.5" />
            Export HTML
          </button>
          <label className="nb-btn nb-btn-surface nb-btn-sm cursor-pointer">
            <Upload className="size-3.5" />
            Import HTML
            <input type="file" accept=".html,.htm" onChange={importBookmarks} className="hidden" />
          </label>
        </div>
      </SectionCard>

      <SectionCard
        icon={Trash2}
        title="Trash"
        description="Recently deleted websites. Restore them before they are permanently gone."
      >
        <div className="space-y-2">
          {trash.map((website) => (
            <div key={website._id} className="nb-card-sm flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <span className="block truncate text-sm font-semibold" style={{ color: "var(--nb-fg)" }}>
                  {website.title || website.domain}
                </span>
                <span className="block truncate text-[11px]" style={{ color: "var(--nb-muted)" }}>
                  {website.domain}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a href={website.url} target="_blank" rel="noreferrer" className="nb-btn nb-btn-surface nb-btn-sm">
                  View
                </a>
                <button type="button" onClick={() => restore(website._id)} className="nb-btn nb-btn-primary nb-btn-sm">
                  <RotateCcw className="size-3.5" />
                  Restore
                </button>
              </div>
            </div>
          ))}
          {!trash.length ? (
            <p className="text-sm font-semibold" style={{ color: "var(--nb-muted)" }}>
              Trash is empty.
            </p>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        icon={AlertTriangle}
        title="Danger zone"
        description="Irreversible actions for your account. Proceed carefully."
      >
        <div className="flex flex-wrap items-center gap-3 rounded-xl border-3 border-[var(--nb-danger)] bg-[var(--nb-surface-alt)] p-4">
          <div className="min-w-0">
            <span className="block text-sm font-bold" style={{ color: "var(--nb-danger)" }}>
              Delete account and all data
            </span>
            <span className="text-xs" style={{ color: "var(--nb-muted)" }}>
              Permanently removes your profile, bookmarks, folders, monitors, todos and WebFlows.
            </span>
          </div>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onLogout} className="nb-btn nb-btn-surface nb-btn-sm">
              Sign out
            </button>
            <button type="button" onClick={() => setConfirmOpen(true)} className="nb-btn nb-btn-danger nb-btn-sm">
              <Trash2 className="size-3.5" />
              Delete account
            </button>
          </div>
        </div>
      </SectionCard>

      {confirmOpen ? (
        <div className="nb-overlay" role="dialog" aria-modal="true" aria-label="Delete account confirmation">
          <div className="nb-modal">
            <div className="nb-modal-header">
              <span className="text-sm font-extrabold" style={{ color: "var(--nb-danger)" }}>
                Delete your account?
              </span>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmText("");
                }}
                className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="nb-modal-body">
              <p className="text-sm leading-relaxed" style={{ color: "var(--nb-muted)" }}>
                This is permanent. All of your data will be erased and cannot be recovered.
              </p>
              <label className="mt-4 block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                Type <span className="font-mono" style={{ color: "var(--nb-danger)" }}>{user.email}</span> to confirm
                <input
                  type="text"
                  value={confirmText}
                  onChange={(event) => setConfirmText(event.target.value)}
                  placeholder={user.email}
                  className="nb-input mt-2"
                  autoFocus
                />
              </label>
            </div>
            <div className="nb-modal-footer">
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmText("");
                }}
                className="nb-btn nb-btn-surface nb-btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmText !== user.email || deleting}
                onClick={deleteAccount}
                className="nb-btn nb-btn-danger nb-btn-sm"
              >
                {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                Delete forever
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}