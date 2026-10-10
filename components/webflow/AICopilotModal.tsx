"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ArrowRight,
  Zap,
  Settings2,
  Key,
  Check,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AIIcon } from "./AIIcon";
import type { WebFlowNode, WebFlowEdge } from "@/lib/webflow/types";

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGraph?: (result: {
    nodes: WebFlowNode[];
    edges: WebFlowEdge[];
    summaryOfChanges?: string;
  }) => void;
  currentNodes?: WebFlowNode[];
  currentEdges?: WebFlowEdge[];
  mode?: "create" | "editor";
}

const PROMPT_SUGGESTIONS = [
  {
    title: "Price Drop Alert & Tracker",
    tag: "Branching",
    prompt: "Monitor product prices on Amazon. If current price drops below target threshold and is in stock, send an instant Telegram alert; otherwise wait 1 hour.",
  },
  {
    title: "PR Code Review & Triage",
    tag: "DevOps",
    prompt: "Automate code triage: fetch GitHub PR diff, analyze regressions and security bugs using AI, and post report to Slack.",
  },
  {
    title: "Video Transcript Repurposing",
    tag: "Content",
    prompt: "Turn a YouTube video into a social post: extract transcript, draft a high-impact technical post with ChatGPT, human review, and publish to LinkedIn.",
  },
  {
    title: "Lead Generation & Outreach",
    tag: "Sales",
    prompt: "Build an outreach pipeline: find leads on Apollo.io, write tailored personalized pitches using AI, human review, and dispatch via Gmail.",
  },
  {
    title: "Add Validation Condition Node",
    tag: "Step Edit",
    prompt: "Insert a conditional branch node checking if API response status is 200, with TRUE continuing to next task and FALSE triggering an alert.",
  },
  {
    title: "Append Slack Alert Step",
    tag: "Add Step",
    prompt: "Add a Slack notification action node at the end of the workflow to broadcast the execution result.",
  },
];

