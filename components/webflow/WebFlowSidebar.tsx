"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  Search,
  Play,
  Zap,
  GitFork,
  ArrowRightToLine,
  ArrowLeftToLine,
  Sparkles,
  StickyNote,
  Clock,
  ArrowUpDown,
  CheckCircle2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Layers,
  Bookmark,
  ExternalLink,
} from "lucide-react";
import type { WebFlowNodeKind } from "@/lib/webflow/types";

interface SavedWebsite {
  _id: string;
  title: string;
  url: string;
  domain?: string;
  faviconUrl?: string;
  description?: string;
  tags?: string[];
}

interface WebFlowSidebarProps {
  onAddNode: (nodeType: string, initialData: any) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function WebFlowSidebar({ onAddNode, isOpen, onToggle }: WebFlowSidebarProps) {
  const [activeTab, setActiveTab] = useState<"blocks" | "websites">("blocks");
  const [websites, setWebsites] = useState<SavedWebsite[]>([]);
  const [search, setSearch] = useState("");
  const [loadingWebsites, setLoadingWebsites] = useState(false);

  useEffect(() => {
    if (activeTab === "websites" && websites.length === 0) {
      setLoadingWebsites(true);
      fetch("/api/websites?limit=50")
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          setWebsites(data.websites || []);
        })
        .catch(() => {
          setWebsites([]);
        })
        .finally(() => setLoadingWebsites(false));
    }
  }, [activeTab, websites.length]);

  const onDragStart = (
    event: React.DragEvent,
    nodeType: string,
    nodeData: Record<string, any>
  ) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ type: nodeType, data: nodeData })
    );
    event.dataTransfer.effectAllowed = "move";
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
      icon: Sparkles,
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
      title: "Sticky Note",
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

  const filteredWebsites = websites.filter(
    (w) =>
      w.title?.toLowerCase().includes(search.toLowerCase()) ||
      w.domain?.toLowerCase().includes(search.toLowerCase()) ||
      w.url?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative flex h-full">
      {/* Drawer */}
      <aside
        className={`${
          isOpen ? "w-72 md:w-80" : "w-0 -translate-x-full"
        } transition-all duration-200 flex flex-col border-r-3 border-nb-border bg-nb-card shadow-nb-lg h-full overflow-hidden`}
      >
        {/* Header Tabs */}
        <div className="border-b-2 border-nb-border bg-nb-surface-alt p-2 flex items-center justify-between">
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
              Saved Tools
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
                      onClick={() => onAddNode(block.type, block.defaultData)}
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

        {/* Tab 2: Saved Websites (Bookmarks from Wesite) */}
        {activeTab === "websites" && (
          <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-nb-muted" />
              <input
                type="text"
                placeholder="Search saved websites..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border-2 border-nb-border bg-nb-surface-alt pl-8 pr-3 py-1.5 text-xs text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <p className="text-[10px] text-nb-muted font-medium px-1">
              Turn your saved bookmarks into executable workflow nodes.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
              {loadingWebsites ? (
                <div className="py-8 text-center text-xs text-nb-muted">
                  Loading saved tools...
                </div>
              ) : filteredWebsites.length === 0 ? (
                <div className="py-8 text-center text-xs text-nb-muted space-y-2">
                  <p>No websites found.</p>
                  <a
                    href="/"
                    className="inline-block text-[11px] font-bold text-indigo-600 underline"
                  >
                    Save websites in Wesite first
                  </a>
                </div>
              ) : (
                filteredWebsites.map((site) => {
                  const nodeData = {
                    label: site.title || site.domain || "Website",
                    kind: "website" as WebFlowNodeKind,
                    websiteId: site._id,
                    websiteUrl: site.url,
                    websiteTitle: site.title,
                    websiteDomain: site.domain,
                    websiteFaviconUrl: site.faviconUrl,
                    websiteThumbnailUrl: site.ogImageUrl || (site.url ? `https://s0.wp.com/mshots/v1/${encodeURIComponent(site.url.startsWith("http") ? site.url : "https://" + site.url)}?w=800` : undefined),
                    action: "Interact with tool",
                    actionDescription: site.description || "",
                    status: "configured",
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
                            className="h-6 w-6 rounded border border-nb-border object-contain shrink-0"
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
                          <div className="text-[10px] font-mono text-nb-muted truncate">
                            {site.domain}
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
