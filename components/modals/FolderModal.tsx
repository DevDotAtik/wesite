"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Palette, Trash2, X } from "lucide-react";
import { FolderIcon, folderColorOptions, folderIconOptions } from "@/lib/folder-icons";

type FolderOption = {
  _id: string;
  name: string;
};

type FolderModalProps = {
  open: boolean;
  mode?: "add" | "edit";
  onClose: () => void;
  onSaved: () => void;
  folders: FolderOption[];
  initialFolder?: {
    _id: string;
    name: string;
    parentFolderId: string | null;
    color?: string;
    icon?: string;
  } | null;
  defaultParentFolderId?: string | null;
};

export default function FolderModal({
  open,
  mode = "add",
  onClose,
  onSaved,
  folders,
  initialFolder,
  defaultParentFolderId = null,
}: FolderModalProps) {
  const [name, setName] = useState("");
  const [parentFolderId, setParentFolderId] = useState<string | "">("");
  const [color, setColor] = useState("#3b82f6");
  const [icon, setIcon] = useState("folder");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = mode === "edit";
  const folderOptions = useMemo(() => [{ _id: "", name: "Root" }, ...folders], [folders]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      setName(initialFolder?.name ?? "");
      setParentFolderId(initialFolder?.parentFolderId ?? defaultParentFolderId ?? "");
      setColor(initialFolder?.color ?? "#3b82f6");
      setIcon(initialFolder?.icon ?? "folder");
      setError("");
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [defaultParentFolderId, initialFolder, open]);

  useEffect(() => {
    if (!open) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(isEdit && initialFolder ? `/api/folders/${initialFolder._id}` : "/api/folders", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), parentFolderId: parentFolderId || null, color, icon: icon.trim() || "folder" }),
    });

    setLoading(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Could not save folder");
      return;
    }

    onSaved();
    onClose();
  }

  async function deleteFolder() {
    if (!initialFolder) return;
    const confirmed = window.confirm(`Delete "${initialFolder.name}"? Websites will stay in the parent folder.`);
    if (!confirmed) return;

    const response = await fetch(`/api/folders/${initialFolder._id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Could not delete folder");
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <div
      className="nb-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit folder" : "Create folder"}
        className="nb-modal w-full sm:max-w-lg"
      >
        <div className="nb-modal-header">
          <div>
            <h2 className="text-lg font-extrabold" style={{ color: "var(--nb-fg)" }}>{isEdit ? "Customize Folder" : "Create Folder"}</h2>
            {isEdit && initialFolder ? <p className="mt-1 text-xs" style={{ color: "var(--nb-muted)" }}>Websites inside stay in the parent folder.</p> : null}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm">
            <X className="size-4" />
          </button>
        </div>

        <div className="nb-modal-body">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold sm:col-span-2" style={{ color: "var(--nb-fg)" }}>
              Folder Name
              <input value={name} onChange={(event) => setName(event.target.value)} autoFocus placeholder="Project Ideas" className="nb-input mt-2" />
            </label>
            <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
              Parent Folder
              <select value={parentFolderId} onChange={(event) => setParentFolderId(event.target.value)} className="nb-input mt-2">
                {folderOptions.map((option) => (
                  <option key={option._id} value={option._id}>{option.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
              Color
              <div className="mt-2 grid grid-cols-5 gap-2">
                {folderColorOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setColor(option)}
                    aria-label={`Use color ${option}`}
                    aria-pressed={color === option}
                    className="relative h-10 rounded-xl border-[3px] shadow-sm transition hover:-translate-y-0.5"
                    style={{ backgroundColor: option, borderColor: color === option ? "var(--nb-border)" : "transparent" }}
                  >
                    {color === option ? <Check className="absolute inset-0 m-auto size-4 text-white drop-shadow" /> : null}
                  </button>
                ))}
              </div>
            </label>
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                <Palette className="size-4" style={{ color: "var(--nb-primary)" }} />
                Icon library
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {folderIconOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setIcon(option.value)}
                    aria-label={`Use ${option.label} icon`}
                    aria-pressed={icon === option.value}
                    className={`nb-sidebar-item ${icon === option.value ? "nb-sidebar-item-active" : ""}`}
                  >
                    <FolderIcon value={option.value} className="size-4" color={color} />
                    <span className="truncate">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="nb-card-sm mt-4 p-3" style={{ background: "var(--nb-surface-alt)" }}>
            <div className="flex items-center gap-3">
              <span className="nb-card-yellow grid size-10 place-items-center rounded-xl border-[3px]" style={{ borderColor: "var(--nb-border)", background: color }}>
                <FolderIcon value={icon} className="size-5 text-white" color="#ffffff" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold">{name || "Folder preview"}</p>
                <p className="text-xs" style={{ color: "var(--nb-muted)" }}>Chosen color and icon appear in the sidebar.</p>
              </div>
            </div>
          </div>
        </div>

        {error ? <p className="px-6 text-sm font-semibold" style={{ color: "var(--nb-danger)" }}>{error}</p> : null}

        <div className="nb-modal-footer">
          {isEdit ? (
            <button type="button" onClick={deleteFolder} className="nb-btn nb-btn-danger nb-btn-sm mr-auto">
              <Trash2 className="size-4" />
              Delete folder
            </button>
          ) : null}
          <button type="button" onClick={onClose} className="nb-btn nb-btn-surface nb-btn-sm">Cancel</button>
          <button type="submit" disabled={loading || !name.trim()} className="nb-btn nb-btn-primary nb-btn-sm">
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
