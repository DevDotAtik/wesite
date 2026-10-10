"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  Search,
  Play,
  Zap,
  GitFork,
  ArrowRightToLine,
  ArrowLeftToLine,
  StickyNote,
  Clock,
  ArrowUpDown,
  CheckCircle2,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  Bookmark,
  Folder as FolderIcon,
  FolderOpen,
  Filter,
} from "lucide-react";
import { AIIcon } from "./AIIcon";
import type { WebFlowNodeKind, WebFlowNodeData } from "@/lib/webflow/types";

interface SavedFolder {
  _id: string;
  name: string;
  color?: string;
  icon?: string;
  count: number;
}

interface SavedWebsite {
  _id: string;
  title: string;
  url: string;
  domain?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
  description?: string;
  tags?: string[];
  folderId?: string | null;
}

interface WebFlowSidebarProps {
  onAddNode: (nodeType: string, initialData: WebFlowNodeData) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function WebFlowSidebar({ onAddNode, isOpen, onToggle }: WebFlowSidebarProps) {
  const [activeTab, setActiveTab] = useState<"blocks" | "websites">("blocks");
  const [websites, setWebsites] = useState<SavedWebsite[]>([]);
  const [folders, setFolders] = useState<SavedFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loadingWebsites, setLoadingWebsites] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let ignore = false;
    if (activeTab === "websites" && websites.length === 0) {
      const load = async () => {
        setLoadingWebsites(true);
        try {
          const [sitesRes, foldersRes] = await Promise.all([
            fetch("/api/websites?limit=100"),
            fetch("/api/folders"),
          ]);

          if (sitesRes.ok) {
            const data = await sitesRes.json();
            if (!ignore) setWebsites(data.websites || []);
          }

          if (foldersRes.ok) {
            const folderData = await foldersRes.json();
            if (!ignore) setFolders(folderData.flatFolders || folderData.folders || []);
          }
        } catch {
          if (!ignore) {
            setWebsites([]);
            setFolders([]);
          }
        } finally {
          if (!ignore) setLoadingWebsites(false);
        }
      };
      load();
    }
    return () => {
      ignore = true;
    };
  }, [activeTab, websites.length]);

  const onDragStart = (
    event: React.DragEvent,
    nodeType: string,
    nodeData: Record<string, unknown>
  ) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ type: nodeType, data: nodeData })
    );
    event.dataTransfer.effectAllowed = "move";
  };

  const toggleFolderCollapse = (folderId: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const genericBlocks = [
    {
      type: "startNode",
      kind: "start" as WebFlowNodeKind,
      title: "Start Trigger",
      desc: "Workflow manual entry or trigger point",
      icon: Play,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950",
      defaultData: { label: "Start", kind: "start", description: "Entry Trigger" },
    },
    {
      type: "actionNode",
      kind: "action" as WebFlowNodeKind,
      title: "Action / Task",
      desc: "Execute a generic manual or system action",
      icon: Zap,
      color: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950",
      defaultData: {
        label: "Execute Task",
        kind: "action",
        action: "Perform Action",
        actionDescription: "Details of this action",
      },
    },
    {
      type: "aiNode",
      kind: "ai" as WebFlowNodeKind,
      title: "AI Agent Step",
      desc: "LLM reasoning prompt or autonomous browser step",
      icon: AIIcon,
      color: "text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-950",
      defaultData: {
        label: "AI Reasoning",
        kind: "ai",
        action: "Analyze & Generate",
        instructions: "Analyze input data and generate structured output",
      },
    },
    {
      type: "conditionNode",
      kind: "condition" as WebFlowNodeKind,
      title: "Condition Branch",
      desc: "Evaluate expression and branch execution",
      icon: GitFork,
      color: "text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950",
      defaultData: {
        label: "Evaluate Rule",
        kind: "condition",
        conditionExpression: "output.success === true",
      },
    },
    {
      type: "inputNode",
      kind: "input" as WebFlowNodeKind,
      title: "Workflow Input",
      desc: "Declared input parameters for this workflow",
      icon: ArrowRightToLine,
      color: "text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950",
      defaultData: {
        label: "Workflow Inputs",
        kind: "input",
        inputs: [{ id: "p1", name: "input_query", type: "string" }],
      },
    },
    {
      type: "outputNode",
      kind: "output" as WebFlowNodeKind,
      title: "Workflow Output",
      desc: "Expected results and output artifacts",
      icon: ArrowLeftToLine,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950",
      defaultData: {
        label: "Final Result",
        kind: "output",
        outputs: [{ id: "o1", name: "output_result", type: "string" }],
      },
    },
    {
      type: "transformNode",
      kind: "transform" as WebFlowNodeKind,
      title: "Data Transform",
      desc: "Filter, parse, or re-structure outputs",
      icon: ArrowUpDown,
      color: "text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-950",
      defaultData: {
        label: "Transform Data",
        kind: "transform",
        action: "Format JSON / Text",
      },
    },
    {
      type: "delayNode",
      kind: "delay" as WebFlowNodeKind,
      title: "Delay / Wait",
      desc: "Pause execution for specified duration",
      icon: Clock,
      color: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950",
      defaultData: { label: "Wait Delay", kind: "delay", delaySeconds: 5 },
    },
    {
      type: "noteNode",
      kind: "note" as WebFlowNodeKind,
      title: "Documentation Note",
      desc: "Canvas SOP documentation, tips, or warning",
      icon: StickyNote,
      color: "text-amber-700 dark:text-amber-300 bg-amber-200 dark:bg-amber-900",
      defaultData: {
        label: "Documentation Note",
        kind: "note",
        noteContent: "Important instructions or credential handling advice.",
      },
    },
    {
      type: "endNode",
      kind: "end" as WebFlowNodeKind,
      title: "Flow End",
      desc: "Workflow completion exit terminal",
      icon: CheckCircle2,
      color: "text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800",
      defaultData: { label: "End Flow", kind: "end" },
    },
  ];

  // Folder lookup map
  const folderMap = new Map<string, SavedFolder>();
  folders.forEach((f) => folderMap.set(f._id, f));

  // Filter websites by search query and selected folder
  const filteredWebsites = websites.filter((w) => {
    const matchesSearch =
      !search ||
      w.title?.toLowerCase().includes(search.toLowerCase()) ||
      w.domain?.toLowerCase().includes(search.toLowerCase()) ||
      w.url?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFolderId === "all") return true;
    if (selectedFolderId === "unsorted") return !w.folderId;
    return w.folderId === selectedFolderId;
  });

  // Group filtered websites by folder
  const groupedWebsites: Array<{ folderId: string | null; folderName: string; color?: string; sites: SavedWebsite[] }> = [];

  if (selectedFolderId === "all") {
    // 1. Folders with items
    folders.forEach((f) => {
      const sitesInFolder = filteredWebsites.filter((w) => w.folderId === f._id);
      if (sitesInFolder.length > 0 || !search) {
        groupedWebsites.push({
          folderId: f._id,
          folderName: f.name,
          color: f.color || "#6366f1",
          sites: sitesInFolder,
        });
      }
    });

    // 2. Unsorted items
    const unsortedSites = filteredWebsites.filter((w) => !w.folderId);
    if (unsortedSites.length > 0) {
      groupedWebsites.push({
        folderId: null,
        folderName: "Unsorted Resources",
        color: "#94a3b8",
        sites: unsortedSites,
      });
    }
  } else {
    // Single selected folder
    const folder = folders.find((f) => f._id === selectedFolderId);
    groupedWebsites.push({
      folderId: selectedFolderId === "unsorted" ? null : selectedFolderId,
      folderName: selectedFolderId === "unsorted" ? "Unsorted Resources" : (folder?.name || "Folder"),
      color: folder?.color || "#6366f1",
      sites: filteredWebsites,
    });
  }

  const renderWebsiteCard = (site: SavedWebsite) => {
    const siteFolder = site.folderId ? folderMap.get(site.folderId) : null;
    const nodeData = {
      label: site.title || site.domain || "Website",
      kind: "website" as WebFlowNodeKind,
      websiteId: site._id,
      websiteUrl: site.url,
      websiteTitle: site.title,
      websiteDomain: site.domain,
      websiteFaviconUrl: site.faviconUrl,
      websiteThumbnailUrl:
        site.ogImageUrl ||
        (site.url
          ? `https://s0.wp.com/mshots/v1/${encodeURIComponent(
              site.url.startsWith("http") ? site.url : "https://" + site.url
            )}?w=800`
          : undefined),
      action: "Interact with tool",
      actionDescription: site.description || "",
      status: "configured" as const,
      inputs: [],
      outputs: [],
    };

    return (
      <div
        key={site._id}
        draggable
        onDragStart={(e) => onDragStart(e, "websiteNode", nodeData)}
        className="group flex items-center justify-between rounded-xl border-2 border-nb-border bg-nb-card p-2.5 shadow-nb-sm transition-all hover:border-indigo-500 hover:shadow-nb-md cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          {site.faviconUrl ? (
            <img
              src={site.faviconUrl}
              alt=""
              className="h-6 w-6 rounded border border-nb-border object-contain shrink-0 bg-white p-0.5"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 border border-indigo-200 shrink-0">
              <Globe className="h-3 w-3" />
            </div>
          )}
          <div className="overflow-hidden">
            <div className="text-xs font-black text-nb-fg truncate">
              {site.title || site.domain}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-nb-muted truncate">
              <span className="truncate">{site.domain}</span>
              {siteFolder && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded font-sans text-[9px] font-bold border border-nb-border/40"
                  style={{
                    backgroundColor: `${siteFolder.color || "#6366f1"}20`,
                    color: siteFolder.color || "#6366f1",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: siteFolder.color || "#6366f1" }}
                  />
                  {siteFolder.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAddNode("websiteNode", nodeData)}
          className="rounded-lg p-1.5 text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt transition-colors shrink-0"
          title="Add to canvas"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="relative flex h-full">
      {/* Drawer */}
      <aside
        className={`${
          isOpen ? "w-72 md:w-80" : "w-0 -translate-x-full"
        } transition-all duration-200 flex flex-col border-r-3 border-nb-border bg-nb-card shadow-nb-lg h-full overflow-hidden`}
      >
        {/* Header Tabs */}
        <div className="border-b-2 border-nb-border bg-nb-surface-alt p-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 w-full">
            <button
              type="button"
              onClick={() => setActiveTab("blocks")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold border-2 transition-all ${
                activeTab === "blocks"
                  ? "border-nb-border bg-nb-card text-nb-fg shadow-nb-sm"
                  : "border-transparent text-nb-muted hover:text-nb-fg"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Flow Blocks
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("websites")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold border-2 transition-all ${
                activeTab === "websites"
                  ? "border-nb-border bg-nb-card text-nb-fg shadow-nb-sm"
                  : "border-transparent text-nb-muted hover:text-nb-fg"
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" />
              Saved Tools {websites.length > 0 && `(${websites.length})`}
            </button>
          </div>
        </div>

        {/* Tab 1: Flow Blocks */}
        {activeTab === "blocks" && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
            <p className="text-[11px] text-nb-muted font-medium px-1">
              Drag nodes onto the canvas or click <span className="font-bold">+</span> to insert.
            </p>

            <div className="space-y-2">
              {genericBlocks.map((block) => {
                const IconComponent = block.icon;
                return (
                  <div
                    key={block.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, block.type, block.defaultData)}
                    className="group flex items-center justify-between rounded-xl border-2 border-nb-border bg-nb-card p-2.5 shadow-nb-sm transition-all hover:border-indigo-500 hover:shadow-nb-md cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border border-nb-border shadow-sm shrink-0 ${block.color}`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-black text-nb-fg truncate">
                          {block.title}
                        </div>
                        <div className="text-[10px] text-nb-muted truncate">
                          {block.desc}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAddNode(block.type, block.defaultData as WebFlowNodeData)}
                      className="rounded-lg p-1.5 text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt transition-colors shrink-0"
                      title="Add to canvas"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Saved Websites & Folders */}
        {activeTab === "websites" && (
          <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-2.5">
            {/* Search Input */}
            <div className="relative shrink-0">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-nb-muted" />
              <input
                type="text"
                placeholder="Search tools & bookmarks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border-2 border-nb-border bg-nb-surface-alt pl-8 pr-3 py-1.5 text-xs text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Folder Filter Chips */}
            {folders.length > 0 && (
              <div className="shrink-0 space-y-1">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-nb-muted flex items-center gap-1">
                    <Filter className="h-3 w-3" /> Folders
                  </span>
                  {selectedFolderId !== "all" && (
                    <button
                      type="button"
                      onClick={() => setSelectedFolderId("all")}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Reset filter
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId("all")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold whitespace-nowrap border transition-all ${
                      selectedFolderId === "all"
                        ? "border-nb-border bg-indigo-600 text-white shadow-nb-xs"
                        : "border-nb-border/30 bg-nb-surface text-nb-muted hover:text-nb-fg hover:border-nb-border"
                    }`}
                  >
                    All ({websites.length})
                  </button>

                  {folders.map((f) => (
                    <button
                      key={f._id}
                      type="button"
                      onClick={() => setSelectedFolderId(f._id)}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold whitespace-nowrap border transition-all ${
                        selectedFolderId === f._id
                          ? "border-nb-border bg-nb-card text-nb-fg shadow-nb-xs ring-2 ring-indigo-500"
                          : "border-nb-border/30 bg-nb-surface text-nb-muted hover:text-nb-fg hover:border-nb-border"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: f.color || "#6366f1" }}
                      />
                      <span>{f.name}</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        ({websites.filter((w) => w.folderId === f._id).length})
                      </span>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setSelectedFolderId("unsorted")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold whitespace-nowrap border transition-all ${
                      selectedFolderId === "unsorted"
                        ? "border-nb-border bg-slate-700 text-white shadow-nb-xs"
                        : "border-nb-border/30 bg-nb-surface text-nb-muted hover:text-nb-fg hover:border-nb-border"
                    }`}
                  >
                    Unsorted ({websites.filter((w) => !w.folderId).length})
                  </button>
                </div>
              </div>
            )}

            {/* List / Accordion Area */}
            <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin pr-0.5">
              {loadingWebsites ? (
                <div className="py-8 text-center text-xs text-nb-muted space-y-2">
                  <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  <p>Loading saved tools & folders...</p>
                </div>
              ) : filteredWebsites.length === 0 ? (
                <div className="py-8 text-center text-xs text-nb-muted space-y-2">
                  <p>No tools found.</p>
                  <Link
                    href="/dashboard"
                    className="inline-block text-[11px] font-bold text-indigo-600 underline"
                  >
                    Save websites & folders in Wesite
                  </Link>
                </div>
              ) : (
                groupedWebsites.map((group) => {
                  if (group.sites.length === 0) return null;
                  const groupKey = group.folderId || "unsorted";
                  const isCollapsed = Boolean(collapsedFolders[groupKey]);

                  return (
                    <div
                      key={groupKey}
                      className="rounded-xl border border-nb-border/40 bg-nb-surface-alt/50 overflow-hidden"
                    >
                      {/* Folder Section Header */}
                      <button
                        type="button"
                        onClick={() => toggleFolderCollapse(groupKey)}
                        className="w-full flex items-center justify-between p-2 hover:bg-nb-surface transition-colors text-left"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {isCollapsed ? (
                            <FolderIcon
                              className="h-3.5 w-3.5 shrink-0"
                              style={{ color: group.color || "#6366f1" }}
                            />
                          ) : (
                            <FolderOpen
                              className="h-3.5 w-3.5 shrink-0"
                              style={{ color: group.color || "#6366f1" }}
                            />
                          )}
                          <span className="text-xs font-black text-nb-fg truncate">
                            {group.folderName}
                          </span>
                          <span className="rounded-full bg-nb-border/10 px-1.5 py-0.2 text-[10px] font-mono text-nb-muted">
                            {group.sites.length}
                          </span>
                        </div>
                        {isCollapsed ? (
                          <ChevronRight className="h-3.5 w-3.5 text-nb-muted shrink-0" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-nb-muted shrink-0" />
                        )}
                      </button>

                      {/* Folder Items */}
                      {!isCollapsed && (
                        <div className="p-2 pt-0 space-y-2 border-t border-nb-border/20 mt-1">
                          {group.sites.map((site) => renderWebsiteCard(site))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Collapse/Expand Toggle Button */}
      <button
        type="button"
        onClick={onToggle}
        className="absolute -right-3 top-4 z-20 flex h-6 w-6 items-center justify-center rounded-full border-2 border-nb-border bg-nb-card text-nb-fg shadow-nb-sm hover:scale-110 transition-transform"
        title={isOpen ? "Collapse library" : "Expand library"}
      >
        {isOpen ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
