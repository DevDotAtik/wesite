"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Bell,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCcw,
  Trash2,
  X,
  MoreVertical,
  Check,
  Globe,
  Play,
  Pause,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/navbar";

type MonitorWebsite = {
  _id: string;
  title: string;
  domain: string;
  url: string;
  faviconUrl?: string;
};

type ChangeEntry = {
  detectedAt: string;
  title: string;
  description: string;
  httpStatus: number;
  contentHash: string;
};

type Monitor = {
  _id: string;
  websiteId: MonitorWebsite | string;
  url: string;
  title: string;
  interval: "hourly" | "daily" | "weekly";
  enabled: boolean;
  lastCheckedAt: string | null;
  lastTitle: string;
  lastDescription: string;
  changeCount: number;
  changes: ChangeEntry[];
  createdAt: string;
};

type WebsiteOption = {
  _id: string;
  title: string;
  domain: string;
};

export default function MonitoringPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [websites, setWebsites] = useState<WebsiteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState("");
  const [selectedInterval, setSelectedInterval] = useState<"hourly" | "daily" | "weekly">("daily");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Multi-selection & 3-dots menu state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Outside click and Escape key dismissal for 3-dots menus
  useEffect(() => {
    if (!openMenuId) return;

    const handleDismiss = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-monitor-menu]")) {
        setOpenMenuId(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };

    document.addEventListener("mousedown", handleDismiss);
    document.addEventListener("touchstart", handleDismiss);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleDismiss);
      document.removeEventListener("touchstart", handleDismiss);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuId]);

  const load = useCallback(async () => {
    try {
      const monRes = await fetch("/api/monitors");
      if (monRes.ok) setMonitors((await monRes.json()).monitors ?? []);
    } catch {
      toast.error("Failed to load monitors");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWebsites = useCallback(async () => {
    if (websites.length > 0) return;
    try {
      const webRes = await fetch("/api/websites?limit=200&sort=smart");
      if (webRes.ok) setWebsites((await webRes.json()).websites ?? []);
    } catch {
      toast.error("Failed to load websites");
    }
  }, [websites.length]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  // Add Monitor
  async function addMonitor() {
    if (!selectedWebsite) return;
    try {
      const response = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId: selectedWebsite, interval: selectedInterval }),
      });
      if (response.ok) {
        toast.success("Website added to active monitors!");
        setAddOpen(false);
        setSelectedWebsite("");
        load();
      } else {
        const err = await response.json().catch(() => null);
        toast.error(err?.error || "Failed to add monitor");
      }
    } catch {
      toast.error("Network error adding monitor");
    }
  }

  // Delete Single Monitor
  async function deleteMonitor(id: string, title?: string) {
    if (!window.confirm(`Stop monitoring "${title || "this website"}"?`)) return;
    try {
      const res = await fetch(`/api/monitors/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Stopped monitoring website");
        setMonitors((prev) => prev.filter((m) => m._id !== id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        toast.error("Failed to delete monitor");
      }
    } catch {
      toast.error("Network error deleting monitor");
    }
  }

  // Toggle Monitor
  async function toggleMonitor(id: string, enabled: boolean) {
    try {
      const res = await fetch(`/api/monitors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        setMonitors((prev) =>
          prev.map((m) => (m._id === id ? { ...m, enabled } : m))
        );
        toast.success(enabled ? "Monitoring enabled" : "Monitoring paused");
      } else {
        toast.error("Failed to update monitor status");
      }
    } catch {
      toast.error("Error toggling monitor");
    }
  }

  // Run Check
  async function runCheck() {
    setChecking(true);
    const toastId = toast.loading("Checking websites for updates...");
    try {
      const res = await fetch("/api/monitors/check", { method: "POST" });
      if (res.ok) {
        toast.success("Website check completed successfully!", { id: toastId });
        load();
      } else {
        toast.error("Website check failed", { id: toastId });
      }
    } catch {
      toast.error("Network error running check", { id: toastId });
    } finally {
      setChecking(false);
    }
  }

  // Toggle Select Monitor
  const toggleSelectMonitor = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle Select All
  const toggleSelectAll = () => {
    if (selectedIds.size === monitors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(monitors.map((m) => m._id)));
    }
  };

  // Batch Delete
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to stop monitoring ${selectedIds.size} selected website${
          selectedIds.size > 1 ? "s" : ""
        }?`
      )
    )
      return;

    setIsBatchDeleting(true);
    const toastId = toast.loading(`Deleting ${selectedIds.size} monitors...`);
    try {
      const res = await fetch("/api/monitors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (res.ok) {
        toast.success(`Removed ${selectedIds.size} monitors`, { id: toastId });
        setMonitors((prev) => prev.filter((m) => !selectedIds.has(m._id)));
        setSelectedIds(new Set());
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Batch delete failed", { id: toastId });
      }
    } catch {
      toast.error("Error during batch delete", { id: toastId });
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // Batch Toggle (Pause or Resume all selected)
  const handleBatchToggle = async (enable: boolean) => {
    if (selectedIds.size === 0) return;
    const toastId = toast.loading(`${enable ? "Enabling" : "Pausing"} ${selectedIds.size} monitors...`);
    try {
      const res = await fetch("/api/monitors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), enabled: enable }),
      });
      if (res.ok) {
        toast.success(
          `${enable ? "Enabled" : "Paused"} ${selectedIds.size} monitors`,
          { id: toastId }
        );
        setMonitors((prev) =>
          prev.map((m) => (selectedIds.has(m._id) ? { ...m, enabled: enable } : m))
        );
      } else {
        toast.error("Failed to update monitors", { id: toastId });
      }
    } catch {
      toast.error("Error updating batch monitor status", { id: toastId });
    }
  };

  const monitoredIds = new Set(
    monitors.map((m) => (typeof m.websiteId === "string" ? m.websiteId : m.websiteId._id))
  );

  return (
    <div className="min-h-screen bg-nb-bg selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 nb-page-enter">
        <div className="rounded-2xl border-2 sm:border-3 border-nb-border bg-nb-card shadow-nb-md overflow-visible">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 border-b-2 sm:border-b-3 border-nb-border p-4 sm:p-6 bg-nb-surface">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl border-2 border-nb-border bg-indigo-600 text-white shadow-nb-xs shrink-0 font-black">
                <Bell className="size-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-nb-fg tracking-tight">
                  Website Monitoring
                </h1>
                <p className="mt-0.5 text-xs sm:text-sm text-nb-muted">
                  Track content changes on your saved websites and get notified automatically.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
              <button
                type="button"
                onClick={runCheck}
                disabled={checking}
                className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-nb-card px-3 py-1.5 text-xs font-black text-nb-fg shadow-nb-xs hover:bg-nb-surface-alt transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCcw className={`size-3.5 ${checking ? "animate-spin text-indigo-500" : ""}`} />
                <span>{checking ? "Checking..." : "Check Now"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!addOpen) loadWebsites();
                  setAddOpen(!addOpen);
                }}
                className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-indigo-600 px-3.5 py-1.5 text-xs font-black text-white shadow-nb-xs hover:bg-indigo-500 hover:translate-x-0.5 transition-all cursor-pointer"
              >
                <Plus className="size-4" />
                <span>{addOpen ? "Close" : "Monitor Site"}</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {loading ? (
              <div className="grid min-h-64 place-items-center">
                <div className="text-center space-y-2">
                  <Loader2 className="size-8 animate-spin text-indigo-600 mx-auto" />
                  <p className="text-xs font-bold text-nb-fg">Loading website monitors...</p>
                </div>
              </div>
            ) : (
              <>
                {/* KPI Stats Cards */}
                <div className="mb-6 grid gap-3 grid-cols-1 sm:grid-cols-3">
                  {[
                    { label: "Total Monitored", value: monitors.length, accent: "#6366f1", sub: "Websites configured" },
                    { label: "Active Monitors", value: monitors.filter((m) => m.enabled).length, accent: "#10b981", sub: "Running checks" },
                    {
                      label: "Changes Detected",
                      value: monitors.reduce((sum, m) => sum + m.changeCount, 0),
                      accent: "#f59e0b",
                      sub: "Logged updates",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border-2 border-nb-border bg-nb-surface-alt p-3.5 shadow-nb-xs transition-transform hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-wider text-nb-muted">
                          {stat.label}
                        </p>
                        <span className="size-2 rounded-full" style={{ background: stat.accent }} />
                      </div>
                      <p className="mt-1.5 text-2xl font-black text-nb-fg">{stat.value}</p>
                      <p className="text-[10px] font-medium text-nb-muted">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Add Monitor Panel */}
                {addOpen && (
                  <div className="mb-6 rounded-2xl border-2 border-nb-border bg-nb-surface p-4 shadow-nb-sm animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between mb-3 border-b border-nb-border/30 pb-2">
                      <div className="flex items-center gap-2">
                        <Plus className="size-4 text-indigo-600" />
                        <h2 className="text-sm font-black text-nb-fg">Add Website to Monitor</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAddOpen(false)}
                        className="p-1 rounded-lg text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt transition-colors cursor-pointer"
                        title="Close"
                      >
                        <X className="size-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-7">
                        <label className="block text-xs font-black text-nb-fg mb-1">
                          Select Saved Website
                        </label>
                        <select
                          value={selectedWebsite}
                          onChange={(e) => setSelectedWebsite(e.target.value)}
                          className="w-full rounded-xl border-2 border-nb-border bg-nb-card px-3 py-2 text-xs font-bold text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="">Select a website from your collection...</option>
                          {websites
                            .filter((w) => !monitoredIds.has(w._id))
                            .map((w) => (
                              <option key={w._id} value={w._id}>
                                {w.title || w.domain} ({w.domain})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-black text-nb-fg mb-1">
                          Check Frequency
                        </label>
                        <select
                          value={selectedInterval}
                          onChange={(e) => setSelectedInterval(e.target.value as typeof selectedInterval)}
                          className="w-full rounded-xl border-2 border-nb-border bg-nb-card px-3 py-2 text-xs font-bold text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="hourly">Hourly checks</option>
                          <option value="daily">Daily checks</option>
                          <option value="weekly">Weekly checks</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={addMonitor}
                          disabled={!selectedWebsite}
                          className="w-full rounded-xl border-2 border-nb-border bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-nb-xs hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Plus className="size-3.5" />
                          <span>Start</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Monitor List */}
                {monitors.length ? (
                  <div className="space-y-3">
                    {/* Header Filter / Selection summary */}
                    <div className="flex items-center justify-between text-xs font-black text-nb-muted px-1">
                      <span>Monitored Websites ({monitors.length})</span>
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        {selectedIds.size === monitors.length ? "Deselect All" : "Select All"}
                      </button>
                    </div>

                    <div className="rounded-2xl border-2 sm:border-3 border-nb-border bg-nb-card overflow-visible shadow-nb-sm divide-y-2 divide-nb-border/30">
                      {monitors.map((monitor) => {
                        const site = typeof monitor.websiteId === "object" ? monitor.websiteId : null;
                        const isExpanded = expandedId === monitor._id;
                        const isSelected = selectedIds.has(monitor._id);

                        return (
                          <div
                            key={monitor._id}
                            className={`transition-colors overflow-visible ${
                              isSelected ? "bg-indigo-50/20" : "hover:bg-nb-surface-alt/40"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:p-4">
                              <div className="flex items-start sm:items-center gap-3 min-w-0">
                                {/* Checkbox: Always visible on mobile, hover/selected on desktop */}
                                <button
                                  type="button"
                                  onClick={(e) => toggleSelectMonitor(monitor._id, e)}
                                  aria-label={isSelected ? "Deselect monitor" : "Select monitor"}
                                  title={isSelected ? "Deselect monitor" : "Select monitor"}
                                  className={`flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all cursor-pointer mt-0.5 sm:mt-0 ${
                                    isSelected
                                      ? "border-indigo-600 bg-indigo-600 text-white shadow-nb-xs opacity-100"
                                      : "border-nb-border/60 bg-nb-surface text-transparent hover:border-indigo-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                  }`}
                                >
                                  <Check className="size-3.5 stroke-[3] text-white" />
                                </button>

                                {/* Favicon / Status icon */}
                                {site?.faviconUrl ? (
                                  <Image
                                    src={site.faviconUrl}
                                    alt=""
                                    width={28}
                                    height={28}
                                    className="size-7 sm:size-8 shrink-0 rounded-lg border-2 border-nb-border object-contain p-0.5 bg-nb-surface"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="flex size-7 sm:size-8 items-center justify-center rounded-lg border-2 border-nb-border bg-indigo-600 text-white font-black text-xs shrink-0">
                                    <Globe className="size-4" />
                                  </div>
                                )}

                                {/* Monitor Info */}
                                <div className="min-w-0 space-y-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-black text-nb-fg truncate">
                                      {monitor.title || site?.title || monitor.url}
                                    </span>

                                    {monitor.changeCount > 0 ? (
                                      <span className="rounded-md border border-amber-600 bg-amber-400 text-black px-1.5 py-0.2 text-[9px] font-black uppercase shadow-nb-xs">
                                        {monitor.changeCount} change{monitor.changeCount !== 1 ? "s" : ""}
                                      </span>
                                    ) : null}

                                    <span
                                      className={`rounded-md border px-1.5 py-0.2 text-[9px] font-black uppercase ${
                                        monitor.enabled
                                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600"
                                          : "border-zinc-400 bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                      }`}
                                    >
                                      {monitor.enabled ? "Active" : "Paused"}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 text-[11px] font-mono text-nb-muted flex-wrap">
                                    <span className="capitalize">{monitor.interval} check</span>
                                    <span>•</span>
                                    <span>
                                      {monitor.lastCheckedAt
                                        ? `Last: ${new Date(monitor.lastCheckedAt).toLocaleDateString([], {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}`
                                        : "Never checked"}
                                    </span>
                                    {site?.domain && (
                                      <>
                                        <span>•</span>
                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold truncate max-w-[140px]">
                                          {site.domain}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons (Log Toggle + Single 3-Dots Menu) */}
                              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-nb-border/20">
                                {/* Change logs toggle pill */}
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(isExpanded ? null : monitor._id)}
                                  className={`rounded-xl border-2 px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                                    isExpanded
                                      ? "border-indigo-600 bg-indigo-600 text-white shadow-nb-xs"
                                      : "border-nb-border bg-nb-surface text-nb-muted hover:text-nb-fg hover:border-indigo-400"
                                  }`}
                                >
                                  {monitor.changes?.length
                                    ? `${monitor.changes.length} Logs ${isExpanded ? "▲" : "▼"}`
                                    : "No Logs"}
                                </button>

                                {/* Direct External Link on Desktop */}
                                <a
                                  href={monitor.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hidden sm:flex size-8 items-center justify-center rounded-lg border-2 border-nb-border bg-nb-card text-nb-muted hover:text-indigo-600 hover:bg-nb-surface-alt transition-colors shadow-nb-xs cursor-pointer"
                                  title="Open website"
                                >
                                  <ExternalLink className="size-3.5" />
                                </a>

                                {/* Strictly ONE 3-Dots Action Menu */}
                                <div className="relative shrink-0" data-monitor-menu>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setOpenMenuId((cur) => (cur === monitor._id ? null : monitor._id));
                                    }}
                                    aria-label="More options"
                                    title="More options"
                                    className="flex size-8 items-center justify-center rounded-lg border-2 border-nb-border bg-nb-card text-nb-fg shadow-nb-xs active:scale-95 transition-all hover:bg-nb-surface-alt cursor-pointer"
                                  >
                                    <MoreVertical className="size-4" />
                                  </button>

                                  {openMenuId === monitor._id && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute right-0 top-9 z-50 min-w-48 rounded-xl border-2 border-nb-border bg-nb-card p-1.5 shadow-nb-xl space-y-0.5 text-xs font-bold animate-in fade-in zoom-in-95 duration-100 text-nb-fg select-none"
                                      style={{ borderColor: "var(--nb-border)", background: "var(--nb-card)" }}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          toggleMonitor(monitor._id, !monitor.enabled);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-nb-surface-alt transition-colors cursor-pointer"
                                      >
                                        {monitor.enabled ? (
                                          <>
                                            <Pause className="size-3.5 text-amber-500" />
                                            <span>Pause Monitoring</span>
                                          </>
                                        ) : (
                                          <>
                                            <Play className="size-3.5 text-emerald-500" />
                                            <span>Resume Monitoring</span>
                                          </>
                                        )}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          setExpandedId(isExpanded ? null : monitor._id);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-nb-surface-alt transition-colors cursor-pointer"
                                      >
                                        <Clock3 className="size-3.5 text-indigo-500" />
                                        <span>{isExpanded ? "Hide Change Logs" : "View Change Logs"}</span>
                                      </button>

                                      <a
                                        href={monitor.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={() => setOpenMenuId(null)}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-nb-surface-alt hover:text-indigo-600 transition-colors cursor-pointer"
                                      >
                                        <ExternalLink className="size-3.5 text-blue-500" />
                                        <span>Open Website</span>
                                      </a>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          setOpenMenuId(null);
                                          toggleSelectMonitor(monitor._id, e);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-nb-surface-alt transition-colors cursor-pointer"
                                      >
                                        <Check className="size-3.5 text-emerald-500" />
                                        <span>{isSelected ? "Deselect Monitor" : "Select Monitor"}</span>
                                      </button>

                                      <div className="my-1 border-t border-nb-border/30" />

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          deleteMonitor(monitor._id, monitor.title || site?.title || monitor.url);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="size-3.5" />
                                        <span>Stop Monitoring</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Expanded Change Log Accordion */}
                            {isExpanded && (
                              <div className="border-t-2 border-nb-border/30 bg-nb-surface p-3.5 sm:p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-xs font-black uppercase tracking-wider text-nb-muted flex items-center gap-1.5">
                                    <Clock3 className="size-3.5 text-indigo-500" />
                                    <span>Detected Change Logs</span>
                                  </h3>
                                  <span className="text-[10px] font-mono font-bold text-nb-muted">
                                    {monitor.changes?.length || 0} event{monitor.changes?.length !== 1 ? "s" : ""}
                                  </span>
                                </div>

                                {monitor.changes && monitor.changes.length > 0 ? (
                                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                                    {monitor.changes
                                      .slice()
                                      .reverse()
                                      .map((change, i) => (
                                        <div
                                          key={`${change.contentHash || i}-${change.detectedAt}`}
                                          className="rounded-xl border border-nb-border/40 bg-nb-card p-3 flex items-start gap-3 shadow-nb-xs"
                                        >
                                          <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-emerald-500" />
                                          <div className="min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm font-black text-nb-fg">
                                              {change.title || "Page Content Updated"}
                                            </p>
                                            {change.description ? (
                                              <p className="text-xs mt-1 text-nb-muted leading-relaxed">
                                                {change.description}
                                              </p>
                                            ) : null}
                                            <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-nb-muted flex-wrap">
                                              <span>{new Date(change.detectedAt).toLocaleString()}</span>
                                              <span>•</span>
                                              <span className="rounded bg-nb-surface-alt px-1.5 py-0.2 border border-nb-border/30 font-bold">
                                                HTTP {change.httpStatus}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                ) : (
                                  <div className="py-4 text-center text-xs text-nb-muted font-bold">
                                    No changes detected yet. We will record updates here as soon as they are found!
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Empty State */
                  <div className="rounded-2xl border-2 border-dashed border-nb-border/60 bg-nb-surface-alt/40 grid min-h-64 place-items-center text-center p-6">
                    <div className="max-w-sm space-y-2">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border-2 border-nb-border bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
                        <Bell className="size-6" />
                      </div>
                      <p className="text-sm font-black text-nb-fg">No websites monitored yet</p>
                      <p className="text-xs text-nb-muted leading-relaxed">
                        Add key websites to watch for title, description, or content modifications.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          loadWebsites();
                          setAddOpen(true);
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-nb-xs hover:bg-indigo-500 cursor-pointer"
                      >
                        <Plus className="size-4" />
                        <span>Start Monitoring</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* FLOATING BATCH SELECTION BAR (Bottom)                                     */}
      {/* ========================================================================= */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 rounded-2xl border-2 border-nb-border bg-nb-card p-2 sm:px-4 sm:py-3 shadow-nb-xl max-w-[95vw] animate-in fade-in slide-in-from-bottom-4 text-xs font-bold text-nb-fg">
          <span className="font-black whitespace-nowrap">{selectedIds.size} selected</span>
          <div className="h-4 w-[1px] bg-nb-border/40 shrink-0" />

          <button
            type="button"
            onClick={toggleSelectAll}
            className="rounded-xl border border-nb-border/40 bg-nb-surface px-2.5 py-1.5 hover:bg-nb-surface-alt transition-colors whitespace-nowrap cursor-pointer"
          >
            {selectedIds.size === monitors.length ? "Deselect All" : "Select All"}
          </button>

          <button
            type="button"
            onClick={() => handleBatchToggle(true)}
            className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-nb-border/40 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-2.5 py-1.5 hover:bg-emerald-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Play className="size-3" />
            <span>Resume</span>
          </button>

          <button
            type="button"
            onClick={() => handleBatchToggle(false)}
            className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-nb-border/40 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 px-2.5 py-1.5 hover:bg-amber-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Pause className="size-3" />
            <span>Pause</span>
          </button>

          <button
            type="button"
            onClick={handleBatchDelete}
            disabled={isBatchDeleting}
            className="rounded-xl border-2 border-rose-600 bg-rose-500 text-white px-2.5 py-1.5 hover:bg-rose-600 shadow-nb-xs transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isBatchDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            <span>Delete ({selectedIds.size})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="p-1.5 rounded-lg text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt transition-colors cursor-pointer"
            title="Clear selection"
            aria-label="Clear selection"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
