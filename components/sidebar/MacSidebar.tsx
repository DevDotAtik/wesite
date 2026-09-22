"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  ChevronRight,
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
  Settings,
  SquareCheckBig,
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
  const [expanded, setExpanded] = useState(true);

  const hasChildren = Boolean(folder.children?.length);
  const isSelected = selectedFolder === folder._id;
  const indentStep = 14;

  return (
    <div className="group relative">
      {/* Expand/collapse is a sibling of the row button — a toggle nested
          inside the row button would be invalid HTML and unreachable by keyboard. */}
      {hasChildren ? (
        <button
          type="button"
          aria-label={expanded ? `Collapse ${folder.name}` : `Expand ${folder.name}`}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="absolute z-10 grid size-6 -translate-y-1/2 place-items-center rounded-lg hover:bg-[var(--nb-surface-alt)]"
          style={{ left: `${3 + depth * indentStep}px`, top: "50%" }}
        >
          <ChevronRight
            className={`size-3.5 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
            style={{ color: isSelected ? "var(--nb-primary-fg)" : "var(--nb-muted)" }}
          />
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => onSelectFolder(folder._id)}
        aria-current={isSelected ? "true" : undefined}
        onDragEnter={(event) => { event.preventDefault(); setIsDropTarget(true); }}
        onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
        onDragLeave={() => setIsDropTarget(false)}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDropTarget(false);
          onDropWebsite?.(folder._id, event.dataTransfer.getData("application/x-wesite-website-id") || event.dataTransfer.getData("text/plain"));
        }}
        style={{ paddingLeft: `${8 + depth * indentStep}px` }}
        className={`nb-sidebar-item ${isSelected ? "nb-sidebar-item-active" : ""} ${isDropTarget ? "nb-sidebar-item-active !border-[var(--nb-success)]" : ""}`}
      >
        <span className="grid w-3.5 shrink-0 place-items-center" aria-hidden="true" />
        <span className="grid size-6 shrink-0 place-items-center rounded-lg border-[3px] bg-[var(--nb-surface-strong)] shadow-sm" style={{ borderColor: "var(--nb-border)" }}>
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
      {hasChildren && expanded ? (
        <div className="relative">
          <span
            className="absolute bottom-3 top-0 w-px"
            style={{ left: `${15 + depth * indentStep}px`, background: "var(--nb-border)", opacity: 0.6 }}
          />
          <FolderTree
            folders={folder.children ?? []}
            depth={depth + 1}
            selectedFolder={selectedFolder}
            onSelectFolder={onSelectFolder}
            onEditFolder={onEditFolder}
            onDropWebsite={onDropWebsite}
          />
        </div>
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
  useEffect(() => {
    if (!mobileOpen) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseMobile?.();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen, onCloseMobile]);

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
            role="dialog"
            aria-modal="true"
            aria-label="Bookmark collections"
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
            {/* Pages — reachable only here on small screens */}
            <nav aria-label="Pages" className="mb-4 grid gap-0.5">
              {[
                { href: "/dashboard", label: "Library", icon: Inbox },
                { href: "/history", label: "History", icon: Clock },
                { href: "/todo", label: "Todo", icon: SquareCheckBig },
                { href: "/analytics", label: "Analytics", icon: BarChart3 },
                { href: "/monitoring", label: "Monitoring", icon: Bell },
                { href: "/settings", label: "Settings", icon: Settings },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className="nb-sidebar-item"
                >
                  <item.icon className="size-4 opacity-60" />
                  <span className="min-w-0 flex-1">{item.label}</span>
                </Link>
              ))}
            </nav>
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

function SectionHeader({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-1.5 flex min-h-6 items-center justify-between gap-2 px-3">
      <p className="nb-label">
        {children}
      </p>
      {action}
    </div>
  );
}

function SidebarContent(props: SidebarProps) {
  const totalSaved = props.folders.reduce((sum, folder) => sum + (folder.count ?? 0), 0);

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto">
      {/* Global Navigation Views */}
      <section>
        <SectionHeader>Organizer</SectionHeader>
        <div className="space-y-0.5">
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
                <Icon className={`size-4 shrink-0 ${isSelected ? "" : "opacity-60"}`} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Media Type Filters — only shown when the parent wires a handler,
          so the sidebar never shows filters that do nothing. */}
      {props.onSelectMediaType ? (
      <section>
        <SectionHeader
          action={props.selectedMediaType !== "all" ? (
            <button type="button" onClick={() => props.onSelectMediaType?.("all")} className="nb-btn nb-btn-ghost nb-btn-sm text-[10px]">
              Reset
            </button>
          ) : undefined}
        >
          Media Types
        </SectionHeader>
        <div className="space-y-0.5">
          {mediaTypes.map((item) => {
            const Icon = item.icon;
            const isSelected = props.selectedMediaType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => props.onSelectMediaType?.(isSelected ? "all" : item.id)}
                aria-pressed={isSelected}
                className={`nb-sidebar-item ${isSelected ? "nb-sidebar-item-active" : ""}`}
              >
                <Icon className={`size-3.5 shrink-0 ${isSelected ? "" : "opacity-60"}`} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>
      ) : null}

      {/* Collections / Folders Tree */}
      <section className="min-h-0 flex-1 overflow-y-auto">
        <SectionHeader
          action={
            <span className="flex items-center gap-2">
              {totalSaved > 0 ? (
                <span className="nb-tag text-[9px]">{totalSaved} saved</span>
              ) : null}
              {props.onCreateFolder ? (
                <button
                  type="button"
                  onClick={props.onCreateFolder}
                  aria-label="Create collection"
                  className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm"
                  title="Create Collection"
                >
                  <Plus className="size-3.5" />
                </button>
              ) : undefined}
            </span>
          }
        >
          Collections
        </SectionHeader>
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
          <SectionHeader>Tags</SectionHeader>
          <div className="flex flex-wrap gap-1 px-1">
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
