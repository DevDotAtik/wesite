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
      onDragEnter={(event) => { event.preventDefault(); setIsDropTarget(true); }}
      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDropTarget(false);
        onDropWebsite?.(id, event.dataTransfer.getData("application/x-wesite-website-id") || event.dataTransfer.getData("text/plain"));
      }}
      className={`nb-card group relative flex items-stretch gap-3 p-4 text-left ${
        isDropTarget ? "!border-[var(--nb-success)] !bg-[var(--nb-surface-alt)] ring-2 ring-[var(--nb-success)]/25" : ""
      }`}
    >
      <button type="button" onClick={() => onOpen(id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="nb-card-yellow grid size-11 shrink-0 place-items-center rounded-xl border-[3px]" style={{ borderColor: "var(--nb-border)", background: color, boxShadow: "2px 2px 0 0 var(--nb-shadow)" }}>
          <FolderIcon value={icon} className="size-5 text-white" color="#ffffff" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold" style={{ color: "var(--nb-fg)" }}>{name}</span>
          <span className="text-xs font-semibold" style={{ color: "var(--nb-muted)" }}>{count} items</span>
        </span>
      </button>

      <button
        type="button"
        aria-label="Edit folder"
        onClick={() => onEdit(id)}
        className="absolute right-2 top-2 grid size-7 place-items-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--nb-surface-alt)]"
      >
        <Pencil className="size-3.5" />
      </button>
      {onDelete ? (
        <button
          type="button"
          aria-label="Delete folder"
          onClick={() => onDelete(id)}
          className="absolute right-10 top-2 grid size-7 place-items-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
          style={{ color: "var(--nb-danger)" }}
        >
          <Trash2 className="size-3.5" />
        </button>
      ) : null}
    </article>
  );
}
