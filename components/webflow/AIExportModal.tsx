"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  Bot,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileText,
  Code2,
  Sparkles,
} from "lucide-react";
import {
  convertToAIAgentFormat,
  convertToHumanMarkdown,
  convertToYAML,
  convertToPlainText,
} from "@/lib/webflow/converters";
import { validateWebFlow } from "@/lib/webflow/validator";
import type { WebFlowNode, WebFlowEdge, WebFlowVariable } from "@/lib/webflow/types";

interface AIExportModalProps {
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

type ExportTab = "json" | "markdown" | "yaml" | "plaintext";

export function AIExportModal({
  isOpen,
  onClose,
  workflow,
  nodes,
  edges,
  variables = [],
}: AIExportModalProps) {
  const [activeTab, setActiveTab] = useState<ExportTab>("json");
  const [copied, setCopied] = useState(false);

  // Run validation
  const validation = useMemo(() => {
    return validateWebFlow(nodes, edges);
  }, [nodes, edges]);

  // Generate outputs
  const exportData = useMemo(() => {
    const aiSpec = convertToAIAgentFormat({
      name: workflow.name,
      description: workflow.description,
      category: workflow.category,
      nodes,
      edges,
      variables,
    });
    const jsonStr = JSON.stringify(aiSpec, null, 2);
    const mdStr = convertToHumanMarkdown({
      name: workflow.name,
      description: workflow.description,
      category: workflow.category,
      nodes,
      edges,
      variables,
    });
    const yamlStr = convertToYAML(aiSpec);
    const plainStr = convertToPlainText(mdStr);

    return {
      aiSpec,
      json: jsonStr,
      markdown: mdStr,
      yaml: yamlStr,
      plaintext: plainStr,
    };
  }, [workflow, nodes, edges, variables]);

  if (!isOpen) return null;

  const currentContent =
    activeTab === "json"
      ? exportData.json
      : activeTab === "markdown"
      ? exportData.markdown
      : activeTab === "yaml"
      ? exportData.yaml
      : exportData.plaintext;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    const extensions: Record<ExportTab, string> = {
      json: "json",
      markdown: "md",
      yaml: "yaml",
      plaintext: "txt",
    };
    const mimeTypes: Record<ExportTab, string> = {
      json: "application/json",
      markdown: "text/markdown",
      yaml: "text/yaml",
      plaintext: "text/plain",
    };

    const ext = extensions[activeTab];
    const mime = mimeTypes[activeTab];
    const filename = `${workflow.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-agent-spec.${ext}`;

    const blob = new Blob([currentContent], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const errorCount = validation.issues.filter((i) => i.level === "error").length;
  const warningCount = validation.issues.filter((i) => i.level === "warning").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border-3 border-nb-border bg-nb-card shadow-nb-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-3 border-nb-border bg-indigo-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-700 font-black shadow-nb-sm border border-nb-border">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Export for AI Agent
                <span className="rounded bg-indigo-500/80 px-2 py-0.5 text-xs font-mono font-bold uppercase tracking-wider text-white border border-indigo-400">
                  v{workflow.version || 1}.0
                </span>
              </h2>
              <p className="text-xs text-indigo-100">
                Deterministic structured specification ready for LLMs, AutoGen, CrewAI, LangChain, or autonomous agents.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Validation & Health Summary Banner */}
        <div className="border-b-2 border-nb-border bg-nb-surface-alt px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {validation.metrics.nodeCount} Nodes
              </span>
              <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {validation.metrics.edgeCount} Connections
              </span>
              <span className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                <FileCode className="h-4 w-4" />
                {validation.metrics.websiteNodeCount} Tools
              </span>
              {warningCount > 0 && (
                <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  {warningCount} warning{warningCount > 1 ? "s" : ""}
                </span>
              )}
              {errorCount > 0 && (
                <span className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                  {errorCount} error{errorCount > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="text-[11px] text-nb-muted">
              {validation.isValid ? (
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ✓ Valid execution graph
                </span>
              ) : (
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  ⚠ Incomplete paths detected
                </span>
              )}
            </div>
          </div>

          {/* Validation Warnings / Errors Accordion if any */}
          {validation.issues.length > 0 && (
            <div className="mt-2.5 max-h-24 overflow-y-auto space-y-1 rounded-lg border border-nb-border/40 bg-nb-card p-2 text-[11px]">
              {validation.issues.slice(0, 4).map((issue) => (
                <div
                  key={issue.id}
                  className={`flex items-center gap-1.5 ${
                    issue.level === "error"
                      ? "text-rose-600 dark:text-rose-400"
                      : issue.level === "warning"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-nb-muted"
                  }`}
                >
                  {issue.level === "error" ? (
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="truncate">{issue.message}</span>
                </div>
              ))}
              {validation.issues.length > 4 && (
                <div className="text-[10px] text-nb-muted italic">
                  +{validation.issues.length - 4} more warnings
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export Tabs & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-nb-border px-6 py-2.5 bg-nb-card">
          {/* Format Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("json")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all border-2 ${
                activeTab === "json"
                  ? "border-nb-border bg-indigo-600 text-white shadow-nb-sm"
                  : "border-transparent text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              JSON (Deterministic)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("markdown")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all border-2 ${
                activeTab === "markdown"
                  ? "border-nb-border bg-indigo-600 text-white shadow-nb-sm"
                  : "border-transparent text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Markdown (Prompt)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("yaml")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all border-2 ${
                activeTab === "yaml"
                  ? "border-nb-border bg-indigo-600 text-white shadow-nb-sm"
                  : "border-transparent text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt"
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              YAML (Config)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("plaintext")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all border-2 ${
                activeTab === "plaintext"
                  ? "border-nb-border bg-indigo-600 text-white shadow-nb-sm"
                  : "border-transparent text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Plain Text
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-nb-card px-3.5 py-1.5 text-xs font-black text-nb-fg shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-nb-muted" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-amber-400 dark:bg-amber-500 px-3.5 py-1.5 text-xs font-black text-black shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Code Preview Area */}
        <div className="relative flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs text-slate-100 min-h-[340px] max-h-[50vh] scrollbar-thin select-all">
          <pre className="whitespace-pre-wrap break-all leading-relaxed font-mono">
            {currentContent}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t-2 border-nb-border bg-nb-surface-alt px-6 py-3">
          <div className="flex items-center gap-2 text-xs text-nb-muted">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span>Deterministic output matches WebFlow JSON Schema v1.0 specifications.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-nb-border bg-nb-card px-4 py-1.5 text-xs font-black text-nb-fg shadow-nb-sm hover:bg-nb-surface-strong transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
