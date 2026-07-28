"use client";

import { useState } from "react";
import {
  BarChart3,
  Bell,
  Clock,
  FileText,
  Film,
  Heart,
  ImageIcon,
  Inbox,
  Layers,
  Newspaper,
  Pencil,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react";
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
  selectedMediaType?: string;
  selectedTag?: string;
  tags?: string[];
  onSelectFolder: (folderId: string) => void;
  onSelectMediaType?: (mediaType: string) => void;
  onSelectTag?: (tag: string) => void;
  onEditFolder?: (folder: FolderNode) => void;
  onCreateFolder?: () => void;
  onDropWebsite?: (folderId: string, websiteId: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
};

const globalViews = [
  { id: "all", label: "All Bookmarks", icon: Inbox },
  { id: "unsorted", label: "Unsorted", icon: Layers },
  { id: "favorite", label: "Favorites", icon: Heart },
  { id: "recent", label: "Recently Added", icon: Clock },
  { id: "visited", label: "Most Visited", icon: BarChart3 },
];

const mediaTypes = [
  { id: "article", label: "Articles", icon: Newspaper },
  { id: "image", label: "Images", icon: ImageIcon },
  { id: "video", label: "Videos", icon: Film },
  { id: "document", label: "Documents", icon: FileText },
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
        onDragEnter={(event) => { event.preventDefault(); setIsDropTarget(true); }}
        onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
        onDragLeave={() => setIsDropTarget(false)}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDropTarget(false);
          onDropWebsite?.(folder._id, event.dataTransfer.getData("application/x-wesite-website-id") || event.dataTransfer.getData("text/plain"));
        }}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        className={`nb-sidebar-item ${selectedFolder === folder._id ? "nb-sidebar-item-active" : ""} ${isDropTarget ? "nb-sidebar-item-active !border-[var(--nb-success)]" : ""}`}
      >
        <span className="grid size-6 shrink-0 place-items-center rounded-lg border-[3px] bg-white shadow-sm" style={{ borderColor: "var(--nb-border)" }}>
          <FolderIcon value={folder.icon} className="size-3.5" color={folder.color ?? "#3b82f6"} />
        </span>
        <span className="min-w-0 flex-1 truncate">{folder.name}</span>
        {folder.count !== undefined && folder.count > 0 ? (
          <span className="nb-tag text-[9px]">
            {folder.count}
          </span>
        ) : null}
      </button>
      {onEditFolder ? (
        <button
          type="button"
          aria-label={`Edit ${folder.name}`}
          onClick={() => onEditFolder(folder)}
          className="absolute right-1 top-1 grid size-6 place-items-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--nb-surface-alt)]"
        >
          <Pencil className="size-3" />
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
  selectedMediaType = "all",
  selectedTag = "",
  tags = [],
  onSelectFolder,
  onSelectMediaType,
  onSelectTag,
  onEditFolder,
  onCreateFolder,
  onDropWebsite,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="nb-sidebar hidden w-64 shrink-0 p-3 lg:block" style={{ borderRight: "3px solid var(--nb-border)" }}>
        <SidebarContent
          folders={folders}
          selectedFolder={selectedFolder}
          selectedMediaType={selectedMediaType}
          selectedTag={selectedTag}
          tags={tags}
          onSelectFolder={onSelectFolder}
          onSelectMediaType={onSelectMediaType}
          onSelectTag={onSelectTag}
          onEditFolder={onEditFolder}
          onCreateFolder={onCreateFolder}
          onDropWebsite={onDropWebsite}
        />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 backdrop-blur-sm lg:hidden" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onCloseMobile}>
          <aside
            className="h-full w-72 max-w-[85vw] border-r-3 p-3 shadow-2xl"
            style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                aria-label="Close sidebar"
                onClick={onCloseMobile}
                className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm"
              >
                <X className="size-4" />
              </button>
            </div>
            <SidebarContent
              folders={folders}
              selectedFolder={selectedFolder}
              selectedMediaType={selectedMediaType}
              selectedTag={selectedTag}
              tags={tags}
              onSelectFolder={(folderId) => { onSelectFolder(folderId); onCloseMobile?.(); }}
              onSelectMediaType={(type) => { onSelectMediaType?.(type); onCloseMobile?.(); }}
              onSelectTag={(tag) => { onSelectTag?.(tag); onCloseMobile?.(); }}
              onEditFolder={onEditFolder}
              onCreateFolder={onCreateFolder}
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
    <div className="flex h-full flex-col gap-5 overflow-y-auto">
      {/* Global Navigation Views */}
      <section>
        <h2 className="nb-tag mb-2 w-full">
          Organizer
        </h2>
        <div className="space-y-1">
          {globalViews.map((item) => {
            const Icon = item.icon;
            const isSelected = props.selectedFolder === item.id && !props.selectedTag;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => { props.onSelectTag?.(""); props.onSelectFolder(item.id); }}
                className={`nb-sidebar-item ${isSelected ? "nb-sidebar-item-active" : ""}`}
              >
                <Icon className={`size-4 ${isSelected ? "" : "opacity-60"}`} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="nb-tag mb-2 w-full">
          Insights
        </h2>
        <div className="space-y-1">
          <a
            href="/analytics"
            className="nb-sidebar-item"
          >
            <BarChart3 className="size-4 opacity-60" />
            <span className="min-w-0 flex-1 truncate">Analytics Dashboard</span>
          </a>
          <a
            href="/history"
            className="nb-sidebar-item"
          >
            <Clock className="size-4 opacity-60" />
            <span className="min-w-0 flex-1 truncate">Browsing History</span>
          </a>
          <a
            href="/monitoring"
            className="nb-sidebar-item"
          >
            <Bell className="size-4 opacity-60" />
            <span className="min-w-0 flex-1 truncate">Website Monitoring</span>
          </a>
        </div>
      </section>

      {/* Media Type Filters */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="nb-tag w-full">
            Media Types
          </h2>
          {props.selectedMediaType !== "all" ? (
            <button type="button" onClick={() => props.onSelectMediaType?.("all")} className="nb-btn nb-btn-primary nb-btn-sm">
              Reset
            </button>
          ) : null}
        </div>
        <div className="space-y-1">
          {mediaTypes.map((item) => {
            const Icon = item.icon;
            const isSelected = props.selectedMediaType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => props.onSelectMediaType?.(isSelected ? "all" : item.id)}
                className={`nb-sidebar-item ${isSelected ? "nb-sidebar-item-active" : ""}`}
              >
                <Icon className={`size-3.5 ${isSelected ? "" : "opacity-60"}`} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Collections / Folders Tree */}
      <section className="min-h-0 flex-1 overflow-y-auto">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="nb-tag w-full">
            Collections
          </h2>
          {props.onCreateFolder ? (
            <button
              type="button"
              onClick={props.onCreateFolder}
              className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm"
              title="Create Collection"
            >
              <Plus className="size-3.5" />
            </button>
          ) : null}
        </div>
        <div className="space-y-0.5">
          {props.folders.length ? (
            <FolderTree
              folders={props.folders}
              selectedFolder={props.selectedFolder}
              onSelectFolder={(folderId) => { props.onSelectTag?.(""); props.onSelectFolder(folderId); }}
              onEditFolder={props.onEditFolder}
              onDropWebsite={props.onDropWebsite}
            />
          ) : (
            <div className="px-2 py-3 text-center">
              <p className="text-xs" style={{ color: "var(--nb-muted)" }}>No collections yet</p>
              {props.onCreateFolder ? (
                <button type="button" onClick={props.onCreateFolder} className="nb-btn nb-btn-primary nb-btn-sm mt-2 w-full justify-center">
                  <Plus className="size-3" />
                  New Collection
                </button>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* Popular Tags */}
      {props.tags && props.tags.length > 0 ? (
        <section>
          <h2 className="nb-tag mb-2 w-full">
            Tags
          </h2>
          <div className="flex flex-wrap gap-1">
            {props.tags.slice(0, 10).map((tag) => {
              const isSelected = props.selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => props.onSelectTag?.(isSelected ? "" : tag)}
                  className={`nb-btn nb-btn-sm ${isSelected ? "nb-btn-primary" : "nb-btn-surface"}`}
                >
                  <Tag className="size-2.5 opacity-70" />
                  #{tag}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Trash View */}
      <section style={{ borderTop: "3px solid var(--nb-border)", paddingTop: "0.75rem" }}>
        <button
          type="button"
          onClick={() => { props.onSelectTag?.(""); props.onSelectFolder("trash"); }}
          className={`nb-sidebar-item ${props.selectedFolder === "trash" ? "nb-sidebar-item-active !bg-[var(--nb-danger)]" : ""}`}
        >
          <Trash2 className="size-4" />
          <span className="min-w-0 flex-1 truncate">Trash</span>
        </button>
      </section>
    </div>
  );
}
