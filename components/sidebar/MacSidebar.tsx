"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  Workflow,
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

  const isChildSelected = useMemo(() => {
    function checkDescendant(node: FolderNode): boolean {
      if (node._id === selectedFolder) return true;
      return node.children?.some(checkDescendant) ?? false;
    }
    return folder.children?.some(checkDescendant) ?? false;
  }, [folder.children, selectedFolder]);

  // Adjust expanded state during render when a child becomes selected
  const [prevChildSelected, setPrevChildSelected] = useState(isChildSelected);
  if (isChildSelected !== prevChildSelected) {
    setPrevChildSelected(isChildSelected);
    if (isChildSelected) {
      setExpanded(true);
    }
  }

  return (
    <div className="relative">
      {/* Folder Row Item */}
      <div
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
            event.dataTransfer.getData("application/x-wesite-website-id") ||
              event.dataTransfer.getData("text/plain"),
          );
        }}
        className={`group relative flex items-center justify-between rounded-xl px-2 py-1.5 transition-all ${
          isSelected
            ? "nb-sidebar-item-active"
            : "hover:bg-[var(--nb-surface-alt)] text-[var(--nb-fg)]"
        } ${
          isDropTarget
            ? "nb-sidebar-item-active !border-[var(--nb-success)] ring-2 ring-[var(--nb-success)]/40"
            : ""
        }`}
      >
        {/* Main Folder Selection Button */}
        <button
          type="button"
          onClick={() => {
            onSelectFolder(folder._id);
            if (hasChildren && !expanded) {
              setExpanded(true);
            }
          }}
          aria-current={isSelected ? "true" : undefined}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span
            className={`grid ${
              depth === 0 ? "size-6" : "size-5"
            } shrink-0 place-items-center rounded-md border-2 bg-[var(--nb-surface-strong)] shadow-xs`}
            style={{ borderColor: "var(--nb-border)" }}
          >
            <FolderIcon
              value={folder.icon}
              className={depth === 0 ? "size-3.5" : "size-3"}
              color={folder.color ?? "#6366f1"}
            />
          </span>
          <span
            className={`min-w-0 flex-1 truncate text-xs ${
              depth === 0 ? "font-semibold" : "font-medium"
            }`}
          >
            {folder.name}
          </span>
        </button>

        {/* Right side controls: Count, Edit Pencil, Expand Chevron */}
        <div className="flex items-center gap-1 shrink-0 pl-1.5">
          {folder.count !== undefined && folder.count > 0 ? (
            <span
              className={`nb-tag text-[9px] px-1.5 py-0.2 shrink-0 ${
                isSelected ? "bg-white/20 text-white border-white/30" : ""
              }`}
            >
              {folder.count}
            </span>
          ) : null}

          {onEditFolder ? (
            <button
              type="button"
              aria-label={`Edit ${folder.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onEditFolder(folder);
              }}
              className={`grid size-6 place-items-center rounded-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--nb-surface-alt)] ${
                isSelected
                  ? "text-white hover:bg-white/20"
                  : "text-[var(--nb-muted)] hover:text-[var(--nb-fg)]"
              }`}
              title="Edit folder"
            >
              <Pencil className="size-3" />
            </button>
          ) : null}

          {/* Reference Image Style Chevron on Right */}
          {hasChildren ? (
            <button
              type="button"
              aria-label={expanded ? `Collapse ${folder.name}` : `Expand ${folder.name}`}
              aria-expanded={expanded}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => !prev);
              }}
              className={`grid size-6 place-items-center rounded-md transition-colors hover:bg-[var(--nb-surface-alt)] ${
                isSelected
                  ? "text-white hover:bg-white/20"
                  : "text-[var(--nb-muted)] hover:text-[var(--nb-fg)]"
              }`}
              title={expanded ? "Collapse" : "Expand"}
            >
              <ChevronRight
                className={`size-3.5 transition-transform duration-200 ${
                  expanded ? "rotate-90" : ""
                }`}
              />
            </button>
          ) : null}
        </div>
      </div>

      {/* Nested Children Tree (Matches reference image with connector branch lines) */}
      {hasChildren && expanded ? (
        <div className="relative ml-3.5 pl-3 my-0.5 space-y-0.5 border-l-2 border-[var(--nb-border)]/20 dark:border-white/15">
          {folder.children?.map((child) => (
            <div key={child._id} className="relative">
              {/* Horizontal branch line connecting to the vertical border line */}
              <span
                className="absolute -left-3 top-4 w-2.5 h-px bg-[var(--nb-border)]/25 dark:bg-white/15"
                aria-hidden="true"
              />
              <FolderTreeItem
                folder={child}
                depth={depth + 1}
                selectedFolder={selectedFolder}
                onSelectFolder={onSelectFolder}
                onEditFolder={onEditFolder}
                onDropWebsite={onDropWebsite}
              />
            </div>
          ))}
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
      <aside
        className="nb-sidebar sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 flex-col overflow-y-auto overflow-x-hidden p-3 scrollbar-thin lg:flex"
        style={{ borderRight: "3px solid var(--nb-border)" }}
      >
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
            className="flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto overflow-x-hidden border-r-3 p-3 shadow-2xl scrollbar-thin"
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
                { href: "/news", label: "News Feed", icon: Newspaper },
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
    <div className="flex flex-col gap-5 pb-6">
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
          <Link
            href="/webflow"
            className="nb-sidebar-item flex items-center gap-2 group"
          >
            <Workflow className="size-4 shrink-0 text-indigo-500 group-hover:scale-110 transition-transform" />
            <span className="min-w-0 flex-1 truncate font-bold text-indigo-600 dark:text-indigo-400">WebFlow Studio</span>
            <span className="rounded bg-indigo-100 dark:bg-indigo-950 px-1 py-0.2 text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">NEW</span>
          </Link>
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
      <section className="flex flex-col">
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
                  className="grid size-6 place-items-center rounded-md text-[var(--nb-muted)] transition-all hover:bg-[var(--nb-surface-alt)] hover:text-[var(--nb-fg)] active:scale-90"
                  title="New collection"
                >
                  <Plus className="size-4 stroke-[2.2]" />
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
