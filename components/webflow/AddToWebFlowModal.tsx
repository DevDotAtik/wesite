"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Workflow,
  Plus,
  X,
  Globe,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { WebsiteItem } from "@/components/grid/WebsiteCard";

interface WebFlowListItem {
  _id: string;
  name: string;
  description?: string;
  nodes?: unknown[];
  category?: string;
  updatedAt?: string;
}

interface AddToWebFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  website: WebsiteItem | null;
}

const subscribe = () => () => {};

export function AddToWebFlowModal({
  isOpen,
  onClose,
  website,
}: AddToWebFlowModalProps) {
  const router = useRouter();
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const [loading, setLoading] = useState(false);
  const [flows, setFlows] = useState<WebFlowListItem[]>([]);
  const [loadingFlows, setLoadingFlows] = useState(false);
  const [customFlowName, setCustomFlowName] = useState("");

  const defaultFlowName = website?.title ? `${website.title} Workflow` : "New WebFlow";
  const newFlowName = customFlowName.trim() ? customFlowName : defaultFlowName;

  // Lock body scroll and listen for Escape key when open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Load existing workflows
  useEffect(() => {
    let ignore = false;
    if (isOpen && website) {
      const fetchWorkflows = async () => {
        await Promise.resolve();
        if (ignore) return;
        setLoadingFlows(true);
        try {
          const res = await fetch("/api/webflows?scope=my&limit=40");
          if (!res.ok) throw new Error();
          const data = await res.json();
          if (!ignore) setFlows(data.webflows || []);
        } catch {
          if (!ignore) setFlows([]);
        } finally {
          if (!ignore) setLoadingFlows(false);
        }
      };
      fetchWorkflows();
    }
    return () => {
      ignore = true;
    };
  }, [isOpen, website]);

  if (!isClient || !isOpen || !website) return null;

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowName.trim()) return;

    try {
      setLoading(true);
      const res = await fetch("/api/webflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFlowName.trim(),
          description: `Workflow utilizing ${website.title || website.domain}`,
          initialWebsiteId: website._id,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please log in to create a WebFlow");
          router.push("/login");
          return;
        }
        throw new Error(data.error || data.message || "Failed to create workflow");
      }

      toast.success("WebFlow created with tool!");
      onClose();
      router.push(`/webflow/${data.webflow._id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create workflow";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToExisting = async (flowId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/webflows/${flowId}/add-website`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId: website._id,
          action: "Interact with tool",
          actionDescription: website.description || "",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please log in to update this WebFlow");
          router.push("/login");
          return;
        }
        throw new Error(data.error || data.message || "Failed to attach website");
      }

      toast.success("Tool attached to WebFlow!");
      onClose();
      router.push(`/webflow/${flowId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add to workflow";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl border-3 border-nb-border bg-nb-card p-5 sm:p-6 shadow-nb-xl animate-in fade-in zoom-in-95 duration-150 text-nb-fg">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-nb-border pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-nb-sm border border-nb-border">
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-nb-fg">Add Tool to WebFlow</h3>
              <p className="text-[11px] text-nb-muted">Use this website as a reusable workflow node</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selected Website Preview Card */}
        <div className="flex items-center gap-3 rounded-xl border-2 border-nb-border bg-nb-surface-alt p-3 mb-4">
          {website.faviconUrl ? (
            <img
              src={website.faviconUrl}
              alt=""
              className="h-8 w-8 rounded-lg border border-nb-border object-contain shrink-0 bg-white p-0.5"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 border border-indigo-200 shrink-0">
              <Globe className="h-4 w-4" />
            </div>
          )}
          <div className="overflow-hidden min-w-0 flex-1">
            <h4 className="text-xs font-black text-nb-fg truncate">
              {website.title || website.domain}
            </h4>
            <p className="text-[10px] font-mono text-nb-muted truncate">{website.url}</p>
          </div>
        </div>

        {/* Option A: Start New Flow */}
        <form onSubmit={handleCreateNew} className="space-y-2.5 mb-4 border-b-2 border-nb-border/30 pb-4">
          <label className="block text-xs font-black text-nb-fg uppercase tracking-wider">
            Option 1: Start a New WebFlow
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={newFlowName}
              onChange={(e) => setCustomFlowName(e.target.value)}
              placeholder="e.g. Price Scraper & Alert"
              className="flex-1 rounded-xl border-2 border-nb-border bg-nb-surface px-3 py-2 text-xs font-bold text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !newFlowName.trim()}
              className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>Create</span>
            </button>
          </div>
        </form>

        {/* Option B: Add to Existing Flow */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black text-nb-fg uppercase tracking-wider">
              Option 2: Add to Existing WebFlow
            </label>
            {flows.length > 0 && (
              <span className="text-[10px] font-mono text-nb-muted">{flows.length} available</span>
            )}
          </div>

          {loadingFlows ? (
            <div className="text-center py-6 text-xs text-nb-muted space-y-2">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-indigo-600" />
              <span>Loading your workflows...</span>
            </div>
          ) : flows.length === 0 ? (
            <div className="text-center py-5 rounded-xl border-2 border-dashed border-nb-border/40 bg-nb-surface-alt/50 text-xs text-nb-muted italic">
              No existing workflows found. Use Option 1 above to create your first flow!
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
              {flows.map((flow) => (
                <button
                  key={flow._id}
                  type="button"
                  onClick={() => handleAddToExisting(flow._id)}
                  disabled={loading}
                  className="w-full flex items-center justify-between rounded-xl border-2 border-nb-border/40 bg-nb-surface p-2.5 text-left text-xs hover:border-indigo-500 hover:bg-nb-surface-alt transition-all group shadow-2xs"
                >
                  <div className="overflow-hidden min-w-0 pr-2">
                    <span className="font-bold text-nb-fg block truncate group-hover:text-indigo-600">
                      {flow.name}
                    </span>
                    <span className="text-[10px] text-nb-muted font-mono">
                      {flow.nodes?.length || 0} nodes • {flow.category}
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-nb-muted group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
