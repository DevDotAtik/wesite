"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Bookmark, CheckSquare, Clock3, ClipboardPaste, FolderOpen, FolderPlus, Heart, Loader2, Move, Sparkles, Square, SquareCheckBig, Star, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/navbar";
import CommandPalette from "@/components/command-palette/CommandPalette";
import FolderCard from "@/components/grid/FolderCard";
import WebsiteCard, { type WebsiteItem } from "@/components/grid/WebsiteCard";
import AddWebsiteModal from "@/components/modals/AddWebsiteModal";
import FolderModal from "@/components/modals/FolderModal";
import MacSidebar, { type FolderNode } from "@/components/sidebar/MacSidebar";
import { type ThemePreference } from "@/lib/theme";

type User = {
  _id: string;
  name: string;
  email: string;
  themePreference?: ThemePreference;
};

const systemFolders = new Set(["home", "all", "recent", "visited", "favorite", "trash"]);

function flattenFolders(folders: FolderNode[]): FolderNode[] {
  return folders.flatMap((folder) => [folder, ...flattenFolders(folder.children ?? [])]);
}

function collectDescendantIds(folder: FolderNode | undefined): string[] {
  if (!folder?.children?.length) return [];
  return folder.children.flatMap((child) => [child._id, ...collectDescendantIds(child)]);
}