export function AICopilotModal({
  isOpen,
  onClose,
  onApplyGraph,
  currentNodes = [],
  currentEdges = [],
  mode = "create",
}: AICopilotModalProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [provider, setProvider] = useState<"builtin" | "gemini" | "openai">(() => {
    if (typeof window === "undefined") return "builtin";
    try {
      const stored = localStorage.getItem("wf_ai_provider");
      if (stored === "gemini" || stored === "openai" || stored === "builtin") return stored;
    } catch {
      // Ignore
    }
    return "builtin";
  });

  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("wf_ai_key") || "";
    } catch {
      // Ignore
    }
    return "";
  });

  const [savedKeyStatus, setSavedKeyStatus] = useState(false);

  // Focus textarea when drawer slides up
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    try {
      localStorage.setItem("wf_ai_provider", provider);
      localStorage.setItem("wf_ai_key", apiKey.trim());
      setSavedKeyStatus(true);
      setTimeout(() => setSavedKeyStatus(false), 2000);
      toast.success("AI preferences saved.");
    } catch {
      toast.error("Could not access browser storage.");
    }
  };

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) {
      toast.error("Please enter a description for your workflow.");
      return;
    }

    setLoading(true);
    try {
      toast.loading(
        mode === "create"
          ? "Synthesizing workflow graph and matching tools..."
          : "Analyzing canvas topology and inserting steps..."
      );

      const res = await fetch("/api/webflows/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt.trim(),
          mode: mode === "editor" ? "refine" : "create",
          currentNodes,
          currentEdges,
          apiKey: provider !== "builtin" && apiKey ? apiKey.trim() : undefined,
          provider: provider === "openai" ? "openai" : "gemini",
        }),
      });

      const data = await res.json().catch(() => ({}));
      toast.dismiss();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to generate workflow");
      }

      if (mode === "editor" && onApplyGraph) {
        onApplyGraph({
          nodes: data.nodes,
          edges: data.edges,
          summaryOfChanges: data.summaryOfChanges,
        });
        toast.success(data.summaryOfChanges || "Workflow updated successfully!");
        setPrompt("");
        onClose();
      } else {
        // Create in DB and navigate to the new workflow editor
        const createRes = await fetch("/api/webflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            description: data.description,
            category: data.category || "Productivity",
            nodes: data.nodes,
            edges: data.edges,
            variables: data.variables || [],
          }),
        });

        const createData = await createRes.json().catch(() => ({}));
        if (!createRes.ok) {
          throw new Error(createData.error || "Failed to persist synthesized workflow");
        }

        toast.success("Workflow generated! Launching canvas...");
        setPrompt("");
        onClose();
        router.push(`/webflow/${createData.webflow._id}`);
      }
    } catch (err: unknown) {
      toast.dismiss();
      const message = err instanceof Error ? err.message : "Could not generate workflow";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <>
      {/* Solid Opaque Dark Backdrop with dismiss */}
      <div
        className="fixed inset-0 z-40 bg-black/60 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-Up Bottom Drawer (Docked to bottom of screen like ChatGPT) */}
      <div
        className={`fixed bottom-0 inset-x-0 z-50 md:bottom-2 md:left-1/2 md:-translate-x-1/2 md:w-[880px] md:max-w-[95vw] rounded-t-2xl md:rounded-2xl border-3 border-nb-border bg-nb-card shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-out animate-in slide-in-from-bottom-8 ${
          isExpanded ? "h-[85vh] max-h-[700px]" : "h-[460px] max-h-[85vh]"
        }`}
      >
        {/* Top Grip Bar & Header */}
        <div className="flex items-center justify-between border-b-3 border-nb-border bg-nb-surface px-4 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400 text-black font-black border-2 border-nb-border shadow-nb-xs shrink-0">
              <AIIcon className="h-5 w-5" glow />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black tracking-tight text-nb-fg">
                  WebFlow AI Copilot
                </span>
                <span className="rounded-md bg-indigo-600 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-white border border-nb-border">
                  {provider === "builtin" ? "Built-in" : provider === "gemini" ? "Gemini" : "GPT-4o"}
                </span>
              </div>
              <p className="text-[10px] text-nb-muted font-bold line-clamp-1">
                {mode === "create"
                  ? "Describe any real-world workflow to synthesize full graph"
                  : "Instruct AI to append steps, branch conditions, or wire tools"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowSettings((prev) => !prev)}
              className={`rounded-lg border-2 p-1.5 transition-colors ${
                showSettings
                  ? "bg-indigo-600 text-white border-nb-border font-bold shadow-nb-xs"
                  : "border-nb-border/40 bg-nb-card text-nb-fg hover:border-nb-border"
              }`}
              title="Configure AI Engine & API Key"
            >
              <Settings2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="rounded-lg border-2 border-nb-border/40 bg-nb-card p-1.5 text-nb-fg hover:border-nb-border transition-colors hidden sm:block"
              title={isExpanded ? "Collapse height" : "Expand height"}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border-2 border-nb-border bg-nb-card p-1.5 text-nb-fg hover:bg-rose-500 hover:text-white hover:border-black transition-colors"
              title="Close AI Copilot (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Settings Drawer */}
        {showSettings && (
          <div className="bg-nb-surface-alt border-b-2 border-nb-border p-3.5 space-y-3 shrink-0 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-nb-fg flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-indigo-500" /> AI Engine Configuration
              </span>
              <span className="text-[10px] text-nb-muted">Stored securely in browser</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProvider("builtin")}
                className={`p-2 rounded-xl border-2 text-left transition-all ${
                  provider === "builtin"
                    ? "border-nb-border bg-indigo-600 text-white font-black shadow-nb-xs"
                    : "border-nb-border/40 bg-nb-card text-nb-fg"
                }`}
              >
                <div className="text-xs">⚡ Built-in Engine</div>
                <div className="text-[10px] opacity-80">Free, instant offline</div>
              </button>

              <button
                type="button"
                onClick={() => setProvider("gemini")}
                className={`p-2 rounded-xl border-2 text-left transition-all ${
                  provider === "gemini"
                    ? "border-nb-border bg-indigo-600 text-white font-black shadow-nb-xs"
                    : "border-nb-border/40 bg-nb-card text-nb-fg"
                }`}
              >
                <div className="text-xs">✨ Google Gemini</div>
                <div className="text-[10px] opacity-80">1.5 Flash Model</div>
              </button>

              <button
                type="button"
                onClick={() => setProvider("openai")}
                className={`p-2 rounded-xl border-2 text-left transition-all ${
                  provider === "openai"
                    ? "border-nb-border bg-indigo-600 text-white font-black shadow-nb-xs"
                    : "border-nb-border/40 bg-nb-card text-nb-fg"
                }`}
              >
                <div className="text-xs">🧠 OpenAI</div>
                <div className="text-[10px] opacity-80">GPT-4o-mini Model</div>
              </button>
            </div>

            {provider !== "builtin" && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="password"
                  placeholder={`Enter your ${provider === "gemini" ? "Gemini" : "OpenAI"} API Key`}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 rounded-xl border-2 border-nb-border bg-nb-card px-3 py-1.5 text-xs font-mono text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="flex items-center gap-1 rounded-xl border-2 border-nb-border bg-nb-card hover:bg-nb-surface px-3 py-1.5 text-xs font-bold text-nb-fg shadow-nb-xs transition-colors"
                >
                  {savedKeyStatus ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : null}
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-3 bg-nb-card">
          {/* Quick Suggestions Chips Carousel (ChatGPT-style) */}
          <div className="space-y-1.5 shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-nb-muted">
              Quick Suggestions & Templates
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {PROMPT_SUGGESTIONS.map((sug) => (
                <button
                  key={sug.title}
                  type="button"
                  onClick={() => setPrompt(sug.prompt)}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border/40 bg-nb-surface px-2.5 py-1 text-xs font-bold text-nb-fg hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 transition-all shadow-nb-xs"
                >
                  <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                  <span className="truncate max-w-[180px] sm:max-w-none">{sug.title}</span>
                  <span className="text-[9px] font-mono text-nb-muted border border-nb-border/40 rounded px-1">
                    {sug.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Area (ChatGPT Style Input Container) */}
          <div className="flex-1 flex flex-col rounded-2xl border-2 border-nb-border bg-nb-surface p-3 shadow-nb-xs focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-600 transition-all">
            <textarea
              ref={textareaRef}
              rows={isExpanded ? 8 : 4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === "create"
                  ? "Describe your workflow... e.g. 'Monitor product prices on Amazon. If price drops below threshold, send Telegram alert, else wait 1 hour.'"
                  : "Instruct AI on what to modify or add... e.g. 'Add a validation step before the Slack output' or 'Connect GitHub to Discord webhook.'"
              }
              className="w-full flex-1 bg-transparent p-1 text-xs sm:text-sm text-nb-fg focus:outline-none font-medium leading-relaxed resize-none placeholder:text-nb-muted"
            />

            {/* Bottom Input Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-nb-border/30 mt-1">
              <div className="flex items-center gap-2 text-[10px] font-mono text-nb-muted">
                <span className="hidden sm:inline">Press</span>
                <kbd className="rounded border border-nb-border bg-nb-card px-1.5 py-0.5 text-[9px] font-bold">
                  ↵ Enter
                </kbd>
                <span className="hidden sm:inline">to submit • Shift+Enter for newline</span>
              </div>

              <div className="flex items-center gap-2">
                {prompt && (
                  <button
                    type="button"
                    onClick={() => setPrompt("")}
                    className="text-[11px] font-bold text-nb-muted hover:text-rose-500 px-2 py-1"
                  >
                    Clear
                  </button>
                )}

                <button
                  type="button"
                  disabled={loading || !prompt.trim()}
                  onClick={() => handleGenerate()}
                  className="flex items-center gap-2 rounded-xl border-2 border-nb-border bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-4 py-2 text-xs font-black shadow-nb-xs transition-all hover:translate-x-0.5 hover:-translate-y-0.5"
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Synthesizing...</span>
                    </span>
                  ) : (
                    <>
                      <span>{mode === "create" ? "Generate WebFlow" : "Apply to Canvas"}</span>
                      <Send className="h-3.5 w-3.5 text-amber-300" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
