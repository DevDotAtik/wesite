"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  List,
  Upload,
  Zap,
  Play,
  Eye,
  UserCircle,
  ExternalLink,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  Share2,
  Layers,
  Cpu,
  Terminal,
  Bookmark,
  RefreshCw,
  X,
  ChevronRight,
  HelpCircle,
  Info,
  Calendar,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/navbar";
import { AIExportModal } from "@/components/webflow/AIExportModal";
import { AICopilotModal } from "@/components/webflow/AICopilotModal";
import { AIIcon } from "@/components/webflow/AIIcon";
import { fetchWithAuth } from "@/lib/auth-client";
import type {
  WebFlowCategory,
  WebFlowVisibility,
  WebFlowItem,
  WebFlowNode,
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

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Productivity: { bg: "bg-emerald-500/15 dark:bg-emerald-500/25", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-500/40" },
  Development: { bg: "bg-blue-500/15 dark:bg-blue-500/25", text: "text-blue-700 dark:text-blue-300", border: "border-blue-500/40" },
  AI: { bg: "bg-purple-500/15 dark:bg-purple-500/25", text: "text-purple-700 dark:text-purple-300", border: "border-purple-500/40" },
  Marketing: { bg: "bg-rose-500/15 dark:bg-rose-500/25", text: "text-rose-700 dark:text-rose-300", border: "border-rose-500/40" },
  Research: { bg: "bg-cyan-500/15 dark:bg-cyan-500/25", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-500/40" },
  "Job Search": { bg: "bg-amber-500/15 dark:bg-amber-500/25", text: "text-amber-800 dark:text-amber-300", border: "border-amber-500/40" },
  Design: { bg: "bg-fuchsia-500/15 dark:bg-fuchsia-500/25", text: "text-fuchsia-700 dark:text-fuchsia-300", border: "border-fuchsia-500/40" },
  Business: { bg: "bg-sky-500/15 dark:bg-sky-500/25", text: "text-sky-700 dark:text-sky-300", border: "border-sky-500/40" },
  "Social Media": { bg: "bg-pink-500/15 dark:bg-pink-500/25", text: "text-pink-700 dark:text-pink-300", border: "border-pink-500/40" },
  Automation: { bg: "bg-orange-500/15 dark:bg-orange-500/25", text: "text-orange-700 dark:text-orange-300", border: "border-orange-500/40" },
  Personal: { bg: "bg-lime-500/15 dark:bg-lime-500/25", text: "text-lime-800 dark:text-lime-300", border: "border-lime-500/40" },
  Other: { bg: "bg-zinc-500/15 dark:bg-zinc-500/25", text: "text-zinc-700 dark:text-zinc-300", border: "border-zinc-500/40" },
};

interface WebFlowTemplateItem {
  id?: string;
  templateKey?: string;
  key?: string;
  _id?: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  nodes?: WebFlowNode[];
  edges?: unknown[];
  nodeCount?: number;
  variables?: Array<{ name: string; type: string; defaultValue?: string; description?: string }>;
}

type SortOption = "recent" | "nodes" | "views" | "likes" | "alphabetical";
type ViewMode = "grid" | "list";

export default function WebFlowHubPage() {
  const router = useRouter();

  // Active Hub Tab: "my-flows" | "explore" | "templates"
  const [activeTab, setActiveTab] = useState<"my-flows" | "explore" | "templates">("my-flows");
  const [selectedCategory, setSelectedCategory] = useState<"All" | WebFlowCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Guide toggle
  const [guideDismissed, setGuideDismissed] = useState(false);

  // Data states
  const [myFlows, setMyFlows] = useState<WebFlowItem[]>([]);
  const [exploreFlows, setExploreFlows] = useState<WebFlowItem[]>([]);
  const [templates, setTemplates] = useState<WebFlowTemplateItem[]>([]);
  const [currentUser, setCurrentUser] = useState<{ _id: string; email: string; name: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [stats, setStats] = useState<{
    totalFlows: number;
    publicFlows: number;
    totalRemixes: number;
    totalLikes: number;
    totalViews: number;
    totalNodes: number;
    topTool: { name: string; count: number; url?: string; domain?: string; favicon?: string } | null;
    popularTools: Array<{ count: number; name: string; url?: string; domain?: string; favicon?: string }>;
  }>({
    totalFlows: 0,
    publicFlows: 0,
    totalRemixes: 0,
    totalLikes: 0,
    totalViews: 0,
    totalNodes: 0,
    topTool: null,
    popularTools: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAIGenerateOpen, setIsAIGenerateOpen] = useState(false);
  const [previewFlow, setPreviewFlow] = useState<WebFlowItem | WebFlowTemplateItem | null>(null);
  const [quickExportFlow, setQuickExportFlow] = useState<WebFlowItem | null>(null);

  // Create Form State
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<WebFlowCategory>("Productivity");
  const [newVisibility, setNewVisibility] = useState<WebFlowVisibility>("private");
  const [creating, setCreating] = useState(false);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener: Cmd/Ctrl + K opens AI copilot, Esc closes preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsAIGenerateOpen(true);
      } else if (e.key === "Escape") {
        setPreviewFlow(null);
        setIsCreateOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

      const res = await fetchWithAuth("/api/webflows/import", {
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

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/webflows/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch {
      // ignore
    }
  }, []);

  const refreshMyFlows = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/webflows?scope=my&limit=100");
      if (res.ok) {
        const data = await res.json();
        setMyFlows(data.webflows || []);
      }
    } catch {
      // ignore
    }
  }, []);

  // Initial auth & stats check
  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const [statsRes, meRes] = await Promise.all([
          fetchWithAuth("/api/webflows/stats"),
          fetchWithAuth("/api/auth/me"),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          if (!ignore) setCurrentUser(meData.user || null);
        } else {
          if (!ignore) setCurrentUser(null);
        }
        if (!ignore) setAuthChecked(true);

        if (statsRes.ok) {
          const data = await statsRes.json();
          if (!ignore) setStats(data.stats);
        }
      } catch {
        if (!ignore) setAuthChecked(true);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch tab data
  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      try {
        if (activeTab === "my-flows") {
          const res = await fetchWithAuth("/api/webflows?scope=my&limit=100");
          if (res.ok) {
            const data = await res.json();
            if (!ignore) setMyFlows(data.webflows || []);
          } else if (res.status === 401) {
            if (!ignore) {
              setMyFlows([]);
              setCurrentUser(null);
            }
          }
        } else if (activeTab === "explore") {
          const catParam = selectedCategory !== "All" ? `&category=${selectedCategory}` : "";
          const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
          const res = await fetchWithAuth(`/api/webflows?scope=explore&limit=50${catParam}${searchParam}`);
          if (res.ok) {
            const data = await res.json();
            if (!ignore) setExploreFlows(data.webflows || []);
          }
        } else if (activeTab === "templates") {
          const res = await fetchWithAuth("/api/webflows/templates");
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

  // Refresh all current data
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshStats(), activeTab === "my-flows" ? refreshMyFlows() : null]);
    setRefreshing(false);
    toast.success("Workflows refreshed");
  };

  // Create Flow Handler
  const handleCreateFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setCreating(true);
      const res = await fetchWithAuth("/api/webflows", {
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
        if (res.status === 401) {
          toast.error("Please sign in to create workflows");
          router.push("/login?redirect=/webflow");
          return;
        }
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

      const res = await fetchWithAuth("/api/webflows", {
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
        if (res.status === 401) {
          toast.error("Please sign in to create workflows", { id: "quick-starter" });
          router.push("/login?redirect=/webflow");
          return;
        }
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
      const res = await fetchWithAuth("/api/webflows/templates", {
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

      toast.success("Template cloned to your WebFlows!", { id: "template-clone" });
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
      const res = await fetchWithAuth(`/api/webflows/${flowId}/remix`, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please sign in to remix workflows", { id: "flow-remix" });
          router.push("/login?redirect=/webflow");
          return;
        }
        throw new Error(data.error || data.message || "Failed to remix workflow");
      }

      toast.success("Remixed to your workspace!", { id: "flow-remix" });
      router.push(`/webflow/${data.webflow._id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Remix failed";
      toast.error(message, { id: "flow-remix" });
    }
  };

  // Like Toggle Handler with optimistic UI update
  const handleLike = async (flowId: string) => {
    // Optimistic toggle
    setExploreFlows((flows) =>
      flows.map((f) => {
        if (f._id !== flowId) return f;
        const willLike = !f.isLiked;
        return {
          ...f,
          isLiked: willLike,
          likeCount: Math.max(0, (f.likeCount || 0) + (willLike ? 1 : -1)),
        };
      })
    );

    try {
      const res = await fetchWithAuth(`/api/webflows/${flowId}/like`, { method: "POST" });
      if (!res.ok) {
        // Rollback if failed
        setExploreFlows((flows) =>
          flows.map((f) => {
            if (f._id !== flowId) return f;
            const wasLiked = !f.isLiked;
            return {
              ...f,
              isLiked: wasLiked,
              likeCount: Math.max(0, (f.likeCount || 0) + (wasLiked ? 1 : -1)),
            };
          })
        );
        return;
      }
      const data = await res.json();
      setExploreFlows((flows) =>
        flows.map((f) =>
          f._id === flowId ? { ...f, isLiked: data.isLiked, likeCount: data.likeCount } : f
        )
      );
    } catch {
      // rollback
    }
  };

  // Bookmark Toggle
  const handleBookmark = async (flowId: string) => {
    try {
      const res = await fetchWithAuth(`/api/webflows/${flowId}/bookmark`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      setExploreFlows((flows) =>
        flows.map((f) => (f._id === flowId ? { ...f, isBookmarked: data.bookmarked } : f))
      );
      toast.success(data.bookmarked ? "Saved to bookmarks" : "Bookmark removed");
    } catch {
      toast.error("Failed to toggle bookmark");
    }
  };

  // Delete Flow
  const handleDelete = async (flowId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await fetchWithAuth(`/api/webflows/${flowId}`, { method: "DELETE" });
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
      const res = await fetchWithAuth(`/api/webflows/${flowId}/duplicate`, { method: "POST" });
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

  // Copy Direct Share Link
  const handleCopyShareLink = (flowId: string) => {
    const url = `${window.location.origin}/webflow/${flowId}`;
    navigator.clipboard.writeText(url);
    toast.success("Workflow link copied to clipboard!");
  };

  // Helper to extract node kind icon and badge
  const getNodeKindIcon = (kind: string) => {
    switch (kind) {
      case "website":
        return <Globe className="h-3 w-3 text-blue-500" />;
      case "ai":
        return <Bot className="h-3 w-3 text-purple-500" />;
      case "action":
        return <Zap className="h-3 w-3 text-amber-500" />;
      case "start":
        return <Play className="h-3 w-3 text-emerald-500" />;
      case "condition":
        return <GitFork className="h-3 w-3 text-orange-500" />;
      case "output":
      case "end":
        return <CheckCircle2 className="h-3 w-3 text-teal-500" />;
      case "delay":
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case "transform":
        return <Cpu className="h-3 w-3 text-indigo-500" />;
      default:
        return <Layers className="h-3 w-3 text-zinc-400" />;
    }
  };

  // Sorting & Filtering logic for My Flows
  const filteredMyFlows = useMemo(() => {
    return myFlows
      .filter((f) => {
        const matchesCategory = selectedCategory === "All" || f.category === selectedCategory;
        const matchesSearch =
          !searchQuery ||
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "nodes") return (b.nodes?.length || 0) - (a.nodes?.length || 0);
        if (sortBy === "views") return (b.viewCount || 0) - (a.viewCount || 0);
        if (sortBy === "likes") return (b.likeCount || 0) - (a.likeCount || 0);
        if (sortBy === "alphabetical") return a.name.localeCompare(b.name);
        // Default "recent":
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
  }, [myFlows, selectedCategory, searchQuery, sortBy]);

  // Filtering for Explore Flows
  const filteredExploreFlows = useMemo(() => {
    return exploreFlows
      .filter((f) => {
        const matchesCategory = selectedCategory === "All" || f.category === selectedCategory;
        const matchesSearch =
          !searchQuery ||
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (f.authorName && f.authorName.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "nodes") return (b.nodes?.length || 0) - (a.nodes?.length || 0);
        if (sortBy === "views") return (b.viewCount || 0) - (a.viewCount || 0);
        if (sortBy === "likes") return (b.likeCount || 0) - (a.likeCount || 0);
        if (sortBy === "alphabetical") return a.name.localeCompare(b.name);
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
  }, [exploreFlows, selectedCategory, searchQuery, sortBy]);

  // Filtering for Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchesCategory = selectedCategory === "All" || tpl.category === selectedCategory;
      const matchesTag = !selectedTag || (tpl.tags && tpl.tags.includes(selectedTag));
      const matchesSearch =
        !searchQuery ||
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tpl.description && tpl.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tpl.tags && tpl.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchesCategory && matchesTag && matchesSearch;
    });
  }, [templates, selectedCategory, selectedTag, searchQuery]);

  return (
    <div className="min-h-screen bg-nb-bg flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* ========================================================================= */}
        {/* HERO SECTION & INTERACTIVE STATS                                          */}
        {/* ========================================================================= */}
        <section className="relative rounded-3xl border-3 border-nb-border bg-gradient-to-br from-indigo-950 via-slate-900 to-zinc-950 p-6 sm:p-8 shadow-nb-xl text-white overflow-hidden">
          {/* Subtle Neo-Brutalist Dot Grid Texture */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/40 bg-indigo-500/20 px-3 py-1 text-xs font-mono font-black text-indigo-300">
                  <Workflow className="h-3.5 w-3.5" />
                  Visual Orchestration Engine
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-500/20 px-2.5 py-1 text-xs font-mono font-bold text-purple-300">
                  <Bot className="h-3 w-3 text-purple-400" />
                  AI Agent Ready
                </span>
                {currentUser ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-xs font-mono font-bold text-emerald-300">
                    <UserCircle className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="truncate max-w-[160px] sm:max-w-xs">{currentUser.email}</span>
                  </div>
                ) : authChecked ? (
                  <Link
                    href="/login?redirect=/webflow"
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/25 px-3 py-1 text-xs font-bold text-amber-200 hover:bg-amber-500/40 transition-all cursor-pointer"
                  >
                    <Lock className="h-3.5 w-3.5 text-amber-300" />
                    <span>Guest Mode • Sign In</span>
                  </Link>
                ) : null}
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Architect, Automate &amp; Export Visual WebFlows.
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
                Connect tools, document multi-step processes, and convert diagrams into deterministic AI agent instructions.
              </p>
            </div>

            {/* Quick Actions Cluster */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
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
                className="flex items-center gap-2 rounded-2xl border-3 border-nb-border bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black px-4 sm:px-5 py-3 text-xs sm:text-sm font-black shadow-nb-md hover:translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer"
                title="Generate with AI (⌘K / Ctrl+K)"
              >
                <AIIcon className="h-4 w-4" glow />
                <span>AI Copilot</span>
                <span className="hidden sm:inline-block rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-mono font-bold">
                  ⌘K
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 rounded-2xl border-3 border-nb-border bg-indigo-600 hover:bg-indigo-500 text-white px-4 sm:px-5 py-3 text-xs sm:text-sm font-black shadow-nb-md hover:translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>New Workflow</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-2xl border-2 border-white/80 bg-zinc-900/90 hover:bg-zinc-800 text-white px-3.5 py-3 text-xs font-bold shadow-nb-sm transition-all cursor-pointer"
                title="Import WebFlow from JSON or AI Agent Spec"
              >
                <Upload className="h-3.5 w-3.5 text-indigo-300" />
                <span>Import JSON</span>
              </button>
            </div>
          </div>

          {/* Interactive Metric Tiles */}
          <div className="relative z-10 mt-6 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="group rounded-2xl bg-white/5 hover:bg-white/10 p-3.5 border border-white/10 transition-all">
              <div className="flex items-center justify-between text-indigo-200">
                <span className="text-[11px] font-semibold">My WebFlows</span>
                <Workflow className="h-3.5 w-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
              </div>
              <span className="mt-1 block text-2xl font-black text-white">{stats.totalFlows}</span>
              <span className="text-[10px] text-indigo-300/80 font-mono">
                {stats.publicFlows} published public
              </span>
            </div>

            <div className="group rounded-2xl bg-white/5 hover:bg-white/10 p-3.5 border border-white/10 transition-all">
              <div className="flex items-center justify-between text-indigo-200">
                <span className="text-[11px] font-semibold">Nodes Connected</span>
                <Layers className="h-3.5 w-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="mt-1 block text-2xl font-black text-purple-300">{stats.totalNodes}</span>
              <span className="text-[10px] text-purple-200/80 font-mono">logic &amp; tool blocks</span>
            </div>

            <div className="group rounded-2xl bg-white/5 hover:bg-white/10 p-3.5 border border-white/10 transition-all">
              <div className="flex items-center justify-between text-indigo-200">
                <span className="text-[11px] font-semibold">Total Views</span>
                <Eye className="h-3.5 w-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="mt-1 block text-2xl font-black text-cyan-300">{stats.totalViews}</span>
              <span className="text-[10px] text-cyan-200/80 font-mono">workflow inspections</span>
            </div>

            <div className="group rounded-2xl bg-white/5 hover:bg-white/10 p-3.5 border border-white/10 transition-all">
              <div className="flex items-center justify-between text-indigo-200">
                <span className="text-[11px] font-semibold">Community Remixes</span>
                <GitFork className="h-3.5 w-3.5 text-emerald-400 group-hover:-rotate-12 transition-transform" />
              </div>
              <span className="mt-1 block text-2xl font-black text-emerald-400">{stats.totalRemixes}</span>
              <span className="text-[10px] text-emerald-300/80 font-mono">collaborative forks</span>
            </div>

            <div className="group rounded-2xl bg-white/5 hover:bg-white/10 p-3.5 border border-white/10 transition-all col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-indigo-200">
                <span className="text-[11px] font-semibold">Workflow Upvotes</span>
                <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-500/20 group-hover:scale-110 transition-transform" />
              </div>
              <span className="mt-1 block text-2xl font-black text-rose-300">{stats.totalLikes}</span>
              <span className="text-[10px] text-rose-200/80 font-mono">community love</span>
            </div>
          </div>

          {/* Popular Tools Bar (if available) */}
          {stats.popularTools && stats.popularTools.length > 0 && (
            <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-mono text-indigo-300 font-bold flex items-center gap-1">
                <Cpu className="h-3 w-3" /> Most Connected Tools:
              </span>
              {stats.popularTools.map((t) => (
                <span
                  key={t.name}
                  className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white border border-white/10"
                >
                  <Globe className="h-2.5 w-2.5 text-indigo-300" />
                  <span>{t.name}</span>
                  <span className="rounded bg-indigo-500/40 px-1 py-0.2 text-[9px] font-mono font-bold text-indigo-200">
                    {t.count}x
                  </span>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 3-STEP INTERACTIVE WORKFLOW ONBOARDING GUIDE                              */}
        {/* ========================================================================= */}
        {!guideDismissed && (
          <div className="relative rounded-2xl border-2 border-nb-border bg-nb-card p-4 sm:p-5 shadow-nb-sm">
            <div className="flex items-center justify-between pb-3 border-b border-nb-border/30 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-black text-[10px]">
                  ?
                </span>
                <h3 className="text-xs font-black text-nb-fg uppercase tracking-wider">
                  How WebFlow Works • 3 Progressive Stages
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGuideDismissed(true)}
                className="text-[11px] text-nb-muted hover:text-nb-fg flex items-center gap-1 cursor-pointer"
                title="Dismiss walkthrough"
              >
                <span>Dismiss</span>
                <X className="h-3 w-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="flex items-start gap-3 rounded-xl border border-nb-border/40 bg-nb-surface-alt/60 p-3 hover:border-indigo-500 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 border border-nb-border font-black text-xs shrink-0">
                  1
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-nb-fg flex items-center gap-1.5">
                    Pick Tools &amp; Actions
                  </h4>
                  <p className="text-[11px] text-nb-muted leading-relaxed">
                    Add bookmarked tools, AI prompts, conditions, and custom steps directly to your visual canvas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-nb-border/40 bg-nb-surface-alt/60 p-3 hover:border-amber-500 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 border border-nb-border font-black text-xs shrink-0">
                  2
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-nb-fg flex items-center gap-1.5">
                    Chain Flow &amp; Logic
                  </h4>
                  <p className="text-[11px] text-nb-muted leading-relaxed">
                    Click &ldquo;+ Next Step&rdquo; or drag between node handles to create data conduits and execution branches.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-nb-border/40 bg-nb-surface-alt/60 p-3 hover:border-emerald-500 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 border border-nb-border font-black text-xs shrink-0">
                  3
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-nb-fg flex items-center gap-1.5">
                    Test, Share &amp; Export
                  </h4>
                  <p className="text-[11px] text-nb-muted leading-relaxed">
                    Simulate execution with animated tokens, share with team, and export ready-to-run prompt specs for autonomous AI agents.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* NAVIGATION TABS, SEARCH, SORT & VIEW MODE CONTROLS                        */}
        {/* ========================================================================= */}
        <div className="space-y-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b-3 border-nb-border pb-4">
            {/* Primary Segmented Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("my-flows");
                  setSelectedTag(null);
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-black border-2 transition-all cursor-pointer ${
                  activeTab === "my-flows"
                    ? "border-nb-border bg-indigo-600 text-white shadow-nb-sm"
                    : "border-transparent text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                <span>My WebFlows</span>
                <span
                  className={`rounded-full px-2 py-0.2 text-[10px] font-mono ${
                    activeTab === "my-flows" ? "bg-white/20 text-white" : "bg-nb-surface-strong text-nb-muted"
                  }`}
                >
                  {myFlows.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("explore");
                  setSelectedTag(null);
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-black border-2 transition-all cursor-pointer ${
                  activeTab === "explore"
                    ? "border-nb-border bg-indigo-600 text-white shadow-nb-sm"
                    : "border-transparent text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt"
                }`}
              >
                <Globe className="h-4 w-4" />
                <span>Explore Community</span>
                {exploreFlows.length > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.2 text-[10px] font-mono ${
                      activeTab === "explore" ? "bg-white/20 text-white" : "bg-nb-surface-strong text-nb-muted"
                    }`}
                  >
                    {exploreFlows.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("templates");
                  setSelectedTag(null);
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-black border-2 transition-all cursor-pointer ${
                  activeTab === "templates"
                    ? "border-nb-border bg-indigo-600 text-white shadow-nb-sm"
                    : "border-transparent text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt"
                }`}
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Starter Templates</span>
                <span
                  className={`rounded-full px-2 py-0.2 text-[10px] font-mono ${
                    activeTab === "templates" ? "bg-white/20 text-white" : "bg-nb-surface-strong text-nb-muted"
                  }`}
                >
                  {templates.length}
                </span>
              </button>
            </div>

            {/* Filter & View Controls */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              {/* Search Bar with instant clear */}
              <div className="relative flex-1 sm:w-64 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-nb-muted" />
                <input
                  type="text"
                  placeholder="Search workflows, tools, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border-2 border-nb-border bg-nb-card pl-9 pr-8 py-1.5 text-xs text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium shadow-nb-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-nb-muted hover:text-nb-fg"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1 rounded-xl border-2 border-nb-border bg-nb-card px-2.5 py-1 text-xs shadow-nb-xs">
                <ArrowUpDown className="h-3 w-3 text-nb-muted" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-xs font-bold text-nb-fg focus:outline-none cursor-pointer"
                  title="Sort workflows"
                >
                  <option value="recent">Recently Updated</option>
                  <option value="nodes">Most Nodes</option>
                  <option value="views">Most Viewed</option>
                  <option value="likes">Most Upvoted</option>
                  <option value="alphabetical">Alphabetical (A-Z)</option>
                </select>
              </div>

              {/* View Mode Toggle: Grid vs List */}
              <div className="flex items-center rounded-xl border-2 border-nb-border bg-nb-card p-0.5 shadow-nb-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "grid" ? "bg-indigo-600 text-white" : "text-nb-muted hover:text-nb-fg"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "list" ? "bg-indigo-600 text-white" : "text-nb-muted hover:text-nb-fg"
                  }`}
                  title="List View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-xl border-2 border-nb-border bg-nb-card hover:bg-nb-surface-alt text-nb-fg shadow-nb-xs transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh Workflows"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-indigo-500" : ""}`} />
              </button>
            </div>
          </div>

          {/* Category Carousel Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedTag(null);
                  }}
                  className={`rounded-xl px-3 py-1 text-xs font-bold whitespace-nowrap transition-all border-2 cursor-pointer ${
                    isSelected
                      ? "border-nb-border bg-indigo-600 text-white shadow-nb-xs"
                      : "border-nb-border/40 bg-nb-card text-nb-muted hover:border-nb-border hover:text-nb-fg"
                  }`}
                >
                  {cat}
                </button>
              );
            })}

            {/* Clear filters shortcut */}
            {(selectedCategory !== "All" || searchQuery || selectedTag) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                  setSelectedTag(null);
                }}
                className="rounded-xl px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-500/10 border-2 border-dashed border-rose-400 flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* WORKFLOW CONTENT: TABS 1, 2, 3                                            */}
        {/* ========================================================================= */}
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent shadow-nb-sm" />
            <div className="space-y-1">
              <p className="text-sm font-black text-nb-fg">Orchestrating Canvas...</p>
              <p className="text-xs text-nb-muted">Loading visual workflow graph nodes</p>
            </div>
          </div>
        ) : (
          <>
            {/* ------------------------------------------------------------------- */}
            {/* TAB 1: MY WORKFLOWS                                                 */}
            {/* ------------------------------------------------------------------- */}
            {activeTab === "my-flows" && (
              <>
                {/* Guest Sign-In Alert */}
                {!currentUser && authChecked && (
                  <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 dark:bg-amber-950/40 p-5 shadow-nb-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-black shadow-nb-xs shrink-0 font-black">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-nb-fg">Guest Mode Active</h4>
                        <p className="text-xs text-nb-muted mt-0.5">
                          Sign in to create, save and sync personal WebFlows to your secure account.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/login?redirect=/webflow"
                      className="shrink-0 flex items-center gap-2 rounded-xl border-2 border-nb-border bg-amber-500 text-black px-4 py-2 text-xs font-black shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      <span>Sign In with Account</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}

                {filteredMyFlows.length === 0 ? (
                  <div className="rounded-3xl border-3 border-dashed border-nb-border/60 bg-nb-card/50 p-6 sm:p-12 text-center space-y-6">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 border-2 border-nb-border shadow-nb-sm">
                      <Workflow className="h-8 w-8" />
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h3 className="text-xl sm:text-2xl font-black text-nb-fg">
                        {searchQuery || selectedCategory !== "All"
                          ? "No matching workflows found"
                          : "Start Your First WebFlow"}
                      </h3>
                      <p className="text-xs sm:text-sm text-nb-muted leading-relaxed">
                        {searchQuery || selectedCategory !== "All"
                          ? "Try clearing your search query or choosing another category filter."
                          : "Pick a 1-click blueprint below to bootstrap your canvas, or start fresh with a blank slate."}
                      </p>
                    </div>

                    {/* 3 Quick-Starter Blueprint Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left pt-2">
                      <button
                        type="button"
                        onClick={() => handleQuickStartFlow("standard")}
                        className="group rounded-2xl border-3 border-nb-border bg-nb-card p-4 shadow-nb-sm hover:border-indigo-500 hover:-translate-y-1 hover:shadow-nb-md transition-all flex flex-col justify-between cursor-pointer"
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
                        className="group rounded-2xl border-3 border-nb-border bg-nb-card p-4 shadow-nb-sm hover:border-amber-500 hover:-translate-y-1 hover:shadow-nb-md transition-all flex flex-col justify-between cursor-pointer"
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
                        className="group rounded-2xl border-3 border-nb-border bg-nb-card p-4 shadow-nb-sm hover:border-emerald-500 hover:-translate-y-1 hover:shadow-nb-md transition-all flex flex-col justify-between cursor-pointer"
                      >
                        <div>
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 border border-nb-border mb-3">
                            <Play className="h-4 w-4 fill-emerald-600 text-emerald-600" />
                          </div>
                          <h4 className="text-sm font-black text-nb-fg group-hover:text-emerald-600 transition-colors">
                            Blank Slate Canvas
                          </h4>
                          <p className="text-xs text-nb-muted mt-1 leading-snug">
                            Start empty and build custom nodes &amp; tool chains freely.
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
                        className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-nb-card px-4 py-2 text-xs font-bold text-nb-fg shadow-nb-sm hover:bg-nb-surface-alt transition-colors cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Import Workflow JSON</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        className="rounded-xl border-2 border-nb-border bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-nb-sm hover:bg-indigo-700 transition-colors cursor-pointer"
                      >
                        Custom Setup Dialog
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("templates")}
                        className="rounded-xl border-2 border-nb-border bg-nb-card px-4 py-2 text-xs font-bold text-nb-fg shadow-nb-sm hover:bg-nb-surface-alt transition-colors cursor-pointer"
                      >
                        Browse Community Templates
                      </button>
                    </div>
                  </div>
                ) : viewMode === "grid" ? (
                  /* GRID VIEW */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredMyFlows.map((flow) => {
                      const websiteCount = (flow.nodes || []).filter((n) => n.data?.kind === "website").length;
                      const catStyle = CATEGORY_STYLES[flow.category] || CATEGORY_STYLES.Other;
                      const nodesList = flow.nodes || [];

                      return (
                        <div
                          key={flow._id}
                          className="group relative flex flex-col justify-between rounded-2xl border-3 border-nb-border bg-nb-card p-5 shadow-nb-md transition-all hover:-translate-y-1 hover:shadow-nb-lg"
                        >
                          <div className="space-y-3">
                            {/* Card Header: Badges & Visibility */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`rounded-lg px-2.5 py-0.5 text-[10px] font-black border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                                >
                                  {flow.category}
                                </span>
                                {(flow.isRemix || flow.forkedFromId) && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-400 text-black px-1.5 py-0.5 text-[9px] font-black uppercase shadow-nb-xs border border-black">
                                    <GitFork className="h-2.5 w-2.5" /> Remix
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs text-nb-muted">
                                <span
                                  className="flex items-center gap-1 text-[11px] font-mono font-bold"
                                  title={`${flow.viewCount || 0} total views`}
                                >
                                  <Eye className="h-3 w-3 text-indigo-500" />
                                  <span>{flow.viewCount || 0}</span>
                                </span>
                                <span className="text-nb-border/40">•</span>
                                {flow.visibility === "public" ? (
                                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                    <Globe className="h-3 w-3" /> Public
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-zinc-500 text-[10px]">
                                    <Lock className="h-3 w-3" /> Private
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Remix Lineage Notice */}
                            {(flow.isRemix || flow.forkedFromId) && (
                              <div className="flex flex-wrap items-center justify-between gap-1 rounded-xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 p-2 text-[11px]">
                                <div className="flex items-center gap-1 text-amber-900 dark:text-amber-200 font-semibold truncate">
                                  <GitFork className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                  <span className="truncate">
                                    Remix of <strong>{flow.originalWorkflowName || "Original"}</strong> by @{flow.originalAuthorName || "Creator"}
                                  </span>
                                </div>
                                {flow.forkedFromId && (
                                  <Link
                                    href={`/webflow/${flow.forkedFromId}`}
                                    className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <span>Original</span>
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </Link>
                                )}
                              </div>
                            )}

                            {/* Title & Description */}
                            <div className="min-w-0">
                              <Link
                                href={`/webflow/${flow._id}`}
                                className="text-base font-black text-nb-fg tracking-tight hover:text-indigo-600 hover:underline break-words line-clamp-2 transition-colors cursor-pointer"
                              >
                                {flow.name}
                              </Link>
                              <p className="mt-1 text-xs text-nb-muted break-words line-clamp-3 leading-relaxed">
                                {flow.description || "No description provided."}
                              </p>
                              {flow.remixNote && (
                                <div className="mt-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 p-2 text-[11px] text-indigo-950 dark:text-indigo-200">
                                  <span className="font-black text-indigo-600 dark:text-indigo-400">💡 Enhancement: </span>
                                  <span className="italic">{flow.remixNote}</span>
                                </div>
                              )}
                            </div>

                            {/* Node Pipeline Glance Ribbon (Mini Node Chain) */}
                            {nodesList.length > 0 && (
                              <div className="rounded-xl border border-nb-border/30 bg-nb-surface-alt/50 p-2 space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-mono text-nb-muted font-bold">
                                  <span>Topology Sequence</span>
                                  <span>{nodesList.length} Steps</span>
                                </div>
                                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
                                  {nodesList.slice(0, 5).map((node, i) => (
                                    <div
                                      key={node.id || i}
                                      className="flex items-center gap-1 rounded bg-nb-card px-1.5 py-0.5 text-[10px] font-bold text-nb-fg border border-nb-border/40 shrink-0"
                                      title={node.data?.label || node.type}
                                    >
                                      {getNodeKindIcon(node.data?.kind || "action")}
                                      <span className="truncate max-w-[70px]">
                                        {node.data?.label || node.data?.kind || "Step"}
                                      </span>
                                      {i < Math.min(nodesList.length - 1, 4) && (
                                        <ChevronRight className="h-2.5 w-2.5 text-nb-muted" />
                                      )}
                                    </div>
                                  ))}
                                  {nodesList.length > 5 && (
                                    <span className="text-[10px] font-mono font-bold text-indigo-500 shrink-0">
                                      +{nodesList.length - 5}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Node & Tool Counters */}
                            <div className="flex items-center gap-2.5 text-xs font-mono text-nb-muted border-t border-nb-border/20 pt-2.5">
                              <span>
                                <strong className="text-nb-fg">{flow.nodes?.length || 0}</strong> nodes
                              </span>
                              <span>•</span>
                              <span>
                                <strong className="text-indigo-600 dark:text-indigo-400">{websiteCount}</strong> tools
                              </span>
                              {flow.forkCount && flow.forkCount > 0 ? (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                    <GitFork className="h-3 w-3" /> {flow.forkCount}
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="mt-4 flex items-center justify-between gap-2 border-t-2 border-nb-border/30 pt-3">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setPreviewFlow(flow)}
                                className="p-1.5 rounded-lg border border-nb-border/40 text-nb-muted hover:text-indigo-600 hover:border-indigo-500 transition-colors cursor-pointer"
                                title="Quick Preview"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuickExportFlow(flow)}
                                className="p-1.5 rounded-lg border border-nb-border/40 text-nb-muted hover:text-indigo-600 hover:border-indigo-500 transition-colors cursor-pointer"
                                title="Export for AI Prompts"
                              >
                                <Bot className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicate(flow._id)}
                                className="p-1.5 rounded-lg border border-nb-border/40 text-nb-muted hover:text-nb-fg transition-colors cursor-pointer"
                                title="Duplicate Workflow"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyShareLink(flow._id)}
                                className="p-1.5 rounded-lg border border-nb-border/40 text-nb-muted hover:text-nb-fg transition-colors cursor-pointer"
                                title="Copy Share Link"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(flow._id, flow.name)}
                                className="p-1.5 rounded-lg border border-nb-border/40 text-nb-muted hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <Link
                              href={`/webflow/${flow._id}`}
                              className="flex items-center gap-1 rounded-xl border-2 border-nb-border bg-indigo-600 px-3 py-1.5 text-xs font-black text-white shadow-nb-xs hover:translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer"
                            >
                              <span>Open Canvas</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* LIST / TABLE VIEW */
                  <div className="rounded-2xl border-3 border-nb-border bg-nb-card overflow-hidden shadow-nb-md">
                    <div className="divide-y-2 divide-nb-border/30">
                      {filteredMyFlows.map((flow) => {
                        const websiteCount = (flow.nodes || []).filter((n) => n.data?.kind === "website").length;
                        const catStyle = CATEGORY_STYLES[flow.category] || CATEGORY_STYLES.Other;

                        return (
                          <div
                            key={flow._id}
                            className="p-4 hover:bg-nb-surface-alt/40 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                          >
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 border border-nb-border shrink-0 font-black">
                                <Workflow className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Link
                                    href={`/webflow/${flow._id}`}
                                    className="text-sm font-black text-nb-fg hover:underline truncate cursor-pointer"
                                  >
                                    {flow.name}
                                  </Link>
                                  <span
                                    className={`rounded-md px-2 py-0.2 text-[9px] font-black border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                                  >
                                    {flow.category}
                                  </span>
                                  {flow.visibility === "public" ? (
                                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-600">
                                      <Globe className="h-2.5 w-2.5" /> Public
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-0.5 text-[9px] text-zinc-500">
                                      <Lock className="h-2.5 w-2.5" /> Private
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-nb-muted truncate max-w-xl">
                                  {flow.description || "No description provided."}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-nb-border/20 pt-2 sm:pt-0">
                              <div className="flex items-center gap-3 text-xs font-mono text-nb-muted">
                                <span>{flow.nodes?.length || 0} nodes</span>
                                <span>•</span>
                                <span>{websiteCount} tools</span>
                                <span>•</span>
                                <span className="flex items-center gap-1 font-bold text-nb-fg">
                                  <Eye className="h-3 w-3 text-indigo-500" /> {flow.viewCount || 0}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPreviewFlow(flow)}
                                  className="p-1.5 rounded-lg border border-nb-border/40 text-nb-muted hover:text-indigo-600 transition-colors cursor-pointer"
                                  title="Quick Preview"
                                >
                                  <Info className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setQuickExportFlow(flow)}
                                  className="p-1.5 rounded-lg border border-nb-border/40 text-nb-muted hover:text-indigo-600 transition-colors cursor-pointer"
                                  title="Export for AI"
                                >
                                  <Bot className="h-3.5 w-3.5" />
                                </button>
                                <Link
                                  href={`/webflow/${flow._id}`}
                                  className="flex items-center gap-1 rounded-xl border-2 border-nb-border bg-indigo-600 px-3 py-1.5 text-xs font-black text-white shadow-nb-xs hover:translate-x-0.5 transition-all cursor-pointer"
                                >
                                  <span>Open</span>
                                  <ArrowRight className="h-3 w-3" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* TAB 2: EXPLORE COMMUNITY WORKFLOWS                                  */}
            {/* ------------------------------------------------------------------- */}
            {activeTab === "explore" && (
              <>
                {filteredExploreFlows.length === 0 ? (
                  <div className="py-20 text-center space-y-3 rounded-3xl border-3 border-dashed border-nb-border/60 bg-nb-card/50">
                    <Globe className="h-10 w-10 text-nb-muted mx-auto" />
                    <p className="text-sm font-black text-nb-fg">No community workflows found</p>
                    <p className="text-xs text-nb-muted">Try selecting another category or resetting your search.</p>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredExploreFlows.map((flow) => {
                      const websiteCount = (flow.nodes || []).filter((n) => n.data?.kind === "website").length;
                      const catStyle = CATEGORY_STYLES[flow.category] || CATEGORY_STYLES.Other;
                      const nodesList = flow.nodes || [];

                      return (
                        <div
                          key={flow._id}
                          className="flex flex-col justify-between rounded-2xl border-3 border-nb-border bg-nb-card p-5 shadow-nb-md transition-all hover:-translate-y-1 hover:shadow-nb-lg"
                        >
                          <div className="space-y-3">
                            {/* Card Header: Category & Author */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`rounded-lg px-2.5 py-0.5 text-[10px] font-black border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                                >
                                  {flow.category}
                                </span>
                                {(flow.isRemix || flow.forkedFromId) && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-400 text-black px-1.5 py-0.5 text-[9px] font-black uppercase shadow-nb-xs border border-black">
                                    <GitFork className="h-2.5 w-2.5" /> Remix
                                  </span>
                                )}
                              </div>
                              <span
                                className="text-[11px] text-nb-muted font-mono truncate max-w-[140px]"
                                title={`Author: ${flow.authorName}`}
                              >
                                by @{flow.authorName || "Community"}
                              </span>
                            </div>

                            {/* Community Remix Attribution */}
                            {(flow.isRemix || flow.forkedFromId) && (
                              <div className="flex flex-wrap items-center justify-between gap-1 rounded-xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 p-2 text-[11px]">
                                <div className="flex items-center gap-1 text-amber-900 dark:text-amber-200 font-semibold truncate">
                                  <GitFork className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                  <span className="truncate">
                                    Evolution of <strong>{flow.originalWorkflowName || "Original"}</strong> by @{flow.originalAuthorName || "Creator"}
                                  </span>
                                </div>
                                {flow.forkedFromId && (
                                  <Link
                                    href={`/webflow/${flow.forkedFromId}`}
                                    className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <span>Original</span>
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </Link>
                                )}
                              </div>
                            )}

                            {/* Title & Description */}
                            <div className="min-w-0">
                              <Link
                                href={`/webflow/${flow._id}`}
                                className="text-base font-black text-nb-fg tracking-tight hover:text-indigo-600 hover:underline break-words line-clamp-2 transition-colors cursor-pointer"
                              >
                                {flow.name}
                              </Link>
                              <p className="mt-1 text-xs text-nb-muted break-words line-clamp-3 leading-relaxed">
                                {flow.description || "Community curated workflow."}
                              </p>
                              {flow.remixNote && (
                                <div className="mt-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 p-2 text-[11px] text-indigo-950 dark:text-indigo-200">
                                  <span className="font-black text-indigo-600 dark:text-indigo-400">💡 Enhancement: </span>
                                  <span className="italic">{flow.remixNote}</span>
                                </div>
                              )}
                            </div>

                            {/* Topology Preview Ribbon */}
                            {nodesList.length > 0 && (
                              <div className="rounded-xl border border-nb-border/30 bg-nb-surface-alt/50 p-2 space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-mono text-nb-muted font-bold">
                                  <span>Topology Sequence</span>
                                  <span>{nodesList.length} Steps</span>
                                </div>
                                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
                                  {nodesList.slice(0, 5).map((node, i) => (
                                    <div
                                      key={node.id || i}
                                      className="flex items-center gap-1 rounded bg-nb-card px-1.5 py-0.5 text-[10px] font-bold text-nb-fg border border-nb-border/40 shrink-0"
                                      title={node.data?.label || node.type}
                                    >
                                      {getNodeKindIcon(node.data?.kind || "action")}
                                      <span className="truncate max-w-[70px]">
                                        {node.data?.label || node.data?.kind || "Step"}
                                      </span>
                                      {i < Math.min(nodesList.length - 1, 4) && (
                                        <ChevronRight className="h-2.5 w-2.5 text-nb-muted" />
                                      )}
                                    </div>
                                  ))}
                                  {nodesList.length > 5 && (
                                    <span className="text-[10px] font-mono font-bold text-indigo-500 shrink-0">
                                      +{nodesList.length - 5}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Node & Tool Counters */}
                            <div className="flex items-center gap-2.5 text-xs font-mono text-nb-muted border-t border-nb-border/20 pt-2.5">
                              <span>
                                <strong className="text-nb-fg">{flow.nodes?.length || 0}</strong> nodes
                              </span>
                              <span>•</span>
                              <span>
                                <strong className="text-indigo-600 dark:text-indigo-400">{websiteCount}</strong> tools
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-bold text-nb-fg">
                                <Eye className="h-3 w-3 text-indigo-500" />
                                <span>{flow.viewCount || 0}</span>
                              </span>
                              {flow.forkCount && flow.forkCount > 0 ? (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                    <GitFork className="h-3 w-3" /> {flow.forkCount}
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="mt-5 flex items-center justify-between gap-2 border-t-2 border-nb-border/30 pt-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleLike(flow._id)}
                                className={`flex items-center gap-1 rounded-xl border-2 px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                                  flow.isLiked
                                    ? "border-rose-500 bg-rose-500 text-white shadow-nb-xs"
                                    : "border-nb-border bg-nb-card text-nb-muted hover:text-rose-600 hover:border-rose-400"
                                }`}
                                title="Upvote workflow"
                              >
                                <Heart className={`h-3.5 w-3.5 ${flow.isLiked ? "fill-white" : ""}`} />
                                <span>{flow.likeCount || 0}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleBookmark(flow._id)}
                                className={`p-1.5 rounded-xl border-2 transition-colors cursor-pointer ${
                                  flow.isBookmarked
                                    ? "border-amber-500 bg-amber-500 text-white"
                                    : "border-nb-border bg-nb-card text-nb-muted hover:text-amber-500"
                                }`}
                                title="Bookmark workflow"
                              >
                                <Bookmark className={`h-3.5 w-3.5 ${flow.isBookmarked ? "fill-white" : ""}`} />
                              </button>

                              <button
                                type="button"
                                onClick={() => setPreviewFlow(flow)}
                                className="p-1.5 rounded-xl border-2 border-nb-border bg-nb-card text-nb-muted hover:text-indigo-600 transition-colors cursor-pointer"
                                title="Quick Preview"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleRemix(flow._id)}
                                className="flex items-center gap-1 rounded-xl border-2 border-nb-border bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 text-xs font-black shadow-nb-xs hover:translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer"
                              >
                                <GitFork className="h-3 w-3" />
                                <span>Remix</span>
                              </button>

                              <Link
                                href={`/webflow/${flow._id}`}
                                className="flex items-center gap-1 rounded-xl border-2 border-nb-border bg-indigo-600 px-3 py-1.5 text-xs font-black text-white shadow-nb-xs hover:translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer"
                              >
                                <span>View</span>
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* LIST VIEW FOR EXPLORE */
                  <div className="rounded-2xl border-3 border-nb-border bg-nb-card overflow-hidden shadow-nb-md divide-y-2 divide-nb-border/30">
                    {filteredExploreFlows.map((flow) => {
                      const catStyle = CATEGORY_STYLES[flow.category] || CATEGORY_STYLES.Other;

                      return (
                        <div
                          key={flow._id}
                          className="p-4 hover:bg-nb-surface-alt/40 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                        >
                          <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 border border-nb-border shrink-0 font-black">
                              <Globe className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                  href={`/webflow/${flow._id}`}
                                  className="text-sm font-black text-nb-fg hover:underline truncate cursor-pointer"
                                >
                                  {flow.name}
                                </Link>
                                <span
                                  className={`rounded-md px-2 py-0.2 text-[9px] font-black border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                                >
                                  {flow.category}
                                </span>
                                <span className="text-[10px] text-nb-muted font-mono">
                                  by @{flow.authorName || "Community"}
                                </span>
                              </div>
                              <p className="text-xs text-nb-muted truncate max-w-xl">
                                {flow.description || "Community curated workflow."}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleLike(flow._id)}
                              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-bold transition-colors cursor-pointer ${
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
                              onClick={() => handleRemix(flow._id)}
                              className="flex items-center gap-1 rounded-xl border-2 border-nb-border bg-emerald-500 text-black px-3 py-1.5 text-xs font-black shadow-nb-xs hover:translate-x-0.5 transition-all cursor-pointer"
                            >
                              <GitFork className="h-3 w-3" />
                              <span>Remix</span>
                            </button>

                            <Link
                              href={`/webflow/${flow._id}`}
                              className="flex items-center gap-1 rounded-xl border-2 border-nb-border bg-indigo-600 px-3 py-1.5 text-xs font-black text-white shadow-nb-xs hover:translate-x-0.5 transition-all cursor-pointer"
                            >
                              <span>View</span>
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

            {/* ------------------------------------------------------------------- */}
            {/* TAB 3: STARTER TEMPLATES                                            */}
            {/* ------------------------------------------------------------------- */}
            {activeTab === "templates" && (
              <div className="space-y-4">
                {/* Tag filter pills if tags exist */}
                {Array.from(new Set(templates.flatMap((t) => t.tags || []))).length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-[11px] font-mono font-bold text-nb-muted flex items-center gap-1">
                      Filter by Tag:
                    </span>
                    {Array.from(new Set(templates.flatMap((t) => t.tags || []))).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        className={`rounded-lg px-2.5 py-0.5 text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                          selectedTag === tag
                            ? "border-nb-border bg-amber-400 text-black shadow-nb-xs"
                            : "border-nb-border/40 bg-nb-card text-nb-muted hover:text-nb-fg"
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map((tpl) => {
                    const templateId = String(tpl.id || tpl.templateKey || tpl.key || tpl._id || tpl.name);
                    const nodeCount = tpl.nodeCount ?? tpl.nodes?.length ?? 0;
                    const catStyle = CATEGORY_STYLES[tpl.category || ""] || CATEGORY_STYLES.Other;
                    const complexity =
                      nodeCount <= 3 ? "Beginner" : nodeCount <= 5 ? "Intermediate" : "Advanced";

                    return (
                      <div
                        key={templateId}
                        className="flex flex-col justify-between rounded-2xl border-3 border-nb-border bg-nb-card p-6 shadow-nb-md transition-all hover:-translate-y-1 hover:shadow-nb-lg"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span
                              className={`rounded-lg px-2.5 py-0.5 text-[10px] font-black border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                            >
                              {tpl.category}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 px-2 py-0.5 text-[10px] font-mono font-black">
                              <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                              <span>{complexity}</span>
                            </span>
                          </div>

                          <h3 className="text-base font-black text-nb-fg tracking-tight">
                            {tpl.name}
                          </h3>
                          <p className="text-xs text-nb-muted leading-relaxed">
                            {tpl.description}
                          </p>

                          {/* Template tags */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {tpl.tags?.map((t: string) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setSelectedTag(t)}
                                className="rounded bg-nb-surface-alt hover:bg-nb-surface-strong px-2 py-0.5 text-[10px] font-mono text-nb-fg border border-nb-border/30 transition-colors cursor-pointer"
                              >
                                #{t}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="mt-6 border-t-2 border-nb-border/30 pt-4 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-mono text-nb-muted">
                            <Layers className="h-3.5 w-3.5 text-indigo-500" />
                            <span>{nodeCount} Nodes</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewFlow(tpl as unknown as WebFlowItem)}
                              className="p-1.5 rounded-xl border-2 border-nb-border bg-nb-card text-nb-muted hover:text-indigo-600 transition-colors cursor-pointer"
                              title="Preview Flow Structure"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUseTemplate(templateId)}
                              className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-indigo-600 px-3.5 py-1.5 text-xs font-black text-white shadow-nb-xs hover:translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                              <span>Use Template</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ========================================================================= */}
      {/* QUICK PREVIEW MODAL                                                       */}
      {/* ========================================================================= */}
      {previewFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border-3 border-nb-border bg-nb-card shadow-nb-xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-nb-border p-5 bg-nb-surface">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-nb-sm">
                  <Workflow className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-nb-fg tracking-tight">{previewFlow.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-nb-muted">
                    <span>{previewFlow.category}</span>
                    <span>•</span>
                    <span>{previewFlow.nodes?.length || 0} configured nodes</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFlow(null)}
                className="h-8 w-8 rounded-xl border-2 border-nb-border bg-nb-card flex items-center justify-center text-nb-muted hover:text-nb-fg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Description */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-nb-muted mb-1">
                  Objective &amp; Description
                </h4>
                <p className="text-xs text-nb-fg leading-relaxed bg-nb-surface-alt/60 p-3 rounded-xl border border-nb-border/40">
                  {previewFlow.description || "No detailed description provided."}
                </p>
              </div>

              {/* Node Sequence List */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-nb-muted mb-2">
                  Pipeline Steps Execution Order
                </h4>
                <div className="space-y-2">
                  {(previewFlow.nodes || []).map((node, idx) => (
                    <div
                      key={node.id || idx}
                      className="flex items-start gap-3 rounded-xl border-2 border-nb-border/40 bg-nb-surface p-3"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-mono font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getNodeKindIcon(node.data?.kind || "")}
                          <span className="text-xs font-black text-nb-fg">
                            {node.data?.label || node.type}
                          </span>
                          <span className="rounded bg-nb-surface-alt px-1.5 py-0.2 text-[9px] font-mono uppercase text-nb-muted">
                            {node.data?.kind || node.type}
                          </span>
                        </div>
                        {node.data?.actionDescription && (
                          <p className="text-[11px] text-nb-muted mt-0.5 leading-snug">
                            {node.data.actionDescription}
                          </p>
                        )}
                        {node.data?.websiteUrl && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-indigo-500 font-mono mt-1">
                            <ExternalLink className="h-2.5 w-2.5" />
                            {node.data.websiteUrl}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="border-t-2 border-nb-border p-4 bg-nb-surface flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPreviewFlow(null)}
                className="rounded-xl border-2 border-nb-border bg-nb-card px-4 py-2 text-xs font-bold text-nb-fg cursor-pointer"
              >
                Close Preview
              </button>

              <div className="flex items-center gap-2">
                {"_id" in previewFlow && previewFlow._id ? (
                  <Link
                    href={`/webflow/${previewFlow._id}`}
                    className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-nb-sm cursor-pointer"
                  >
                    <span>Open in Canvas</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const id = String(
                        ("id" in previewFlow ? (previewFlow as WebFlowTemplateItem).id : null) ||
                        ("templateKey" in previewFlow ? (previewFlow as WebFlowTemplateItem).templateKey : null) ||
                        ("_id" in previewFlow ? (previewFlow as WebFlowItem)._id : null) ||
                        previewFlow.name
                      );
                      handleUseTemplate(id);
                      setPreviewFlow(null);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-nb-sm cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    <span>Use Template</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE WEBFLOW MODAL                                                      */}
      {/* ========================================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-lg rounded-3xl border-3 border-nb-border bg-nb-card p-6 shadow-nb-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-nb-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-nb-xs">
                  <Workflow className="h-4 w-4" />
                </div>
                <h3 className="text-base font-black text-nb-fg">Create New WebFlow</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="h-7 w-7 rounded-lg border-2 border-nb-border bg-nb-card flex items-center justify-center text-nb-muted hover:text-nb-fg cursor-pointer"
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
                  Objective &amp; Description
                </label>
                <textarea
                  rows={2}
                  placeholder="What is the objective and steps of this workflow?"
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
                    <option value="private">🔒 Private (Only me)</option>
                    <option value="public">🌐 Public (Explore Hub)</option>
                    <option value="unlisted">🔗 Unlisted (Direct link)</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t-2 border-nb-border/30 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border-2 border-nb-border bg-nb-card px-4 py-2 text-xs font-bold text-nb-fg shadow-nb-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="rounded-xl border-2 border-nb-border bg-indigo-600 px-5 py-2 text-xs font-black text-white shadow-nb-xs disabled:opacity-50 cursor-pointer"
                >
                  {creating ? "Creating..." : "Create & Open Canvas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK AI EXPORT MODAL FROM HUB                                            */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* AI COPILOT CREATION MODAL (⌘K / Ctrl+K)                                   */}
      {/* ========================================================================= */}
      <AICopilotModal
        isOpen={isAIGenerateOpen}
        onClose={() => setIsAIGenerateOpen(false)}
        mode="create"
      />
    </div>
  );
}
