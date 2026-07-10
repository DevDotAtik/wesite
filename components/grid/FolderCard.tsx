"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { FolderIcon } from "@/lib/folder-icons";

type FolderCardProps = {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  count?: number;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete?: (id: string) => void;
  onDropWebsite?: (id: string, websiteId: string) => void;
};

export default function FolderCard({ id, name, color = "#3b82f6", icon, count = 0, onOpen, onEdit, onDelete, onDropWebsite }: FolderCardProps) {
  const [isDropTarget, setIsDropTarget] = useState(false);

  return (
    <article
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDropTarget(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDropTarget(false);
        onDropWebsite?.(
          id,
          event.dataTransfer.getData("application/x-wesite-website-id") || event.dataTransfer.getData("text/plain"),
        );
      }}
      className={`group relative flex items-stretch gap-3 rounded-lg border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-zinc-900 ${
        isDropTarget
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/25 dark:bg-blue-500/10"
          : "border-zinc-300 bg-zinc-50"
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(id)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white ring-1 ring-zinc-300 dark:bg-zinc-950 dark:ring-white/10">
          <FolderIcon value={icon} className="size-5" color={color} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-zinc-950 dark:text-white">{name}</span>
          <span className="text-xs text-zinc-500">{count} items</span>
        </span>
      </button>

        <button
          type="button"
          aria-label="Edit folder"
          onClick={() => onEdit(id)}
          className="absolute right-2 top-2 grid size-7 place-items-center rounded-md bg-white/80 text-zinc-500 opacity-0 shadow-sm ring-1 ring-zinc-200 transition group-hover:opacity-100 hover:text-zinc-950 dark:bg-zinc-950/80 dark:ring-white/10 dark:hover:text-white"
        >
          <Pencil className="size-3.5" />
        </button>
      {onDelete ? (
        <button
          type="button"
          aria-label="Delete folder"
          onClick={() => onDelete(id)}
          className="absolute right-10 top-2 grid size-7 place-items-center rounded-md bg-white/80 text-red-500 opacity-0 shadow-sm ring-1 ring-zinc-200 transition group-hover:opacity-100 hover:text-red-600 dark:bg-zinc-950/80 dark:ring-white/10 dark:hover:text-red-400"
        >
          <Trash2 className="size-3.5" />
        </button>
      ) : null}
    </article>
  );
}
