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

  if (!open) {
    return null;
  }

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
              tags: tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
              notes: notes.trim(),
              customIconUrl: customIconUrl.trim(),
              folderId: websiteFolderId || null,
              isFavorite,
            }
          : {
              url: url.trim(),
              folderId: websiteFolderId || null,
            },
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
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-0 sm:place-items-center sm:p-6">
      <form
        onSubmit={submit}
        className="min-h-[45vh] w-full rounded-t-lg border border-zinc-300 bg-zinc-50 p-5 shadow-2xl dark:border-white/10 dark:bg-zinc-950 sm:min-h-0 sm:max-w-2xl sm:rounded-lg"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">{isEdit ? "Customize Website" : "Add Website"}</h2>
            {isEdit && website ? (
              <p className="mt-1 max-w-md truncate text-xs text-zinc-500">{website.url}</p>
            ) : null}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="grid size-8 place-items-center rounded-md hover:bg-zinc-100 dark:hover:bg-white/10">
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 sm:col-span-2">
            URL
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              autoFocus
              placeholder="https://example.com"
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/10"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Website title"
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/10"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Folder
            <select
              value={websiteFolderId}
              onChange={(event) => setWebsiteFolderId(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/10"
            >
              {folderOptions.map((option) => (
                <option key={option._id} value={option._id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 sm:col-span-2">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Short note about this site"
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/10"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Tags
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="design, docs, inspiration"
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/10"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Custom Icon URL
            <input
              value={customIconUrl}
              onChange={(event) => setCustomIconUrl(event.target.value)}
              placeholder="https://..."
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/10"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 sm:col-span-2">
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="Private notes"
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/10"
            />
          </label>
        </div>

        {isEdit && customIconUrl ? (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-zinc-500">Icon preview</span>
            <Image
              src={customIconUrl}
              alt=""
              width={28}
              height={28}
              className="size-7 rounded-md border border-zinc-300 bg-white object-cover dark:border-white/10"
              unoptimized
            />
          </div>
        ) : null}

        {isEdit ? (
          <label className="mt-4 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={isFavorite}
              onChange={(event) => setIsFavorite(event.target.checked)}
              className="size-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            Favorite
          </label>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-md px-4 text-sm hover:bg-zinc-100 dark:hover:bg-white/10">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !url.trim()}
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
