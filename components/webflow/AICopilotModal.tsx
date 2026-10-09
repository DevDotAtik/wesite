"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  X,
  ArrowRight,
  Bot,
  Zap,
  Layers,
  CheckCircle2,
  Workflow,
  Search,
  BookOpen,
  GitFork,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { WebFlowNode, WebFlowEdge, WebFlowVariable } from "@/lib/webflow/types";

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  // If in editor, onApply updates existing canvas
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
    title: "Research & Synthesis",
    desc: "Search Google/arXiv for AI papers, summarize with Claude, and store structured notes in Notion.",
    prompt: "Create a research workflow: search Google for AI papers, distill key findings and citations with Claude, and save notes to Notion.",
  },
  {
    title: "Content Repurposing",
    desc: "Extract YouTube video transcript, draft an engaging post with ChatGPT, review, and publish to LinkedIn.",
    prompt: "Turn a YouTube video into a social post: extract transcript, draft a high-impact technical post with ChatGPT, human review, and publish to LinkedIn.",
  },
  {
    title: "GitHub Issue Triage",
    desc: "Retrieve repository pull request diff, run AI security & regression analysis, and alert Slack channel.",
    prompt: "Automate code triage: fetch GitHub PR diff, analyze regressions and security bugs using AI, and post report to Slack.",
  },
  {
    title: "Job Application Flow",
    desc: "Analyze job description from LinkedIn, tailor resume points, and record application status.",
    prompt: "Build job application pipeline: inspect LinkedIn job posting, tailor resume highlights with AI, and track in Notion.",
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
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) {
      toast.error("Please enter a description for your workflow.");
      return;
    }

    setLoading(true);
    try {
      toast.loading(mode === "create" ? "Synthesizing workflow from your prompt..." : "Updating workflow graph...");

      const res = await fetch("/api/webflows/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt.trim(),
          mode: mode === "editor" ? "refine" : "create",
          currentNodes,
          currentEdges,
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
        onClose();
        router.push(`/webflow/${createData.webflow._id}`);
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Could not generate workflow");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-100">
      <div className="relative flex flex-col w-full max-w-2xl rounded-2xl border-3 border-nb-border bg-nb-card shadow-nb-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-nb-border bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-black font-black shadow-nb-sm border border-nb-border">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                {mode === "create" ? "AI Workflow Generator" : "AI Workflow Assistant"}
              </h2>
              <p className="text-xs text-indigo-200 font-medium">
                {mode === "create"
                  ? "Describe your desired sequence. AI maps steps to your saved websites and builds the graph."
                  : "Instruct the assistant to add steps, insert validation branches, or refine your graph."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/20 p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-nb-fg flex items-center justify-between">
              <span>{mode === "create" ? "Describe Your Process" : "Instruction for AI"}</span>
              <span className="text-[10px] font-mono text-nb-muted">Natural Language</span>
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mode === "create"
                  ? "e.g. Research AI tools on Google, extract findings, synthesize with Claude, save notes to Notion, and draft a LinkedIn post..."
                  : "e.g. Add a condition step to verify the output before publishing, or add a Slack notification step..."
              }
              className="w-full rounded-xl border-2 border-nb-border bg-nb-surface p-3 text-xs text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium leading-relaxed resize-none shadow-nb-xs"
            />
          </div>

          {/* Quick Suggestions (Create mode) */}
          {mode === "create" && (
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-nb-muted">
                Quick Prompt Templates
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PROMPT_SUGGESTIONS.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => {
                      setPrompt(item.prompt);
                    }}
                    className="flex flex-col text-left p-2.5 rounded-xl border-2 border-nb-border/40 bg-nb-surface-alt/70 hover:border-indigo-500 hover:bg-nb-surface transition-all group"
                  >
                    <div className="text-xs font-black text-nb-fg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-between">
                      <span>{item.title}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[10px] text-nb-muted line-clamp-2 mt-0.5 leading-normal">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Technical Info Banner */}
          <div className="rounded-xl border border-nb-border/40 bg-indigo-50/60 dark:bg-indigo-950/30 p-3 text-[11px] text-nb-fg flex items-start gap-2.5 font-medium">
            <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-indigo-700 dark:text-indigo-300">Tool Matching: </span>
              The synthesizer automatically cross-references tools mentioned in your prompt against your saved Wesite library to use your authentic tools and favicons.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t-2 border-nb-border bg-nb-surface px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-nb-border bg-nb-card px-4 py-2 text-xs font-bold text-nb-fg hover:bg-nb-surface-alt transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading || !prompt.trim()}
            onClick={() => handleGenerate()}
            className="flex items-center gap-2 rounded-xl border-2 border-nb-border bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 text-xs font-black shadow-nb-sm transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Synthesizing...</span>
              </span>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>{mode === "create" ? "Generate WebFlow" : "Apply to Canvas"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
