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
      <button type="button" aria-label={`Open ${name} folder`} onClick={() => onOpen(id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="nb-card-yellow grid size-11 shrink-0 place-items-center rounded-xl border-[3px]" style={{ borderColor: "var(--nb-border)", background: color, boxShadow: "2px 2px 0 0 var(--nb-shadow)" }}>
          <FolderIcon value={icon} className="size-5 text-white" color="#ffffff" />
        </span>
        <span className="min-w-0 flex-1 pr-16 sm:pr-2">
          <span className="block truncate text-sm font-bold" style={{ color: "var(--nb-fg)" }}>{name}</span>
          <span className="text-xs font-semibold" style={{ color: "var(--nb-muted)" }}>{count} {count === 1 ? "item" : "items"}</span>
        </span>
      </button>

      {/* Floating Action Pill - visible on mobile, hover on desktop */}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-100 pointer-events-auto sm:opacity-0 sm:pointer-events-none sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto transition-opacity duration-150 bg-[var(--nb-card)] p-1 rounded-xl border-2 border-[var(--nb-border)] shadow-nb-xs z-10">
        <button
          type="button"
          aria-label="Edit folder"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(id);
          }}
          className="grid size-7 place-items-center rounded-lg text-[var(--nb-muted)] hover:text-[var(--nb-fg)] hover:bg-[var(--nb-surface-alt)] transition-colors"
          title="Edit folder"
        >
          <Pencil className="size-3.5" />
        </button>
        {onDelete ? (
          <button
            type="button"
            aria-label="Delete folder"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            className="grid size-7 place-items-center rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
            title="Delete folder"
          >
            <Trash2 className="size-3.5" />
          </button>
        ) : null}
      </div>
    </article>
  );
}
