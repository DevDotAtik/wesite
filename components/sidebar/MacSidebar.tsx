"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Heart, Home, Inbox, Pencil, SquareCheckBig, Trash2, X } from "lucide-react";
import { FolderIcon } from "@/lib/folder-icons";

export type FolderNode = {
  _id: string;
  name: string;
  parentFolderId: string | null;
  color?: string;
  icon?: string;
  count?: number;
  children?: FolderNode[];
};

type SidebarProps = {
  folders: FolderNode[];
  selectedFolder: string;
  onSelectFolder: (folderId: string) => void;
  onEditFolder?: (folder: FolderNode) => void;
  onDropWebsite?: (folderId: string, websiteId: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
};

const favorites = [
  { id: "home", label: "Home", icon: Home },
  { id: "all", label: "All Websites", icon: Inbox },
  { id: "recent", label: "Recently Added", icon: Clock },
  { id: "visited", label: "Recently Visited", icon: Clock },
  { id: "favorite", label: "Most Loved", icon: Heart },
];

function FolderTree({
  folders,
  depth = 0,
  selectedFolder,
  onSelectFolder,
  onEditFolder,
  onDropWebsite,
}: {
  folders: FolderNode[];
  depth?: number;
  selectedFolder: string;
  onSelectFolder: (folderId: string) => void;
  onEditFolder?: (folder: FolderNode) => void;
  onDropWebsite?: (folderId: string, websiteId: string) => void;
}) {
  return (
    <>
      {folders.map((folder) => (
        <FolderTreeItem
          key={folder._id}
          folder={folder}
          depth={depth}
          selectedFolder={selectedFolder}
          onSelectFolder={onSelectFolder}
          onEditFolder={onEditFolder}
          onDropWebsite={onDropWebsite}
        />
      ))}
    </>
  );
}

function FolderTreeItem({
  folder,
  depth,
  selectedFolder,
  onSelectFolder,
  onEditFolder,
  onDropWebsite,
}: {
  folder: FolderNode;
  depth: number;
  selectedFolder: string;
  onSelectFolder: (folderId: string) => void;
  onEditFolder?: (folder: FolderNode) => void;
  onDropWebsite?: (folderId: string, websiteId: string) => void;
}) {
  const [isDropTarget, setIsDropTarget] = useState(false);

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => onSelectFolder(folder._id)}
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
            folder._id,
            event.dataTransfer.getData("application/x-wesite-website-id") || event.dataTransfer.getData("text/plain"),
          );
        }}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
        className={`flex h-8 w-full items-center gap-2 rounded-md pr-10 text-left text-sm transition ${
          isDropTarget
            ? "bg-blue-50 text-blue-700 ring-2 ring-blue-500/25 dark:bg-blue-500/10 dark:text-blue-200"
            : selectedFolder === folder._id
              ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200"
              : "text-zinc-700 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-white/10"
        }`}
      >
        <span className="grid size-5 shrink-0 place-items-center rounded-md bg-white ring-1 ring-zinc-300 dark:bg-zinc-950 dark:ring-white/10">
          <FolderIcon value={folder.icon} className="size-3.5" color={folder.color ?? "#3b82f6"} />
        </span>
        <span className="min-w-0 flex-1 truncate">{folder.name}</span>
        <span className="text-xs text-zinc-400">{folder.count ?? 0}</span>
      </button>
      {onEditFolder ? (
        <button
          type="button"
          aria-label={`Edit ${folder.name}`}
          onClick={() => onEditFolder(folder)}
          className="absolute right-1 top-1 grid size-6 place-items-center rounded-md text-zinc-400 opacity-0 transition hover:bg-zinc-100 hover:text-zinc-950 group-hover:opacity-100 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Pencil className="size-3.5" />
        </button>
      ) : null}
      {folder.children?.length ? (
        <FolderTree
          folders={folder.children}
          depth={depth + 1}
          selectedFolder={selectedFolder}
          onSelectFolder={onSelectFolder}
          onEditFolder={onEditFolder}
          onDropWebsite={onDropWebsite}
        />
      ) : null}
    </div>
  );
}

export default function MacSidebar({
  folders,
  selectedFolder,
  onSelectFolder,
  onEditFolder,
  onDropWebsite,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-zinc-300/80 bg-zinc-200/65 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/60 lg:block">
        <SidebarContent
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={onSelectFolder}
          onEditFolder={onEditFolder}
          onDropWebsite={onDropWebsite}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={onCloseMobile}>
          <aside
            className="h-full w-80 max-w-[86vw] border-r border-zinc-300 bg-zinc-200 p-3 shadow-2xl dark:border-white/10 dark:bg-zinc-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                aria-label="Close sidebar"
                onClick={onCloseMobile}
                className="grid size-8 place-items-center rounded-md hover:bg-zinc-200 dark:hover:bg-white/10"
              >
                <X className="size-4" />
              </button>
            </div>
            <SidebarContent
              folders={folders}
              selectedFolder={selectedFolder}
              onSelectFolder={(folderId) => {
                onSelectFolder(folderId);
                onCloseMobile?.();
              }}
              onEditFolder={onEditFolder}
              onDropWebsite={onDropWebsite}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}

function SidebarContent(props: SidebarProps) {
  return (
    <div className="flex h-full flex-col gap-5">
      <section>
        <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Favorites</h2>
        <div className="space-y-1">
          {favorites.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => props.onSelectFolder(item.id)}
                className={`flex h-8 w-full items-center gap-2 rounded-md px-3 text-left text-sm ${
                  props.selectedFolder === item.id
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200"
                    : "text-zinc-700 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-white/10"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </div>
        <Link
          href="/todo"
          className="mt-2 flex h-8 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-zinc-700 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-white/10"
        >
          <SquareCheckBig className="size-4" />
          Todo
        </Link>
      </section>

      <section className="min-h-0 flex-1 overflow-auto">
        <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Folders</h2>
        <div className="space-y-1">
          <FolderTree
            folders={props.folders}
            selectedFolder={props.selectedFolder}
            onSelectFolder={props.onSelectFolder}
            onEditFolder={props.onEditFolder}
            onDropWebsite={props.onDropWebsite}
          />
        </div>
      </section>

      <button
        type="button"
        onClick={() => props.onSelectFolder("trash")}
        className={`flex h-8 w-full items-center gap-2 rounded-md px-3 text-left text-sm ${
          props.selectedFolder === "trash"
            ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200"
            : "text-zinc-700 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-white/10"
        }`}
      >
        <Trash2 className="size-4" />
        Trash
      </button>
    </div>
  );
}
