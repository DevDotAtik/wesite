"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Database,
  Download,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
  MoreVertical,
  ExternalLink,
  Check,
  X,
} from "lucide-react";
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isProcessingTrash, setIsProcessingTrash] = useState(false);

  // Close menus on outside click and Escape
  useEffect(() => {
    if (!openMenuId && !confirmOpen) return;

    const handleDismiss = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (openMenuId && !target.closest("[data-trash-menu]")) {
        setOpenMenuId(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenuId(null);
        setConfirmOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDismiss);
    document.addEventListener("touchstart", handleDismiss);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleDismiss);
      document.removeEventListener("touchstart", handleDismiss);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuId, confirmOpen]);

  async function importBookmarks(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const response = await fetch("/api/websites/import", { method: "POST", body: await file.text() });
      if (response.ok) {
        toast.success("Bookmarks imported successfully!");
        onRefresh();
      } else {
        toast.error("Import failed. Check the file format.");
      }
    } catch {
      toast.error("Network error during import");
    }
    event.target.value = "";
  }

  async function restore(websiteId: string) {
    try {
      const response = await fetch(`/api/websites/${websiteId}/restore`, { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        toast.error(payload?.error ?? "Could not restore from trash");
        return;
      }
      toast.success("Restored website from trash");
      onRefresh();
    } catch {
      toast.error("Error restoring website");
    }
  }

  async function restoreAllTrash() {
    if (trash.length === 0) return;
    setIsProcessingTrash(true);
    const toastId = toast.loading(`Restoring ${trash.length} websites...`);
    try {
      const response = await fetch("/api/websites/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: trash.map((w) => w._id),
          action: "restore",
        }),
      });
      if (response.ok) {
        toast.success(`Restored all ${trash.length} websites!`, { id: toastId });
        onRefresh();
      } else {
        toast.error("Failed to restore all items", { id: toastId });
      }
    } catch {
      toast.error("Network error restoring trash", { id: toastId });
    } finally {
      setIsProcessingTrash(false);
    }
  }

  async function emptyTrash() {
    if (trash.length === 0) return;
    if (!window.confirm(`Permanently delete all ${trash.length} items in trash? This cannot be undone.`)) {
      return;
    }
    setIsProcessingTrash(true);
    const toastId = toast.loading("Emptying trash...");
    try {
      const response = await fetch("/api/websites/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: trash.map((w) => w._id),
          action: "permanentDelete",
        }),
      });
      if (response.ok) {
        toast.success("Trash emptied permanently", { id: toastId });
        onRefresh();
      } else {
        toast.error("Failed to empty trash", { id: toastId });
      }
    } catch {
      toast.error("Network error emptying trash", { id: toastId });
    } finally {
      setIsProcessingTrash(false);
    }
  }

  async function permanentDeleteOne(websiteId: string, title?: string) {
    if (!window.confirm(`Permanently delete "${title || "this bookmark"}"?`)) return;
    try {
      const response = await fetch("/api/websites/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [websiteId],
          action: "permanentDelete",
        }),
      });
      if (response.ok) {
        toast.success("Bookmark permanently deleted");
        onRefresh();
      } else {
        toast.error("Failed to delete bookmark");
      }
    } catch {
      toast.error("Error deleting bookmark");
    }
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
      toast.success("Account deleted permanently");
      window.location.href = "/login";
    } catch {
      toast.error("Network error deleting account");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Data Management Section */}
      <SectionCard
        icon={Database}
        title="Data management"
        description="Move bookmarks and folders in and out of Wesite with clean export and import flows."
      >
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => window.location.assign("/api/websites/export")}
            className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-nb-card px-3 py-2 text-xs font-black text-nb-fg shadow-nb-xs hover:bg-nb-surface-alt transition-colors cursor-pointer"
          >
            <Download className="size-3.5 text-indigo-500" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            onClick={() => window.location.assign("/api/websites/export?format=html")}
            className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-nb-card px-3 py-2 text-xs font-black text-nb-fg shadow-nb-xs hover:bg-nb-surface-alt transition-colors cursor-pointer"
          >
            <Download className="size-3.5 text-indigo-500" />
            <span>Export HTML</span>
          </button>
          <label className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-nb-card px-3 py-2 text-xs font-black text-nb-fg shadow-nb-xs hover:bg-nb-surface-alt transition-colors cursor-pointer">
            <Upload className="size-3.5 text-emerald-500" />
            <span>Import HTML</span>
            <input type="file" accept=".html,.htm" onChange={importBookmarks} className="hidden" />
          </label>
        </div>
      </SectionCard>

      {/* Trash Management Section */}
      <SectionCard
        icon={Trash2}
        title="Trash"
        description="Recently deleted websites. Restore them to your collection or purge them permanently."
        action={
          trash.length > 0 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={restoreAllTrash}
                disabled={isProcessingTrash}
                className="flex items-center gap-1 rounded-xl border-2 border-nb-border bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 text-xs font-black hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="size-3" />
                <span>Restore All</span>
              </button>
              <button
                type="button"
                onClick={emptyTrash}
                disabled={isProcessingTrash}
                className="flex items-center gap-1 rounded-xl border-2 border-rose-600 bg-rose-500 text-white px-2.5 py-1 text-xs font-black hover:bg-rose-600 shadow-nb-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="size-3" />
                <span>Empty Trash</span>
              </button>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-2.5">
          {trash.map((website) => (
            <div
              key={website._id}
              className="rounded-xl border-2 border-nb-border bg-nb-surface p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-nb-xs"
            >
              <div className="min-w-0">
                <span className="block truncate text-sm font-black text-nb-fg">
                  {website.title || website.domain}
                </span>
                <span className="block truncate text-[11px] font-mono text-nb-muted">
                  {website.domain}
                </span>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 border-nb-border/20 pt-2 sm:pt-0">
                <a
                  href={website.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-lg border-2 border-nb-border bg-nb-card px-2.5 py-1 text-xs font-bold text-nb-fg shadow-nb-xs hover:bg-nb-surface-alt transition-colors"
                >
                  <ExternalLink className="size-3" />
                  <span>View</span>
                </a>

                <button
                  type="button"
                  onClick={() => restore(website._id)}
                  className="flex items-center gap-1 rounded-lg border-2 border-nb-border bg-indigo-600 px-2.5 py-1 text-xs font-black text-white shadow-nb-xs hover:bg-indigo-500 transition-colors cursor-pointer"
                >
                  <RotateCcw className="size-3" />
                  <span>Restore</span>
                </button>

                {/* Single 3-Dots Action Menu for Trash Item */}
                <div className="relative shrink-0" data-trash-menu>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenMenuId((cur) => (cur === website._id ? null : website._id));
                    }}
                    aria-label="More options"
                    title="More options"
                    className="flex size-7 items-center justify-center rounded-lg border-2 border-nb-border bg-nb-card text-nb-fg shadow-nb-xs hover:bg-nb-surface-alt transition-colors cursor-pointer"
                  >
                    <MoreVertical className="size-3.5" />
                  </button>

                  {openMenuId === website._id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-8 z-50 min-w-44 rounded-xl border-2 border-nb-border bg-nb-card p-1.5 shadow-nb-xl space-y-0.5 text-xs font-bold animate-in fade-in zoom-in-95 duration-100 text-nb-fg select-none"
                      style={{ borderColor: "var(--nb-border)", background: "var(--nb-card)" }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          restore(website._id);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-nb-surface-alt text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="size-3.5" />
                        <span>Restore Website</span>
                      </button>

                      <a
                        href={website.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setOpenMenuId(null)}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-nb-surface-alt transition-colors cursor-pointer"
                      >
                        <ExternalLink className="size-3.5" />
                        <span>Open URL</span>
                      </a>

                      <div className="my-1 border-t border-nb-border/30" />

                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          permanentDeleteOne(website._id, website.title);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Delete Forever</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {!trash.length && (
            <div className="rounded-xl border-2 border-dashed border-nb-border/50 bg-nb-surface-alt/30 p-6 text-center text-xs font-bold text-nb-muted">
              Trash is empty. Deleted websites will appear here.
            </div>
          )}
        </div>
      </SectionCard>

      {/* Danger Zone Section */}
      <SectionCard
        icon={AlertTriangle}
        title="Danger zone"
        description="Irreversible actions for your account. Proceed carefully."
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border-2 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 p-4">
          <div className="min-w-0">
            <span className="block text-sm font-black text-rose-600 dark:text-rose-400">
              Delete account and all workspace data
            </span>
            <span className="text-xs text-nb-muted">
              Permanently removes your profile, bookmarks, folders, monitors, todos and WebFlows.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
            <button
              type="button"
              onClick={onLogout}
              className="rounded-xl border-2 border-nb-border bg-nb-card px-3 py-1.5 text-xs font-black text-nb-fg shadow-nb-xs hover:bg-nb-surface-alt transition-colors cursor-pointer"
            >
              Sign out
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border-2 border-rose-600 bg-rose-500 text-white px-3 py-1.5 text-xs font-black shadow-nb-xs hover:bg-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>Delete account</span>
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Delete Account Confirmation Modal */}
      {confirmOpen && (
        <div
          className="nb-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Delete account confirmation"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setConfirmOpen(false);
              setConfirmText("");
            }
          }}
        >
          <div className="nb-modal bg-nb-card border-3 border-nb-border shadow-nb-xl select-none animate-in fade-in zoom-in-95 duration-150">
            <div className="nb-modal-header border-b-2 border-nb-border">
              <span className="text-sm font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="size-4" />
                <span>Delete your account?</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmText("");
                }}
                className="p-1 rounded-lg text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="nb-modal-body space-y-3">
              <p className="text-xs sm:text-sm text-nb-muted leading-relaxed">
                This action is <strong>irreversible and permanent</strong>. All of your saved bookmarks,
                folders, monitors, activity history, and WebFlow automations will be permanently wiped.
              </p>

              <label className="block text-xs font-black text-nb-fg">
                Type <span className="font-mono text-rose-600 dark:text-rose-400 font-black">{user.email}</span> to confirm
                <input
                  type="text"
                  value={confirmText}
                  onChange={(event) => setConfirmText(event.target.value)}
                  placeholder={user.email}
                  className="w-full rounded-xl border-2 border-nb-border bg-nb-surface px-3 py-2 text-xs font-bold text-nb-fg focus:outline-none focus:ring-2 focus:ring-rose-500 mt-1.5"
                  autoFocus
                />
              </label>
            </div>

            <div className="nb-modal-footer border-t-2 border-nb-border gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmText("");
                }}
                className="rounded-xl border-2 border-nb-border bg-nb-card px-4 py-2 text-xs font-bold text-nb-fg shadow-nb-xs hover:bg-nb-surface-alt cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmText !== user.email || deleting}
                onClick={deleteAccount}
                className="flex items-center gap-1.5 rounded-xl border-2 border-rose-600 bg-rose-500 text-white px-4 py-2 text-xs font-black shadow-nb-xs hover:bg-rose-600 disabled:opacity-50 transition-all cursor-pointer"
              >
                {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                <span>Delete forever</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
