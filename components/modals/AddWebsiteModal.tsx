"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, X } from "lucide-react";
import type { WebsiteItem } from "@/components/grid/WebsiteCard";

type FolderOption = {
  _id: string;
  name: string;
};

type AddWebsiteModalProps = {
  open: boolean;
  mode?: "add" | "edit";
  onClose: () => void;
  onSaved: () => void;
  folderId?: string | null;
  website?: WebsiteItem | null;
  folders: FolderOption[];
};

export default function AddWebsiteModal({
  open,
  mode = "add",
  onClose,
  onSaved,
  folderId,
  website,
  folders,
}: AddWebsiteModalProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [customIconUrl, setCustomIconUrl] = useState("");
  const [websiteFolderId, setWebsiteFolderId] = useState<string | "">("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = mode === "edit";
  const folderOptions = folders;

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      setUrl(website?.url ?? "");
      setTitle(website?.title ?? "");
      setDescription(website?.description ?? "");
      setTags((website?.tags ?? []).join(", "));
      setNotes((website as { notes?: string } | null)?.notes ?? "");
      setCustomIconUrl((website as { customIconUrl?: string } | null)?.customIconUrl ?? "");
      setWebsiteFolderId((website?.folderId ?? folderId ?? "") as string | "");
      setIsFavorite(website?.isFavorite ?? false);
      setError("");
      setLoading(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [folderId, open, website]);

  if (!open) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(isEdit && website ? `/api/websites/${website._id}` : "/api/websites", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isEdit
          ? {
              url: url.trim(),
              title: title.trim(),
              description: description.trim(),
              tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
              notes: notes.trim(),
              customIconUrl: customIconUrl.trim(),
              folderId: websiteFolderId || null,
              isFavorite,
            }
          : { url: url.trim(), folderId: websiteFolderId || null },
      ),
    });

    setLoading(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Could not save website");
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <div className="nb-overlay" style={{ alignItems: "flex-end" }}>
      <form
        onSubmit={submit}
        className="nb-modal min-h-[45vh] w-full rounded-b-none sm:rounded-b-2xl sm:max-w-2xl"
        style={{ alignSelf: "stretch" }}
      >
        <div className="nb-modal-header">
          <div>
            <h2 className="text-lg font-extrabold" style={{ color: "var(--nb-fg)" }}>{isEdit ? "Customize Website" : "Add Website"}</h2>
            {isEdit && website ? (
              <p className="mt-1 max-w-md truncate text-xs" style={{ color: "var(--nb-muted)" }}>{website.url}</p>
            ) : null}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm">
            <X className="size-4" />
          </button>
        </div>

        <div className="nb-modal-body">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold sm:col-span-2" style={{ color: "var(--nb-fg)" }}>
              URL
              <input value={url} onChange={(event) => setUrl(event.target.value)} autoFocus placeholder="https://example.com" className="nb-input mt-2" />
            </label>
            <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Website title" className="nb-input mt-2" />
            </label>
            <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
              Folder
              <select value={websiteFolderId} onChange={(event) => setWebsiteFolderId(event.target.value)} className="nb-input mt-2">
                {folderOptions.map((option) => (
                  <option key={option._id} value={option._id}>{option.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold sm:col-span-2" style={{ color: "var(--nb-fg)" }}>
              Description
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Short note about this site" className="nb-input mt-2" />
            </label>
            <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
              Tags
              <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="design, docs, inspiration" className="nb-input mt-2" />
            </label>
            <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
              Custom Icon URL
              <input value={customIconUrl} onChange={(event) => setCustomIconUrl(event.target.value)} placeholder="https://..." className="nb-input mt-2" />
            </label>
            <label className="block text-xs font-bold sm:col-span-2" style={{ color: "var(--nb-fg)" }}>
              Notes
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Private notes" className="nb-input mt-2" />
            </label>
          </div>

          {isEdit && customIconUrl ? (
            <div className="mt-4 flex items-center gap-3">
              <span className="nb-tag">Icon preview</span>
              <Image src={customIconUrl} alt="" width={28} height={28} className="size-7 rounded-lg border-[3px] object-cover" style={{ borderColor: "var(--nb-border)" }} unoptimized />
            </div>
          ) : null}

          {isEdit ? (
            <label className="mt-4 flex items-center gap-2 text-sm font-bold" style={{ color: "var(--nb-fg)" }}>
              <input type="checkbox" checked={isFavorite} onChange={(event) => setIsFavorite(event.target.checked)} className="size-4 rounded border-[3px] accent-[var(--nb-primary)]" />
              Favorite
            </label>
          ) : null}
        </div>

        {error ? <p className="px-6 text-sm font-semibold" style={{ color: "var(--nb-danger)" }}>{error}</p> : null}

        <div className="nb-modal-footer">
          <button type="button" onClick={onClose} className="nb-btn nb-btn-surface nb-btn-sm">Cancel</button>
          <button type="submit" disabled={loading || !url.trim()} className="nb-btn nb-btn-primary nb-btn-sm">
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
