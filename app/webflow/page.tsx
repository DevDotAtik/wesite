"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Workflow,
  Plus,
  Search,
  Bot,
  Heart,
  GitFork,
  ArrowRight,
  Sparkles,
  Trash2,
  Copy,
  Globe,
  Lock,
  LayoutGrid,
  Upload,
  Zap,
  Play,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/navbar";
import { AIExportModal } from "@/components/webflow/AIExportModal";
import { AICopilotModal } from "@/components/webflow/AICopilotModal";
import { AIIcon } from "@/components/webflow/AIIcon";
import type {
  WebFlowCategory,
  WebFlowVisibility,
  WebFlowItem,
} from "@/lib/webflow/types";

const CATEGORIES: Array<"All" | WebFlowCategory> = [
  "All",
  "Productivity",
  "Development",
  "AI",
  "Marketing",
  "Research",
  "Job Search",
  "Design",
  "Business",
  "Social Media",
  "Automation",
  "Personal",
];

export default function WebFlowHubPage() {
  const router = useRouter();

  // Active Hub Tab: "my-flows" | "explore" | "templates"
  const [activeTab, setActiveTab] = useState<"my-flows" | "explore" | "templates">("my-flows");
  const [selectedCategory, setSelectedCategory] = useState<"All" | WebFlowCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");

interface WebFlowTemplateItem {
  id?: string;
  templateKey?: string;
  key?: string;
  _id?: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  nodes?: unknown[];
  nodeCount?: number;
}

  // Data states
  const [myFlows, setMyFlows] = useState<WebFlowItem[]>([]);
  const [exploreFlows, setExploreFlows] = useState<WebFlowItem[]>([]);
  const [templates, setTemplates] = useState<WebFlowTemplateItem[]>([]);
  const [stats, setStats] = useState({
    totalFlows: 0,
    publicFlows: 0,
    totalRemixes: 0,
    totalLikes: 0,
    totalViews: 0,
    totalNodes: 0,
    mostUsedTool: null as { name: string; count: number } | null,
  });

  const [loading, setLoading] = useState(true);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAIGenerateOpen, setIsAIGenerateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<WebFlowCategory>("Productivity");
  const [newVisibility, setNewVisibility] = useState<WebFlowVisibility>("private");
  const [creating, setCreating] = useState(false);

  // Quick AI Export Modal from Hub
  const [quickExportFlow, setQuickExportFlow] = useState<WebFlowItem | null>(null);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading("Importing WebFlow JSON...");
    try {
      const text = await file.text();
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON: The selected file could not be parsed as JSON.");
      }

      const res = await fetch("/api/webflows/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please sign in to import workflows", { id: toastId });
          router.push("/login?redirect=/webflow");
          return;
        }
        throw new Error(data.error || data.message || "Failed to import workflow");
      }

      toast.success("WebFlow imported successfully!", { id: toastId });
      router.push(`/webflow/${data.webflow._id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid WebFlow JSON file";
      toast.error(message, { id: toastId });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const refreshStats = async () => {
    try {
      const res = await fetch("/api/webflows/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch {
      // ignore
    }
  };

  const refreshMyFlows = async () => {
    try {
      const res = await fetch("/api/webflows?scope=my&limit=100");
      if (res.ok) {
        const data = await res.json();
        setMyFlows(data.webflows || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const res = await fetch("/api/webflows/stats");
        if (res.ok) {
          const data = await res.json();
          if (!ignore) setStats(data.stats);
        }
      } catch {
        // ignore
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      await Promise.resolve();
      if (ignore) return;
      setLoading(true);
      try {
        if (activeTab === "my-flows") {
          const res = await fetch("/api/webflows?scope=my&limit=100");
          if (res.ok) {
            const data = await res.json();
            if (!ignore) setMyFlows(data.webflows || []);
          }
        } else if (activeTab === "explore") {
          const catParam = selectedCategory !== "All" ? `&category=${selectedCategory}` : "";
          const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
          const res = await fetch(`/api/webflows?scope=explore&limit=50${catParam}${searchParam}`);
          if (res.ok) {
            const data = await res.json();
            if (!ignore) setExploreFlows(data.webflows || []);
          }
        } else if (activeTab === "templates") {
          const res = await fetch("/api/webflows/templates");
          if (res.ok) {
            const data = await res.json();
            if (!ignore) setTemplates(data.templates || []);
          }
        }
      } catch {
        if (!ignore) toast.error("Failed to load workflows");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [activeTab, selectedCategory, searchQuery]);

  // Create Flow Handler
  const handleCreateFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setCreating(true);
      const res = await fetch("/api/webflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim(),
          category: newCategory,
          visibility: newVisibility,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create workflow");
      }

      const data = await res.json();
      toast.success("WebFlow created!");
      setIsCreateOpen(false);
      router.push(`/webflow/${data.webflow._id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not create workflow";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  // Quick Start Flow Handler
  const handleQuickStartFlow = async (type: "standard" | "ai" | "blank") => {
    try {
      toast.loading("Creating starter WebFlow...", { id: "quick-starter" });
      let starterNodes: unknown[] = [];
      let starterEdges: unknown[] = [];
      let name = "My WebFlow";
      let description = "Visual multi-step automation workflow";

      if (type === "standard") {
        name = "Web Research & Extract";
        description = "Scrape headlines and extract structured information";
        starterNodes = [
          {
            id: "node_1",
            type: "startNode",
            position: { x: 120, y: 220 },
            data: { label: "Start Workflow", kind: "start", triggerType: "manual", status: "configured" },
          },
          {
            id: "node_2",
            type: "websiteNode",
            position: { x: 420, y: 220 },
            data: { label: "Source Website", kind: "website", url: "https://news.ycombinator.com", status: "configured" },
          },
          {
            id: "node_3",
            type: "actionNode",
            position: { x: 740, y: 220 },
            data: { label: "Extract Headlines", kind: "action", actionDescription: "Scrape top articles and summaries", status: "configured" },
          },
          {
            id: "node_4",
            type: "outputNode",
            position: { x: 1060, y: 220 },
            data: { label: "Save Digest", kind: "end", endMessage: "Digest compiled successfully", status: "configured" },
          },
        ];
        starterEdges = [
          { id: "e1-2", source: "node_1", target: "node_2", type: "labeledEdge" },
          { id: "e2-3", source: "node_2", target: "node_3", type: "labeledEdge" },
          { id: "e3-4", source: "node_3", target: "node_4", type: "labeledEdge" },
        ];
      } else if (type === "ai") {
        name = "AI Research Pipeline";
        description = "Automated web target research with AI analysis and synthesis";
        starterNodes = [
          {
            id: "node_1",
            type: "startNode",
            position: { x: 120, y: 220 },
            data: { label: "Query Trigger", kind: "start", triggerType: "manual", status: "configured" },
          },
          {
            id: "node_2",
            type: "websiteNode",
            position: { x: 420, y: 220 },
            data: { label: "Research Target", kind: "website", url: "https://wikipedia.org", status: "configured" },
          },
          {
            id: "node_3",
            type: "aiNode",
            position: { x: 740, y: 220 },
            data: {
              label: "AI Reasoning",
              kind: "ai",
              aiModel: "gemini-2.5-flash",
              systemPrompt: "Synthesize findings into concise executive bullet points",
              status: "configured",
            },
          },
          {
            id: "node_4",
            type: "outputNode",
            position: { x: 1060, y: 220 },
            data: { label: "Deliver Insights", kind: "end", endMessage: "Analysis prepared for dispatch", status: "configured" },
          },
        ];
        starterEdges = [
          { id: "e1-2", source: "node_1", target: "node_2", type: "labeledEdge" },
          { id: "e2-3", source: "node_2", target: "node_3", type: "labeledEdge" },
          { id: "e3-4", source: "node_3", target: "node_4", type: "labeledEdge" },
        ];
      } else {
        name = "Untitled WebFlow";
        description = "New visual workflow";
      }

      const res = await fetch("/api/webflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          category: "Productivity",
          visibility: "private",
          nodes: starterNodes,
          edges: starterEdges,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create workflow");
      }

      const data = await res.json();
      toast.success("Starter WebFlow created!", { id: "quick-starter" });
      router.push(`/webflow/${data.webflow._id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not create workflow";
      toast.error(message, { id: "quick-starter" });
    }
  };

  // Use Template Handler
  const handleUseTemplate = async (templateId: string) => {
    try {
      toast.loading("Instantiating template...", { id: "template-clone" });
      const res = await fetch("/api/webflows/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, templateKey: templateId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please sign in to clone templates", { id: "template-clone" });
          router.push("/login?redirect=/webflow");
          return;
        }
        throw new Error(data.error || data.message || "Failed to clone template");
      }

      toast.success("Template cloned!", { id: "template-clone" });
      router.push(`/webflow/${data.webflow._id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not instantiate template";
      toast.error(message, { id: "template-clone" });
    }
  };

  // Remix Flow Handler
  const handleRemix = async (flowId: string) => {
    try {
      toast.loading("Remixing workflow...", { id: "flow-remix" });
      const res = await fetch(`/api/webflows/${flowId}/remix`, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please sign in to remix workflows", { id: "flow-remix" });
          router.push("/login?redirect=/webflow");
          return;
        }
        throw new Error(data.error || data.message || "Failed to remix workflow");
      }

      toast.success("Remixed to your account!", { id: "flow-remix" });
      router.push(`/webflow/${data.webflow._id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Remix failed";
      toast.error(message, { id: "flow-remix" });
    }
  };

  // Like Toggle
  const handleLike = async (flowId: string) => {
    try {
      const res = await fetch(`/api/webflows/${flowId}/like`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      setExploreFlows((flows) =>
        flows.map((f) =>
          f._id === flowId
            ? { ...f, isLiked: data.isLiked, likeCount: data.likeCount }
            : f
        )
      );
    } catch {
      // ignore
    }
  };

  // Delete Flow
  const handleDelete = async (flowId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/webflows/${flowId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Workflow deleted");
      setMyFlows((flows) => flows.filter((f) => f._id !== flowId));
      refreshStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Delete failed";
      toast.error(message);
    }
  };

  // Duplicate Flow
  const handleDuplicate = async (flowId: string) => {
    try {
      const res = await fetch(`/api/webflows/${flowId}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to duplicate");
      await res.json();
      toast.success("Workflow duplicated!");
      refreshMyFlows();
      refreshStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Duplicate failed";
      toast.error(message);
    }
  };

  const filteredMyFlows = myFlows.filter((f) => {
    const matchesCategory = selectedCategory === "All" || f.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-nb-bg flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section & Stats */}
        <div className="relative rounded-3xl border-3 border-nb-border bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 sm:p-8 shadow-nb-xl text-white overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/20 px-3 py-1 text-xs font-mono font-bold text-indigo-300">
                <Workflow className="h-3.5 w-3.5" />
                Visual Tool Orchestration & Multi-Step Workflows
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Turn your saved websites into visual, executable workflows.
              </h1>
              <p className="text-sm text-indigo-200 leading-relaxed">
                Connect tools, document real-world processes step-by-step, and generate deterministic specifications ready for autonomous AI agents.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => setIsAIGenerateOpen(true)}
                className="flex items-center gap-2 rounded-2xl border-3 border-nb-border bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black px-5 py-3 text-sm font-black shadow-nb-md hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
              >
                <AIIcon className="h-4 w-4" glow />
                <span>Generate with AI</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 rounded-2xl border-3 border-nb-border bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 text-sm font-black shadow-nb-md hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Create WebFlow</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-2xl border-2 border-white bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-3 text-sm font-bold shadow-nb-sm transition-colors"
                title="Import WebFlow from JSON or AI Agent Spec"
              >
                <Upload className="h-4 w-4 text-indigo-300" />
                <span>Import JSON</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("templates")}
                className="flex items-center gap-2 rounded-2xl border-2 border-white bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-3 text-sm font-bold shadow-nb-sm transition-colors"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Browse Templates</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="relative z-10 mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 border-t border-white/15 text-xs font-mono">
            <div className="rounded-xl bg-white/5 p-3 border border-white/10">
              <span className="block text-[11px] text-indigo-200 font-sans">My WebFlows</span>
              <span className="text-xl font-black text-white">{stats.totalFlows}</span>
            </div>
            <div className="rounded-xl bg-white/5 p-3 border border-white/10">
              <span className="block text-[11px] text-indigo-200 font-sans flex items-center gap-1">
                <Eye className="h-3 w-3 text-indigo-300" /> Total Views
              </span>
              <span className="text-xl font-black text-indigo-200">{stats.totalViews}</span>
            </div>
            <div className="rounded-xl bg-white/5 p-3 border border-white/10">
              <span className="block text-[11px] text-indigo-200 font-sans">Nodes Connected</span>
              <span className="text-xl font-black text-indigo-300">{stats.totalNodes}</span>
            </div>
            <div className="rounded-xl bg-white/5 p-3 border border-white/10">
              <span className="block text-[11px] text-indigo-200 font-sans">Community Remixes</span>
              <span className="text-xl font-black text-emerald-400">{stats.totalRemixes}</span>
            </div>
            <div className="rounded-xl bg-white/5 p-3 border border-white/10">
              <span className="block text-[11px] text-indigo-200 font-sans">Workflow Upvotes</span>
              <span className="text-xl font-black text-amber-300">{stats.totalLikes}</span>
            </div>
          </div>
        </div>

        {/* Beginner Onboarding: 3-Step Walkthrough Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="flex items-start gap-3 rounded-2xl border-2 border-nb-border bg-nb-card p-3.5 shadow-nb-sm hover:-translate-y-0.5 transition-all">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 border border-nb-border font-black text-xs shrink-0">
              1
            </div>
            <div>
              <h4 className="text-xs font-black text-nb-fg flex items-center gap-1.5">
                Pick Your Tools & Steps
              </h4>
              <p className="text-[11px] text-nb-muted mt-0.5 leading-snug">
                Click or drag saved websites, actions, and AI reasoning blocks onto your canvas.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border-2 border-nb-border bg-nb-card p-3.5 shadow-nb-sm hover:-translate-y-0.5 transition-all">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 border border-nb-border font-black text-xs shrink-0">
              2
            </div>
            <div>
              <h4 className="text-xs font-black text-nb-fg flex items-center gap-1.5">
                Connect Flow with 1-Click
              </h4>
              <p className="text-[11px] text-nb-muted mt-0.5 leading-snug">
                Click &ldquo;+ Next Step&rdquo; to instantly chain actions, or drag between glowing node handles.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border-2 border-nb-border bg-nb-card p-3.5 shadow-nb-sm hover:-translate-y-0.5 transition-all">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 border border-nb-border font-black text-xs shrink-0">
              3
            </div>
            <div>
              <h4 className="text-xs font-black text-nb-fg flex items-center gap-1.5">
                Simulate & Export to AI
              </h4>
              <p className="text-[11px] text-nb-muted mt-0.5 leading-snug">
                Hit &ldquo;Test Flow&rdquo; to watch animated execution, then export deterministic prompts for AI agents.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-3 border-nb-border pb-4">
          {/* Main Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("my-flows")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black border-2 transition-all ${
                activeTab === "my-flows"
                  ? "border-nb-border bg-nb-card text-nb-fg shadow-nb-sm"
                  : "border-transparent text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>My WebFlows ({myFlows.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("explore")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black border-2 transition-all ${
                activeTab === "explore"
                  ? "border-nb-border bg-nb-card text-nb-fg shadow-nb-sm"
                  : "border-transparent text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt"
              }`}
            >
              <Globe className="h-4 w-4" />
              <span>Explore Community</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("templates")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black border-2 transition-all ${
                activeTab === "templates"
                  ? "border-nb-border bg-nb-card text-nb-fg shadow-nb-sm"
                  : "border-transparent text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt"
              }`}
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Templates</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-nb-muted" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-2 border-nb-border bg-nb-card pl-9 pr-3 py-1.5 text-xs text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium shadow-nb-sm"
            />
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3 py-1 text-xs font-bold whitespace-nowrap transition-all border-2 ${
                selectedCategory === cat
                  ? "border-nb-border bg-indigo-600 text-white shadow-nb-sm"
                  : "border-nb-border/40 bg-nb-card text-nb-muted hover:border-nb-border hover:text-nb-fg"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content Grids */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
            <p className="text-xs font-bold text-nb-muted">Loading WebFlows...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: MY FLOWS */}
            {activeTab === "my-flows" && (
              <>
                {filteredMyFlows.length === 0 ? (
                  <div className="rounded-3xl border-3 border-dashed border-nb-border/60 bg-nb-card/50 p-6 sm:p-10 text-center space-y-6">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 border-2 border-nb-border shadow-nb-sm">
                      <Workflow className="h-7 w-7" />
                    </div>
                    <div className="space-y-1 max-w-md mx-auto">
                      <h3 className="text-xl font-black text-nb-fg">Start Your First WebFlow</h3>
                      <p className="text-xs text-nb-muted leading-relaxed">
                        Choose a 1-click starter blueprint below, or start fresh with a blank canvas to link your saved tools into deterministic agent pipelines.
                      </p>
                    </div>

                    {/* 3 Quick-Starter Blueprint Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 max-w-3xl mx-auto text-left">
                      <button
                        type="button"
                        onClick={() => handleQuickStartFlow("standard")}
                        className="group rounded-2xl border-2 border-nb-border bg-nb-card p-4 shadow-nb-sm hover:border-indigo-500 hover:-translate-y-1 hover:shadow-nb-md transition-all flex flex-col justify-between"
                        title="Create standard trigger ➔ website ➔ action ➔ output flow"
                      >
                        <div>
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 border border-nb-border mb-3">
                            <Zap className="h-4 w-4" />
                          </div>
                          <h4 className="text-sm font-black text-nb-fg group-hover:text-indigo-600 transition-colors">
                            Standard Web Flow
                          </h4>
                          <p className="text-xs text-nb-muted mt-1 leading-snug">
                            Start Trigger ➔ Web Source ➔ Extract Action ➔ Save Digest.
                          </p>
                        </div>
                        <span className="mt-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          Use Blueprint <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickStartFlow("ai")}
                        className="group rounded-2xl border-2 border-nb-border bg-nb-card p-4 shadow-nb-sm hover:border-amber-500 hover:-translate-y-1 hover:shadow-nb-md transition-all flex flex-col justify-between"
                        title="Create AI agent pipeline with web research and reasoning"
                      >
                        <div>
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 border border-nb-border mb-3">
                            <AIIcon className="h-4 w-4" glow />
                          </div>
                          <h4 className="text-sm font-black text-nb-fg group-hover:text-amber-600 transition-colors">
                            AI Agent Pipeline
                          </h4>
                          <p className="text-xs text-nb-muted mt-1 leading-snug">
                            Query Input ➔ Research Target ➔ AI Reasoning ➔ Result.
                          </p>
                        </div>
                        <span className="mt-4 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          Use Blueprint <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickStartFlow("blank")}
                        className="group rounded-2xl border-2 border-nb-border bg-nb-card p-4 shadow-nb-sm hover:border-emerald-500 hover:-translate-y-1 hover:shadow-nb-md transition-all flex flex-col justify-between"
                        title="Start with a blank canvas"
                      >
                        <div>
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 border border-nb-border mb-3">
                            <Play className="h-4 w-4 fill-emerald-600 text-emerald-600" />
                          </div>
                          <h4 className="text-sm font-black text-nb-fg group-hover:text-emerald-600 transition-colors">
                            Blank Slate
                          </h4>
                          <p className="text-xs text-nb-muted mt-1 leading-snug">
                            Start empty and build custom nodes & tool chains freely.
                          </p>
                        </div>
                        <span className="mt-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          Create Blank <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </button>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-nb-card px-4 py-2 text-xs font-bold text-nb-fg shadow-nb-sm hover:bg-nb-surface-alt transition-colors"
                      >
                        <Upload className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Import Workflow JSON</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        className="rounded-xl border-2 border-nb-border bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-nb-sm hover:bg-indigo-700 transition-colors"
                      >
                        Custom Setup Dialog
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("templates")}
                        className="rounded-xl border-2 border-nb-border bg-nb-card px-4 py-2 text-xs font-bold text-nb-fg shadow-nb-sm hover:bg-nb-surface-alt transition-colors"
                      >
                        Browse Community Templates
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredMyFlows.map((flow) => {
                      const websiteCount = (flow.nodes || []).filter((n) => n.data.kind === "website").length;
                      return (
                        <div
                          key={flow._id}
                          className="group relative flex flex-col justify-between rounded-2xl border-3 border-nb-border bg-nb-card p-5 shadow-nb-md transition-all hover:-translate-y-1 hover:shadow-nb-lg"
                        >
                          <div className="space-y-3">
                            {/* Badges Header */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 text-[10px] font-bold border border-indigo-300 dark:border-indigo-800">
                                {flow.category}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs text-nb-muted">
                                <span className="flex items-center gap-1 text-[11px] font-mono text-nb-muted font-bold" title={`${flow.viewCount || 0} total views`}>
                                  <Eye className="h-3 w-3 text-indigo-500" />
                                  <span>{flow.viewCount || 0}</span>
                                </span>
                                <span className="text-nb-border/40">•</span>
                                {flow.visibility === "public" ? (
                                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                    <Globe className="h-3 w-3" /> Public
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px]">
                                    <Lock className="h-3 w-3" /> Private
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Title & Description */}
                            <div className="min-w-0">
                              <Link
                                href={`/webflow/${flow._id}`}
                                className="text-base font-black text-nb-fg tracking-tight hover:underline break-words line-clamp-2"
                              >
                                {flow.name}
                              </Link>
                              <p className="mt-1 text-xs text-nb-muted break-words line-clamp-4 leading-relaxed">
                                {flow.description || "No description provided."}
                              </p>
                            </div>

                            {/* Node & Tool Counters */}
                            <div className="flex items-center gap-3 text-xs font-mono text-nb-muted border-t border-nb-border/20 pt-2.5">
                              <span>
                                <strong className="text-nb-fg">{flow.nodes?.length || 0}</strong> nodes
                              </span>
                              <span>•</span>
                              <span>
                                <strong className="text-indigo-600 dark:text-indigo-400">{websiteCount}</strong> tools
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-bold text-nb-fg" title={`${flow.viewCount || 0} viewers have seen this workflow`}>
                                <Eye className="h-3 w-3 text-indigo-500" />
                                <span>{flow.viewCount || 0} {flow.viewCount === 1 ? "view" : "views"}</span>
                              </span>
                              {flow.forkCount && flow.forkCount > 0 ? (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-emerald-600">
                                    <GitFork className="h-3 w-3" /> {flow.forkCount}
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="mt-5 flex items-center justify-between gap-2 border-t-2 border-nb-border/30 pt-3">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setQuickExportFlow(flow)}
                                className="p-1.5 rounded-lg border border-nb-border/40 text-nb-muted hover:text-indigo-600 hover:border-indigo-500 transition-colors"
                                title="Export for AI"
                              >
                                <Bot className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicate(flow._id)}
                                className="p-1.5 rounded-lg border border-nb-border/40 text-nb-muted hover:text-nb-fg transition-colors"
                                title="Duplicate"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(flow._id, flow.name)}
                                className="p-1.5 rounded-lg border border-nb-border/40 text-nb-muted hover:text-rose-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <Link
                              href={`/webflow/${flow._id}`}
                              className="flex items-center gap-1 rounded-xl border-2 border-nb-border bg-indigo-600 px-3 py-1.5 text-xs font-black text-white shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
                            >
                              <span className="hidden sm:inline">Open Canvas</span>
                              <span className="sm:hidden">View Diagram</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* TAB 2: EXPLORE COMMUNITY */}
            {activeTab === "explore" && (
              <>
                {exploreFlows.length === 0 ? (
                  <div className="py-16 text-center text-xs text-nb-muted">
                    No community workflows found in this category.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {exploreFlows.map((flow) => {
                      const websiteCount = (flow.nodes || []).filter((n) => n.data.kind === "website").length;
                      return (
                        <div
                          key={flow._id}
                          className="flex flex-col justify-between rounded-2xl border-3 border-nb-border bg-nb-card p-5 shadow-nb-md transition-all hover:-translate-y-1 hover:shadow-nb-lg"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 text-[10px] font-bold border border-indigo-300 dark:border-indigo-800">
                                {flow.category}
                              </span>
                              <span className="text-[11px] text-nb-muted font-mono">
                                by {flow.authorName || "Community"}
                              </span>
                            </div>

                            <div className="min-w-0">
                              <Link
                                href={`/webflow/${flow._id}`}
                                className="text-base font-black text-nb-fg tracking-tight hover:underline break-words line-clamp-2"
                              >
                                {flow.name}
                              </Link>
                              <p className="mt-1 text-xs text-nb-muted break-words line-clamp-4 leading-relaxed">
                                {flow.description || "Community curated workflow."}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 text-xs font-mono text-nb-muted border-t border-nb-border/20 pt-2.5">
                              <span>
                                <strong className="text-nb-fg">{flow.nodes?.length || 0}</strong> nodes
                              </span>
                              <span>•</span>
                              <span>
                                <strong className="text-indigo-600 dark:text-indigo-400">{websiteCount}</strong> tools
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-bold text-nb-fg" title={`${flow.viewCount || 0} views`}>
                                <Eye className="h-3 w-3 text-indigo-500" />
                                <span>{flow.viewCount || 0} {flow.viewCount === 1 ? "view" : "views"}</span>
                              </span>
                            </div>
                          </div>

                          <div className="mt-5 flex items-center justify-between gap-2 border-t-2 border-nb-border/30 pt-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleLike(flow._id)}
                                className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-bold transition-colors ${
                                  flow.isLiked
                                    ? "border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-600"
                                    : "border-nb-border/40 text-nb-muted hover:text-rose-600"
                                }`}
                              >
                                <Heart className={`h-3.5 w-3.5 ${flow.isLiked ? "fill-rose-600" : ""}`} />
                                <span>{flow.likeCount || 0}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setQuickExportFlow(flow)}
                                className="p-1.5 rounded-lg border border-nb-border/40 text-nb-muted hover:text-indigo-600"
                                title="Export for AI"
                              >
                                <Bot className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemix(flow._id)}
                              className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-emerald-500 px-3 py-1.5 text-xs font-black text-white shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
                            >
                              <GitFork className="h-3.5 w-3.5" />
                              <span>Remix</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* TAB 3: STARTER TEMPLATES */}
            {activeTab === "templates" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((tpl) => {
                  const templateId = String(tpl.id || tpl.templateKey || tpl.key || tpl._id || tpl.name);
                  const nodeCount = tpl.nodeCount ?? tpl.nodes?.length ?? 0;
                  return (
                    <div
                      key={templateId}
                      className="flex flex-col justify-between rounded-2xl border-3 border-nb-border bg-nb-card p-6 shadow-nb-md transition-all hover:-translate-y-1 hover:shadow-nb-lg"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold border border-amber-300 dark:border-amber-800">
                            {tpl.category}
                          </span>
                          <span className="text-[10px] font-mono text-nb-muted font-bold">
                            Starter Template
                          </span>
                        </div>

                        <h3 className="text-base font-black text-nb-fg tracking-tight">
                          {tpl.name}
                        </h3>
                        <p className="text-xs text-nb-muted leading-relaxed">
                          {tpl.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {tpl.tags?.map((t: string) => (
                            <span
                              key={t}
                              className="rounded bg-nb-surface-alt px-2 py-0.5 text-[10px] font-mono text-nb-fg border border-nb-border/30"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 border-t-2 border-nb-border/30 pt-4 flex items-center justify-between">
                        <span className="text-xs font-mono text-nb-muted">
                          {nodeCount} Pre-configured Nodes
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUseTemplate(templateId)}
                          className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-indigo-600 px-3.5 py-1.5 text-xs font-black text-white shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                          <span>Use Template</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Create WebFlow Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-lg rounded-2xl border-3 border-nb-border bg-nb-card p-6 shadow-nb-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-nb-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-nb-sm">
                  <Workflow className="h-4 w-4" />
                </div>
                <h3 className="text-base font-black text-nb-fg">Create New WebFlow</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded p-1 text-nb-muted hover:text-nb-fg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFlow} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-nb-muted uppercase tracking-wider mb-1">
                  Workflow Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scrape Price & Publish to Slack"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border-2 border-nb-border bg-nb-surface px-3 py-2 text-xs font-bold text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-nb-muted uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="What is the objective of this workflow?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-xl border-2 border-nb-border bg-nb-surface px-3 py-2 text-xs text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-nb-muted uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as WebFlowCategory)}
                    className="w-full rounded-xl border-2 border-nb-border bg-nb-surface dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-nb-fg dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-nb-muted uppercase tracking-wider mb-1">
                    Visibility
                  </label>
                  <select
                    value={newVisibility}
                    onChange={(e) => setNewVisibility(e.target.value as WebFlowVisibility)}
                    className="w-full rounded-xl border-2 border-nb-border bg-nb-surface dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-nb-fg dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="private">🔒 Private</option>
                    <option value="public">🌐 Public (Explore)</option>
                    <option value="unlisted">🔗 Unlisted</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t-2 border-nb-border/30 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border-2 border-nb-border bg-nb-card px-4 py-2 text-xs font-bold text-nb-fg shadow-nb-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="rounded-xl border-2 border-nb-border bg-indigo-600 px-5 py-2 text-xs font-black text-white shadow-nb-sm disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create & Open Canvas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick AI Export Modal from Hub */}
      {quickExportFlow && (
        <AIExportModal
          isOpen={true}
          onClose={() => setQuickExportFlow(null)}
          workflow={{
            name: quickExportFlow.name,
            description: quickExportFlow.description,
            category: quickExportFlow.category,
            version: quickExportFlow.version,
          }}
          nodes={quickExportFlow.nodes || []}
          edges={quickExportFlow.edges || []}
          variables={quickExportFlow.variables || []}
        />
      )}

      {/* AI Copilot Creation Modal */}
      <AICopilotModal
        isOpen={isAIGenerateOpen}
        onClose={() => setIsAIGenerateOpen(false)}
        mode="create"
      />
    </div>
  );
}
