"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  BookOpen,
  FileText,
  Eye,
  ExternalLink,
} from "lucide-react";
import { convertToHumanMarkdown } from "@/lib/webflow/converters";
import type { WebFlowNode, WebFlowEdge, WebFlowVariable } from "@/lib/webflow/types";

interface HumanDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: {
    name: string;
    description?: string;
    category?: string;
    version?: number;
  };
  nodes: WebFlowNode[];
  edges: WebFlowEdge[];
  variables?: WebFlowVariable[];
}

export function HumanDocModal({
  isOpen,
  onClose,
  workflow,
  nodes,
  edges,
  variables = [],
}: HumanDocModalProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");

  const markdown = useMemo(() => {
    return convertToHumanMarkdown({
      name: workflow.name,
      description: workflow.description,
      category: workflow.category,
      nodes,
      edges,
      variables,
    });
  }, [workflow, nodes, edges, variables]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    const filename = `${workflow.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-guide.md`;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Extract structured steps for high-fidelity rendered presentation
  const executionNodes = nodes.filter((n) => n.data.kind !== "note");
  const noteNodes = nodes.filter((n) => n.data.kind === "note");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border-3 border-nb-border bg-nb-card shadow-nb-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-nb-border bg-amber-500 px-6 py-4 text-black">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black font-black shadow-nb-sm border border-nb-border">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-black">
                Step-by-Step SOP & Process Guide
              </h2>
              <p className="text-xs text-amber-950 font-medium">
                Synchronized human-readable instructions generated directly from your workflow graph.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-black hover:bg-black/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* View Toggle & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-nb-border px-4 sm:px-6 py-3 bg-nb-surface-alt">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("rendered")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all border-2 ${
                viewMode === "rendered"
                  ? "border-nb-border bg-nb-card text-nb-fg shadow-nb-sm"
                  : "border-transparent text-nb-muted hover:text-nb-fg"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Document View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("raw")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all border-2 ${
                viewMode === "raw"
                  ? "border-nb-border bg-nb-card text-nb-fg shadow-nb-sm"
                  : "border-transparent text-nb-muted hover:text-nb-fg"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Markdown Source
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-nb-card px-3 py-1.5 text-xs font-black text-nb-fg shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-nb-muted" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-emerald-500 px-3.5 py-1.5 text-xs font-black text-white shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download .md</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="relative flex-1 overflow-y-auto p-6 min-h-[380px] max-h-[60vh] scrollbar-thin">
          {viewMode === "raw" ? (
            <pre className="whitespace-pre-wrap break-all rounded-xl border-2 border-nb-border bg-slate-950 p-4 font-mono text-xs text-slate-100 leading-relaxed select-all">
              {markdown}
            </pre>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Document Header */}
              <div className="border-b-2 border-nb-border pb-4">
                <span className="rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold px-2 py-0.5 text-xs border border-indigo-300 dark:border-indigo-800">
                  {workflow.category || "General"}
                </span>
                <h1 className="mt-2 text-2xl font-black text-nb-fg tracking-tight">
                  {workflow.name}
                </h1>
                {workflow.description && (
                  <p className="mt-1 text-sm text-nb-muted leading-relaxed">
                    {workflow.description}
                  </p>
                )}
              </div>

              {/* Steps List */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-nb-muted">
                  Workflow Steps ({executionNodes.length})
                </h3>

                {executionNodes.map((node, index) => {
                  const d = node.data;
                  return (
                    <div
                      key={node.id}
                      className="rounded-xl border-2 border-nb-border bg-nb-card p-4 shadow-nb-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-nb-border text-xs font-black text-nb-card shrink-0">
                            {index + 1}
                          </span>
                          <h4 className="text-base font-black text-nb-fg">
                            {d.label || `Step ${index + 1}`}
                          </h4>
                        </div>
                        <span className="rounded bg-nb-surface-strong px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-nb-muted">
                          {d.kind}
                        </span>
                      </div>

                      {/* Tool/Website Info */}
                      {(d.websiteTitle || d.websiteUrl || d.websiteDomain) && (
                        <div className="mt-2.5 flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg border border-indigo-200 dark:border-indigo-800">
                          {d.websiteFaviconUrl && (
                            <img
                              src={d.websiteFaviconUrl}
                              alt=""
                              className="h-4 w-4 rounded"
                            />
                          )}
                          <span>Tool: {d.websiteTitle || d.websiteDomain}</span>
                          {d.websiteUrl && (
                            <a
                              href={d.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto flex items-center gap-1 text-[11px] hover:underline"
                            >
                              Open <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Action */}
                      {d.action && (
                        <div className="mt-2 text-sm font-bold text-nb-fg">
                          Action: <span className="text-indigo-600 dark:text-indigo-400">{d.action}</span>
                        </div>
                      )}

                      {d.actionDescription && (
                        <div className="mt-1 text-xs text-nb-muted leading-relaxed">
                          {d.actionDescription}
                        </div>
                      )}

                      {/* Instructions */}
                      {d.instructions && (
                        <div className="mt-3 rounded-lg border border-nb-border/40 bg-nb-surface-alt p-2.5 text-xs leading-relaxed text-nb-fg">
                          <strong className="block text-[11px] uppercase tracking-wider text-nb-muted mb-1">
                            Instructions
                          </strong>
                          {d.instructions}
                        </div>
                      )}

                      {/* Inputs & Outputs */}
                      {((d.inputs && d.inputs.length > 0) || (d.outputs && d.outputs.length > 0)) && (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          {d.inputs && d.inputs.length > 0 && (
                            <div className="text-[11px] text-nb-muted">
                              <span className="font-bold text-amber-600 dark:text-amber-400">Inputs: </span>
                              {d.inputs.map((i) => i.name).join(", ")}
                            </div>
                          )}
                          {d.outputs && d.outputs.length > 0 && (
                            <div className="text-[11px] text-nb-muted">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">Outputs: </span>
                              {d.outputs.map((o) => o.name).join(", ")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Notes Section if any */}
              {noteNodes.length > 0 && (
                <div className="space-y-3 border-t-2 border-nb-border pt-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-nb-muted">
                    Process Notes & SOP Rules
                  </h3>
                  {noteNodes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3.5 text-xs text-amber-950 dark:text-amber-100"
                    >
                      <strong className="block font-bold mb-1">{note.data.label}</strong>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {note.data.noteContent || note.data.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t-2 border-nb-border bg-nb-surface-alt px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-nb-border bg-nb-card px-4 py-1.5 text-xs font-black text-nb-fg shadow-nb-sm hover:bg-nb-surface-strong transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