export default function WesiteApp() {
  const [user, setUser] = useState<User | null>(null);
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [websites, setWebsites] = useState<WebsiteItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("home");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [copiedWebsite, setCopiedWebsite] = useState<WebsiteItem | null>(null);
  const [editingWebsite, setEditingWebsite] = useState<WebsiteItem | null>(null);
  const [websiteMode, setWebsiteMode] = useState<"add" | "edit">("add");
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderNode | null>(null);
  const [folderMode, setFolderMode] = useState<"add" | "edit">("add");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [bulkFolderId, setBulkFolderId] = useState<string>("");
  const [bulkTags, setBulkTags] = useState("");
  const flatFolders = useMemo(() => flattenFolders(folders), [folders]);
  const selectedFolderNode = flatFolders.find((folder) => folder._id === selectedFolder);
  const visibleChildFolders = selectedFolderNode?.children ?? (selectedFolder === "home" ? folders : []);
  const canPasteHere = copiedWebsite && !["trash", "recent", "visited", "favorite"].includes(selectedFolder);
  const pasteTargetLabel = selectedFolderNode?.name ?? (selectedFolder === "home" || selectedFolder === "all" ? "All Websites" : "");
  const addWebsiteFolderId = systemFolders.has(selectedFolder) ? null : selectedFolder;
  const editableWebsiteFolderOptions = useMemo(
    () => [{ _id: "", name: "Unsorted" }, ...flatFolders.map((folder) => ({ _id: folder._id, name: folder.name }))],
    [flatFolders],
  );
  const folderOptionsForSelected = useMemo(() => flatFolders.map((folder) => ({ _id: folder._id, name: folder.name })), [flatFolders]);
  const editableFolderOptions = useMemo(() => {
    if (!editingFolder) return folderOptionsForSelected;
    const invalidIds = new Set([editingFolder._id, ...collectDescendantIds(flatFolders.find((folder) => folder._id === editingFolder._id))]);
    return folderOptionsForSelected.filter((folder) => !invalidIds.has(folder._id));
  }, [editingFolder, folderOptionsForSelected, flatFolders]);
  const activeWebsites = useMemo(() => websites.filter((website) => !website.isTrashed), [websites]);
  const mostLoved = useMemo(
    () =>
      [...activeWebsites]
        .sort((a, b) => {
          const favoriteDiff = Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite));
          if (favoriteDiff !== 0) return favoriteDiff;
          return (b.visitCount ?? 0) - (a.visitCount ?? 0) || new Date(b.lastVisitedAt ?? b.createdAt ?? 0).getTime() - new Date(a.lastVisitedAt ?? a.createdAt ?? 0).getTime();
        })
        .slice(0, 3),
    [activeWebsites],
  );
  const recentlyAdded = useMemo(
    () => [...activeWebsites].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()).slice(0, 3),
    [activeWebsites],
  );
  const recentlyVisited = useMemo(
    () => [...activeWebsites].sort((a, b) => new Date(b.lastVisitedAt ?? 0).getTime() - new Date(a.lastVisitedAt ?? 0).getTime()).slice(0, 3),
    [activeWebsites],
  );
  const showInsights = selectedFolder === "home" || selectedFolder === "all";
  const smartStats = useMemo(
    () => [
      { label: "Saved", value: activeWebsites.length, note: "Active bookmarks", icon: Bookmark, color: "var(--nb-bruto-yellow)" },
      { label: "Folders", value: flatFolders.length, note: "Organized spaces", icon: FolderOpen, color: "var(--nb-bruto-blue)" },
      { label: "Loved", value: activeWebsites.filter((website) => website.isFavorite).length, note: "Pinned by you", icon: Heart, color: "var(--nb-bruto-coral)" },
    ],
    [activeWebsites, flatFolders.length],
  );

  const loadFolders = useCallback(async () => {
    const response = await fetch("/api/folders");
    if (response.ok) {
      const payload = await response.json();
      setFolders(payload.folders ?? []);
    }
  }, []);

  const loadWebsites = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("limit", "120");
    if (selectedFolder === "trash") { params.set("trashed", "true"); params.set("sort", "trash"); }
    else if (selectedFolder === "favorite") { params.set("favorite", "true"); params.set("sort", "loved"); }
    else if (selectedFolder === "recent") { params.set("sort", "recent"); }
    else if (selectedFolder === "visited") { params.set("sort", "visited"); }
    else if (!["home", "all"].includes(selectedFolder)) { params.set("folderId", selectedFolder); params.set("sort", "smart"); }
    else { params.set("sort", "smart"); }

    const response = await fetch(`/api/websites?${params.toString()}`);
    if (response.ok) {
      const payload = await response.json();
      setWebsites(payload.websites ?? []);
    }
  }, [search, selectedFolder]);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    const me = await fetch("/api/auth/me");
    if (!me.ok) { setUser(null); setLoading(false); return; }
    const payload = await me.json();
    setUser(payload.user);
    await Promise.all([loadFolders(), loadWebsites()]);
    setLoading(false);
  }, [loadFolders, loadWebsites]);

  useEffect(() => { const timer = window.setTimeout(() => { bootstrap(); }, 0); return () => window.clearTimeout(timer); }, [bootstrap]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(true); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function createFolder() { setFolderMode("add"); setEditingFolder(null); setFolderModalOpen(true); }
  async function openWebsite(website: WebsiteItem) { window.open(website.url, "_blank", "noopener,noreferrer"); await fetch(`/api/websites/${website._id}/visit`, { method: "POST" }); loadWebsites(); }
  async function deleteWebsite(website: WebsiteItem) { const response = await fetch(`/api/websites/${website._id}`, { method: "DELETE" }); if (!response.ok) { toast.error("Could not move website to trash"); return; } toast.success("Moved to trash"); loadWebsites(); loadFolders(); }
  async function restoreWebsite(website: WebsiteItem) { const response = await fetch(`/api/websites/${website._id}/restore`, { method: "POST" }); if (!response.ok) { const payload = await response.json().catch(() => null); toast.error(payload?.error ?? "Could not restore website"); return; } toast.success("Restored website"); loadWebsites(); loadFolders(); }
  async function permanentlyDeleteWebsite(website: WebsiteItem) { const response = await fetch(`/api/websites/${website._id}/permanent`, { method: "DELETE" }); if (!response.ok) { toast.error("Could not delete website permanently"); return; } toast.success("Deleted permanently"); loadWebsites(); loadFolders(); }
  async function toggleFavorite(website: WebsiteItem) { await fetch(`/api/websites/${website._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isFavorite: !website.isFavorite }) }); loadWebsites(); }
  async function moveWebsiteToFolder(websiteId: string, folderId: string | null, successMessage = "Moved website") { if (!websiteId) return; const response = await fetch(`/api/websites/${websiteId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folderId }) }); if (!response.ok) { toast.error("Could not move website"); return; } toast.success(successMessage); loadWebsites(); loadFolders(); }
  async function moveDraggedWebsite(folderId: string, websiteId: string) { await moveWebsiteToFolder(websiteId, folderId); }
  async function copyWebsite(website: WebsiteItem) { setCopiedWebsite(website); try { await navigator.clipboard.writeText(website.url); } catch {} toast.success("Website copied. Select a folder and paste."); }
  function openWebsiteEditor(website: WebsiteItem) { setWebsiteMode("edit"); setEditingWebsite(website); setAddOpen(true); }
  function openWebsiteCreator() { setWebsiteMode("add"); setEditingWebsite(null); setAddOpen(true); }
  function openFolderEditor(folder: FolderNode) { setFolderMode("edit"); setEditingFolder(folder); setFolderModalOpen(true); }
  async function pasteCopiedWebsite() { if (!copiedWebsite) return; if (!canPasteHere) { toast.error("Select Home, All Websites, or a folder before pasting"); return; } const targetFolderId = selectedFolderNode ? selectedFolderNode._id : null; await moveWebsiteToFolder(copiedWebsite._id, targetFolderId, `Pasted into ${pasteTargetLabel}`); setCopiedWebsite(null); }
  async function deleteFolder(folder: FolderNode) { const confirmed = window.confirm(`Delete "${folder.name}"? Websites inside will be moved up a level.`); if (!confirmed) return; const response = await fetch(`/api/folders/${folder._id}`, { method: "DELETE" }); if (!response.ok) { toast.error("Could not delete folder"); return; } toast.success("Folder deleted"); loadFolders(); loadWebsites(); }

  function toggleSelect(id: string, selected: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds((prev) => {
      if (prev.size === websites.length) return new Set();
      return new Set(websites.map((w) => w._id));
    });
  }

  async function executeBulkAction(action: string) {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    const body: Record<string, unknown> = { ids, action };

    if (action === "move") {
      body.folderId = bulkFolderId || null;
    } else if (action === "favorite") {
      body.isFavorite = true;
    } else if (action === "tag") {
      const parsedTags = bulkTags.split(",").map((t) => t.trim()).filter(Boolean);
      if (!parsedTags.length) { toast.error("Add at least one tag"); return; }
      body.tags = parsedTags;
    }

    const response = await fetch("/api/websites/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error(payload?.error ?? "Bulk action failed");
      return;
    }

    toast.success(`${action} applied to ${ids.length} item${ids.length !== 1 ? "s" : ""}`);
    setSelectedIds(new Set());
    setBulkAction(null);
    setBulkFolderId("");
    setBulkTags("");
    loadWebsites();
    loadFolders();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        search={search}
        onSearchChange={setSearch}
        onAddWebsite={openWebsiteCreator}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
        onOpenCommand={() => setCommandOpen(true)}
        view={view}
        onViewChange={setView}
        userName={user?.name}
      />

      {!user && !loading ? (
        <main className="grid flex-1 place-items-center px-6">
          <div className="nb-card-static w-full max-w-sm p-6 text-center">
            <h1 className="text-lg font-extrabold" style={{ color: "var(--nb-fg)" }}>Sign in to Wesite</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--nb-muted)" }}>Your bookmark library is private to your account.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <a className="nb-btn nb-btn-primary" href="/login">Login</a>
              <a className="nb-btn nb-btn-surface" href="/register">Register</a>
            </div>
          </div>
        </main>
      ) : (
        <div className="flex min-h-0 flex-1">
          <MacSidebar
            folders={folders}
            selectedFolder={selectedFolder}
            onSelectFolder={setSelectedFolder}
            onEditFolder={openFolderEditor}
            onDropWebsite={moveDraggedWebsite}
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />

          <main className="min-w-0 flex-1 overflow-auto">
            {/* Breadcrumb */}
            <div className="border-b-3 px-4 py-3 backdrop-blur-sm sm:px-6" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold" style={{ color: "var(--nb-muted)" }}>
                <button type="button" onClick={() => setSelectedFolder("home")} className="hover:underline" style={{ color: "var(--nb-fg)" }}>All Websites</button>
                {selectedFolderNode ? (
                  <>
                    <span>/</span>
                    <span style={{ color: "var(--nb-fg)" }}>{selectedFolderNode.name}</span>
                  </>
                ) : selectedFolder !== "home" ? (
                  <>
                    <span>/</span>
                    <span className="capitalize" style={{ color: "var(--nb-fg)" }}>{selectedFolder}</span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* Page Header */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>{selectedFolderNode?.name ?? "Library"}</h1>
                  <p className="text-sm font-semibold" style={{ color: "var(--nb-muted)" }}>{activeWebsites.length} websites saved here</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={selectAll} className="nb-btn nb-btn-ghost nb-btn-sm">
                    {selectedIds.size === websites.length && websites.length > 0 ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
                    {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
                  </button>
                  <button type="button" onClick={createFolder} className="nb-btn nb-btn-surface nb-btn-sm">
                    <FolderPlus className="size-4" />
                    Folder
                  </button>
                  <button type="button" onClick={openWebsiteCreator} className="nb-btn nb-btn-primary nb-btn-sm">
                    <Sparkles className="size-4" />
                    Website
                  </button>
                  {copiedWebsite ? (
                    <button
                      type="button"
                      onClick={pasteCopiedWebsite}
                      disabled={!canPasteHere}
                      className="nb-btn nb-btn-accent nb-btn-sm disabled:opacity-50"
                      title={canPasteHere ? `Paste into ${pasteTargetLabel}` : "Select a folder first"}
                    >
                      <ClipboardPaste className="size-4" />
                      Paste here
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Bulk Action Bar */}
              {selectedIds.size > 0 ? (
                <div className="nb-card-static mb-5 p-3 flex flex-wrap items-center gap-2" style={{ background: "var(--nb-primary)", borderColor: "var(--nb-primary)" }}>
                  <span className="text-xs font-extrabold text-white">{selectedIds.size} selected</span>
                  <div className="flex flex-wrap items-center gap-1 ml-2">
                    <button type="button" onClick={() => { setBulkAction(bulkAction === "move" ? null : "move"); }} className={`nb-btn nb-btn-sm text-xs ${bulkAction === "move" ? "bg-white text-[var(--nb-primary)]" : "bg-white/20 text-white"}`}>
                      <Move className="size-3.5" /> Move
                    </button>
                    <button type="button" onClick={() => executeBulkAction("favorite")} className="nb-btn nb-btn-sm text-xs bg-white/20 text-white">
                      <Star className="size-3.5" /> Favorite
                    </button>
                    <button type="button" onClick={() => { setBulkAction(bulkAction === "tag" ? null : "tag"); }} className={`nb-btn nb-btn-sm text-xs ${bulkAction === "tag" ? "bg-white text-[var(--nb-primary)]" : "bg-white/20 text-white"}`}>
                      <Tag className="size-3.5" /> Tag
                    </button>
                    <button type="button" onClick={() => executeBulkAction("trash")} className="nb-btn nb-btn-sm text-xs bg-white/20 text-white" style={{ color: "#fff" }}>
                      <Trash2 className="size-3.5" /> Trash
                    </button>
                  </div>
                  <button type="button" onClick={() => { setSelectedIds(new Set()); setBulkAction(null); }} className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm ml-auto text-white">
                    <X className="size-4" />
                  </button>
                </div>
              ) : null}

              {/* Bulk Move Panel */}
              {bulkAction === "move" && selectedIds.size > 0 ? (
                <div className="nb-card-static mb-5 p-4" style={{ background: "var(--nb-surface-alt)" }}>
                  <div className="flex items-end gap-3">
                    <label className="block text-xs font-bold flex-1" style={{ color: "var(--nb-fg)" }}>
                      Move to folder
                      <select value={bulkFolderId} onChange={(e) => setBulkFolderId(e.target.value)} className="nb-input mt-1">
                        <option value="">Unsorted</option>
                        {flatFolders.map((folder) => (
                          <option key={folder._id} value={folder._id}>{folder.name}</option>
                        ))}
                      </select>
                    </label>
                    <button type="button" onClick={() => executeBulkAction("move")} className="nb-btn nb-btn-primary nb-btn-sm">
                      <Move className="size-4" /> Move {selectedIds.size}
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Bulk Tag Panel */}
              {bulkAction === "tag" && selectedIds.size > 0 ? (
                <div className="nb-card-static mb-5 p-4" style={{ background: "var(--nb-surface-alt)" }}>
                  <div className="flex items-end gap-3">
                    <label className="block text-xs font-bold flex-1" style={{ color: "var(--nb-fg)" }}>
                      Add tags (comma-separated)
                      <input value={bulkTags} onChange={(e) => setBulkTags(e.target.value)} placeholder="design, docs" className="nb-input mt-1" />
                    </label>
                    <button type="button" onClick={() => executeBulkAction("tag")} className="nb-btn nb-btn-primary nb-btn-sm">
                      <Tag className="size-4" /> Tag {selectedIds.size}
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Smart Insights */}
              {showInsights ? (
                <div className="mb-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <div className="nb-card-static p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold" style={{ color: "var(--nb-fg)" }}>Library overview</p>
                          <p className="mt-0.5 text-xs" style={{ color: "var(--nb-muted)" }}>Your workspace at a glance</p>
                        </div>
                        <span className="nb-tag" style={{ color: "var(--nb-primary)" }}>
                          <Sparkles className="size-3.5" />
                          Smart
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[var(--nb-border)]">
                        {smartStats.map((card) => (
                          <div key={card.label} className="flex items-center gap-3 sm:px-4 sm:first:pl-0 sm:last:pr-0">
                            <span className="grid size-11 shrink-0 place-items-center rounded-xl border-[3px]" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface-strong)" }}>
                              <card.icon className="size-5" style={{ color: card.color }} />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--nb-muted)" }}>{card.label}</p>
                              <p className="mt-0.5 text-2xl font-extrabold leading-none" style={{ color: "var(--nb-fg)" }}>{card.value}</p>
                              <p className="mt-1 truncate text-[10px] font-semibold" style={{ color: "var(--nb-muted)" }}>{card.note}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="nb-card-static p-4" style={{ background: "var(--nb-surface-alt)" }}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold" style={{ color: "var(--nb-fg)" }}>Smart lanes</p>
                        <p className="text-xs" style={{ color: "var(--nb-muted)" }}>Quick access to important bookmarks.</p>
                      </div>
                      <ArrowUpRight className="size-4" style={{ color: "var(--nb-primary)" }} />
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {[
                        { label: "Most loved", icon: Sparkles, items: mostLoved },
                        { label: "Recently added", icon: Clock3, items: recentlyAdded },
                        { label: "Recently visited", icon: SquareCheckBig, items: recentlyVisited },
                      ].map((lane) => (
                        <div key={lane.label} className="nb-card-sm p-3">
                          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                            <lane.icon className="size-3.5" style={{ color: "var(--nb-primary)" }} />
                            {lane.label}
                          </div>
                          <div className="mt-3 space-y-1.5">
                            {lane.items.map((website) => (
                              <button
                                key={website._id}
                                type="button"
                                onClick={() => openWebsite(website)}
                                className="nb-sidebar-item text-xs py-1.5"
                              >
                                <span className="nb-card-yellow grid size-6 shrink-0 place-items-center rounded-lg border text-[9px] font-extrabold" style={{ borderColor: "var(--nb-border)" }}>
                                  {(website.title || website.domain || "W").charAt(0).toUpperCase()}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate">{website.title || website.domain}</span>
                                  <span className="block truncate text-[10px]" style={{ color: "var(--nb-muted)" }}>{website.domain}</span>
                                </span>
                              </button>
                            ))}
                            {!lane.items.length ? <p className="text-[10px] font-semibold" style={{ color: "var(--nb-muted)" }}>Nothing here yet.</p> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Loading */}
              {loading ? (
                <div className="grid min-h-72 place-items-center">
                  <Loader2 className="size-8 animate-spin" style={{ color: "var(--nb-primary)" }} />
                </div>
              ) : (
                <>
                  {/* Folder Cards */}
                  {visibleChildFolders.length ? (
                    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {visibleChildFolders.map((folder) => (
                        <FolderCard
                          key={folder._id}
                          id={folder._id}
                          name={folder.name}
                          color={folder.color}
                          icon={folder.icon}
                          count={folder.count}
                          onOpen={setSelectedFolder}
                          onEdit={() => openFolderEditor(folder)}
                          onDelete={() => deleteFolder(folder)}
                          onDropWebsite={moveDraggedWebsite}
                        />
                      ))}
                    </div>
                  ) : null}

                  {/* Website Cards */}
                  {websites.length ? (
                    <div className={view === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" : "space-y-2"}>
                      {websites.map((website) => (
                        <WebsiteCard
                          key={website._id}
                          website={website}
                          view={view}
                          mode={selectedFolder === "trash" ? "trash" : "normal"}
                          selected={selectedIds.has(website._id)}
                          onSelect={selectedFolder !== "trash" ? toggleSelect : undefined}
                          onOpen={openWebsite}
                          onEdit={openWebsiteEditor}
                          onCopy={copyWebsite}
                          onDelete={deleteWebsite}
                          onToggleFavorite={toggleFavorite}
                          onRestore={restoreWebsite}
                          onPermanentDelete={permanentlyDeleteWebsite}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="nb-card-static grid min-h-72 place-items-center border-dashed text-center" style={{ borderStyle: "dashed" }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: "var(--nb-fg)" }}>{selectedFolder === "trash" ? "Trash is empty" : "No websites here yet"}</p>
                        <button type="button" onClick={openWebsiteCreator} className="nb-btn nb-btn-primary nb-btn-sm mt-4">
                          Add Website
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      )}

      <AddWebsiteModal
        open={addOpen}
        mode={websiteMode}
        onClose={() => setAddOpen(false)}
        onSaved={() => { loadWebsites(); loadFolders(); }}
        website={editingWebsite}
        folderId={addWebsiteFolderId}
        folders={editableWebsiteFolderOptions}
      />
      <FolderModal
        open={folderModalOpen}
        mode={folderMode}
        onClose={() => setFolderModalOpen(false)}
        onSaved={() => { loadFolders(); loadWebsites(); }}
        folders={editableFolderOptions}
        initialFolder={editingFolder}
        defaultParentFolderId={systemFolders.has(selectedFolder) ? null : selectedFolder}
      />
      <CommandPalette open={commandOpen} websites={websites} onClose={() => setCommandOpen(false)} onOpenWebsite={openWebsite} />
    </div>
  );
}
