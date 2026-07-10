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

  if (!open) {
    return null;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(isEdit && initialFolder ? `/api/folders/${initialFolder._id}` : "/api/folders", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        parentFolderId: parentFolderId || null,
        color,
        icon: icon.trim() || "folder",
      }),
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
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-0 sm:place-items-center sm:p-6">
      <form
        onSubmit={submit}
        className="min-h-[40vh] w-full rounded-t-lg border border-zinc-300 bg-zinc-50 p-5 shadow-2xl dark:border-white/10 dark:bg-zinc-950 sm:min-h-0 sm:max-w-lg sm:rounded-lg"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">{isEdit ? "Customize Folder" : "Create Folder"}</h2>
            {isEdit && initialFolder ? <p className="mt-1 text-xs text-zinc-500">{initialFolder._id}</p> : null}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="grid size-8 place-items-center rounded-md hover:bg-zinc-100 dark:hover:bg-white/10">
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 sm:col-span-2">
            Folder Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              placeholder="Project Ideas"
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/10"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Parent Folder
            <select
              value={parentFolderId}
              onChange={(event) => setParentFolderId(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/10"
            >
              {folderOptions.map((option) => (
                <option key={option._id} value={option._id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Color
            <div className="mt-2 grid grid-cols-5 gap-2">
              {folderColorOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  className="relative h-11 rounded-xl border border-[color:var(--border)] shadow-sm transition hover:-translate-y-0.5"
                  style={{ backgroundColor: option }}
                >
                  {color === option ? <Check className="absolute inset-0 m-auto size-4 text-white drop-shadow" /> : null}
                </button>
              ))}
            </div>
          </label>

          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
              <Palette className="size-4 text-blue-600" />
              Icon library
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {folderIconOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setIcon(option.value)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                    icon === option.value
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
                      : "border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                >
                  <FolderIcon value={option.value} className="size-4" color={color} />
                  <span className="truncate">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-white ring-1 ring-[color:var(--border)] dark:bg-zinc-900">
              <FolderIcon value={icon} className="size-5" color={color} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{name || "Folder preview"}</p>
              <p className="text-xs text-zinc-500">Chosen color and icon appear in the library sidebar.</p>
            </div>
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          {isEdit ? (
            <button
              type="button"
              onClick={deleteFolder}
              className="mr-auto inline-flex h-10 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200"
            >
              <Trash2 className="size-4" />
              Delete folder
            </button>
          ) : null}
          <button type="button" onClick={onClose} className="h-10 rounded-md px-4 text-sm hover:bg-zinc-100 dark:hover:bg-white/10">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
