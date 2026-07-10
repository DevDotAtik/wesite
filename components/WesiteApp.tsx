"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Clock3, ClipboardPaste, FolderPlus, Loader2, Sparkles, SquareCheckBig } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/navbar";
import CommandPalette from "@/components/command-palette/CommandPalette";
import FolderCard from "@/components/grid/FolderCard";
import WebsiteCard, { type WebsiteItem } from "@/components/grid/WebsiteCard";
import AddWebsiteModal from "@/components/modals/AddWebsiteModal";
import FolderModal from "@/components/modals/FolderModal";
import MacSidebar, { type FolderNode } from "@/components/sidebar/MacSidebar";
import { applyThemePreference, type ThemePreference } from "@/lib/theme";

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
  if (!folder?.children?.length) {
    return [];
  }

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
    if (!editingFolder) {
      return folderOptionsForSelected;
    }

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
      { label: "Saved", value: activeWebsites.length, note: "Active bookmarks" },
      { label: "Folders", value: flatFolders.length, note: "Organized spaces" },
      { label: "Loved", value: activeWebsites.filter((website) => website.isFavorite).length, note: "Pinned by you" },
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

    if (selectedFolder === "trash") {
      params.set("trashed", "true");
      params.set("sort", "trash");
    } else if (selectedFolder === "favorite") {
      params.set("favorite", "true");
      params.set("sort", "loved");
    } else if (selectedFolder === "recent") {
      params.set("sort", "recent");
    } else if (selectedFolder === "visited") {
      params.set("sort", "visited");
    } else if (!["home", "all"].includes(selectedFolder)) {
      params.set("folderId", selectedFolder);
      params.set("sort", "smart");
    } else {
      params.set("sort", "smart");
    }

    const response = await fetch(`/api/websites?${params.toString()}`);
    if (response.ok) {
      const payload = await response.json();
      setWebsites(payload.websites ?? []);
    }
  }, [search, selectedFolder]);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    const me = await fetch("/api/auth/me");

    if (!me.ok) {
      setUser(null);
      setLoading(false);
      return;
    }

    const payload = await me.json();
    setUser(payload.user);
    if (payload.user?.themePreference) {
      applyThemePreference(payload.user.themePreference);
    }
    await Promise.all([loadFolders(), loadWebsites()]);
    setLoading(false);
  }, [loadFolders, loadWebsites]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      bootstrap();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [bootstrap]);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => {
      loadWebsites();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadWebsites, user]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function createFolder() {
    setFolderMode("add");
    setEditingFolder(null);
    setFolderModalOpen(true);
  }

  async function openWebsite(website: WebsiteItem) {
    window.open(website.url, "_blank", "noopener,noreferrer");
    await fetch(`/api/websites/${website._id}/visit`, { method: "POST" });
    loadWebsites();
  }

  async function deleteWebsite(website: WebsiteItem) {
    const response = await fetch(`/api/websites/${website._id}`, { method: "DELETE" });

    if (!response.ok) {
      toast.error("Could not move website to trash");
      return;
    }

    toast.success("Moved to trash");
    loadWebsites();
    loadFolders();
  }

  async function restoreWebsite(website: WebsiteItem) {
    const response = await fetch(`/api/websites/${website._id}/restore`, { method: "POST" });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error(payload?.error ?? "Could not restore website");
      return;
    }

    toast.success("Restored website");
    loadWebsites();
    loadFolders();
  }

  async function permanentlyDeleteWebsite(website: WebsiteItem) {
    const response = await fetch(`/api/websites/${website._id}/permanent`, { method: "DELETE" });

    if (!response.ok) {
      toast.error("Could not delete website permanently");
      return;
    }

    toast.success("Deleted permanently");
    loadWebsites();
    loadFolders();
  }

  async function toggleFavorite(website: WebsiteItem) {
    await fetch(`/api/websites/${website._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !website.isFavorite }),
    });
    loadWebsites();
  }

  async function moveWebsiteToFolder(websiteId: string, folderId: string | null, successMessage = "Moved website") {
    if (!websiteId) return;

    const response = await fetch(`/api/websites/${websiteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId }),
    });

    if (!response.ok) {
      toast.error("Could not move website");
      return;
    }

    toast.success(successMessage);
    loadWebsites();
    loadFolders();
  }

  async function moveDraggedWebsite(folderId: string, websiteId: string) {
    await moveWebsiteToFolder(websiteId, folderId);
  }

  async function copyWebsite(website: WebsiteItem) {
    setCopiedWebsite(website);

    try {
      await navigator.clipboard.writeText(website.url);
    } catch {
      // Browser clipboard permission can fail, but in-app paste still works.
    }

    toast.success("Website copied. Select a folder and paste.");
  }

  function openWebsiteEditor(website: WebsiteItem) {
    setWebsiteMode("edit");
    setEditingWebsite(website);
    setAddOpen(true);
  }

  function openWebsiteCreator() {
    setWebsiteMode("add");
    setEditingWebsite(null);
    setAddOpen(true);
  }

  function openFolderEditor(folder: FolderNode) {
    setFolderMode("edit");
    setEditingFolder(folder);
    setFolderModalOpen(true);
  }

  async function pasteCopiedWebsite() {
    if (!copiedWebsite) return;

    if (!canPasteHere) {
      toast.error("Select Home, All Websites, or a folder before pasting");
      return;
    }

    const targetFolderId = selectedFolderNode ? selectedFolderNode._id : null;
    await moveWebsiteToFolder(copiedWebsite._id, targetFolderId, `Pasted into ${pasteTargetLabel}`);
    setCopiedWebsite(null);
  }

  async function deleteFolder(folder: FolderNode) {
    const confirmed = window.confirm(`Delete "${folder.name}"? Websites inside will be moved up a level.`);

    if (!confirmed) return;

    const response = await fetch(`/api/folders/${folder._id}`, { method: "DELETE" });

    if (!response.ok) {
      toast.error("Could not delete folder");
      return;
    }

    toast.success("Folder deleted");
    loadFolders();
    loadWebsites();
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
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
          <div className="w-full max-w-sm rounded-lg border border-zinc-300 bg-zinc-50 p-6 text-center shadow-lg shadow-zinc-300/50 dark:border-white/10 dark:bg-zinc-900 dark:shadow-black/30">
            <h1 className="text-lg font-semibold">Sign in to Wesite</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Your bookmark library is private to your account.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <a className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white" href="/login">
                Login
              </a>
              <a className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-white/10 dark:bg-transparent dark:hover:bg-white/10" href="/register">
                Register
              </a>
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
            <div className="border-b border-black/10 bg-white/60 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-white/5 sm:px-6">
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                <button type="button" onClick={() => setSelectedFolder("home")} className="hover:text-blue-600">
                  All Websites
                </button>
                {selectedFolderNode ? (
                  <>
                    <span>/</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{selectedFolderNode.name}</span>
                  </>
                ) : selectedFolder !== "home" ? (
                  <>
                    <span>/</span>
                    <span className="font-medium text-zinc-900 dark:text-white capitalize">{selectedFolder}</span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold">{selectedFolderNode?.name ?? "Library"}</h1>
                  <p className="text-sm text-zinc-500">{activeWebsites.length} websites saved here</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={createFolder}
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-black/10 bg-white px-3 text-sm font-medium shadow-sm hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-white/10"
                  >
                    <FolderPlus className="size-4" />
                    Folder
                  </button>
                  <button
                    type="button"
                    onClick={openWebsiteCreator}
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                  >
                    <Sparkles className="size-4" />
                    Website
                  </button>
                </div>
                {copiedWebsite ? (
                  <button
                    type="button"
                    onClick={pasteCopiedWebsite}
                    disabled={!canPasteHere}
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20 dark:disabled:border-white/10 dark:disabled:bg-white/5 dark:disabled:text-zinc-500"
                    title={canPasteHere ? `Paste ${copiedWebsite.title || copiedWebsite.domain} into ${pasteTargetLabel}` : "Select Home, All Websites, or a folder first"}
                  >
                    <ClipboardPaste className="size-4" />
                    Paste here
                  </button>
                  ) : null}
              </div>

              {showInsights ? (
                <div className="mb-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {smartStats.map((card) => (
                      <div key={card.label} className="rounded-3xl border border-black/10 bg-[color:var(--surface-strong)] p-4 shadow-sm dark:border-white/10">
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{card.label}</p>
                        <p className="mt-2 text-3xl font-semibold">{card.value}</p>
                        <p className="mt-1 text-sm text-[color:var(--muted)]">{card.note}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-3 rounded-3xl border border-black/10 bg-[color:var(--surface-strong)] p-4 shadow-sm dark:border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">Smart lanes</p>
                        <p className="text-xs text-[color:var(--muted)]">Quick access to the bookmarks that matter most.</p>
                      </div>
                      <ArrowUpRight className="size-4 text-blue-600" />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {[
                        { label: "Most loved", icon: Sparkles, items: mostLoved },
                        { label: "Recently added", icon: Clock3, items: recentlyAdded },
                        { label: "Recently visited", icon: SquareCheckBig, items: recentlyVisited },
                      ].map((lane) => (
                        <div key={lane.label} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <lane.icon className="size-4 text-blue-600" />
                            {lane.label}
                          </div>
                          <div className="mt-3 space-y-2">
                            {lane.items.map((website) => (
                              <button
                                key={website._id}
                                type="button"
                                onClick={() => openWebsite(website)}
                                className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-black/5 dark:hover:bg-white/10"
                              >
                                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-blue-600 text-[11px] font-semibold text-white">
                                  {(website.title || website.domain || "W").charAt(0).toUpperCase()}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm">{website.title || website.domain}</span>
                                  <span className="block truncate text-xs text-[color:var(--muted)]">{website.domain}</span>
                                </span>
                              </button>
                            ))}
                            {!lane.items.length ? <p className="text-xs text-[color:var(--muted)]">Nothing here yet.</p> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {loading ? (
                <div className="grid min-h-72 place-items-center">
                  <Loader2 className="size-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
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

                  {websites.length ? (
                    <div className={view === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" : "space-y-2"}>
                      {websites.map((website) => (
                        <WebsiteCard
                          key={website._id}
                          website={website}
                          view={view}
                          mode={selectedFolder === "trash" ? "trash" : "normal"}
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
                    <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-black/10 bg-white/50 text-center dark:border-white/10 dark:bg-white/5">
                      <div>
                        <p className="text-sm font-medium">{selectedFolder === "trash" ? "Trash is empty" : "No websites here yet"}</p>
                        <button type="button" onClick={openWebsiteCreator} className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white">
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
        onSaved={() => {
          loadWebsites();
          loadFolders();
        }}
        website={editingWebsite}
        folderId={addWebsiteFolderId}
        folders={editableWebsiteFolderOptions}
      />
      <FolderModal
        open={folderModalOpen}
        mode={folderMode}
        onClose={() => setFolderModalOpen(false)}
        onSaved={() => {
          loadFolders();
          loadWebsites();
        }}
        folders={editableFolderOptions}
        initialFolder={editingFolder}
        defaultParentFolderId={systemFolders.has(selectedFolder) ? null : selectedFolder}
      />
      <CommandPalette open={commandOpen} websites={websites} onClose={() => setCommandOpen(false)} onOpenWebsite={openWebsite} />
    </div>
  );
}
