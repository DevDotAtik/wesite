"use client";

import React from "react";
import {
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Workflow,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { WorkflowValidationResult, ValidationIssue } from "@/lib/webflow/validator";

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  validation: WorkflowValidationResult;
  onFocusNode?: (nodeId: string) => void;
}

export function ValidationModal({
  isOpen,
  onClose,
  validation,
  onFocusNode,
}: ValidationModalProps) {
  if (!isOpen) return null;

  const errors = validation.issues.filter((i) => i.level === "error");
  const warnings = validation.issues.filter((i) => i.level === "warning");
  const infos = validation.issues.filter((i) => i.level === "info");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl border-3 border-nb-border bg-nb-card shadow-nb-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b-3 border-nb-border px-6 py-4 text-white ${
            errors.length > 0
              ? "bg-rose-600"
              : warnings.length > 0
              ? "bg-amber-600"
              : "bg-emerald-600"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-nb-fg font-black shadow-nb-sm border border-nb-border">
              {errors.length > 0 ? (
                <AlertCircle className="h-5 w-5 text-rose-600" />
              ) : warnings.length > 0 ? (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Workflow Validation
              </h2>
              <p className="text-xs text-white/90">
                {validation.isValid
                  ? "Your workflow graph is connected and structurally sound!"
                  : "Resolve graph disconnected paths or warnings below."}
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

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b-2 border-nb-border bg-nb-surface-alt p-4 text-xs font-mono">
          <div className="rounded-lg border border-nb-border/30 bg-nb-card p-2 text-center">
            <span className="block text-[10px] text-nb-muted uppercase font-sans">Nodes</span>
            <span className="text-base font-black text-nb-fg">{validation.metrics.nodeCount}</span>
          </div>
          <div className="rounded-lg border border-nb-border/30 bg-nb-card p-2 text-center">
            <span className="block text-[10px] text-nb-muted uppercase font-sans">Connections</span>
            <span className="text-base font-black text-nb-fg">{validation.metrics.edgeCount}</span>
          </div>
          <div className="rounded-lg border border-nb-border/30 bg-nb-card p-2 text-center">
            <span className="block text-[10px] text-nb-muted uppercase font-sans">Website Tools</span>
            <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
              {validation.metrics.websiteNodeCount}
            </span>
          </div>
          <div className="rounded-lg border border-nb-border/30 bg-nb-card p-2 text-center">
            <span className="block text-[10px] text-nb-muted uppercase font-sans">Graph Integrity</span>
            <span
              className={`text-sm font-black ${
                validation.isValid ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {validation.isValid ? "VALID" : "WARNINGS"}
            </span>
          </div>
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[50vh] scrollbar-thin">
          {validation.issues.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
              <h3 className="text-sm font-black text-nb-fg">Graph looks great!</h3>
              <p className="text-xs text-nb-muted">
                No disconnected nodes, loops, or missing actions detected.
              </p>
            </div>
          ) : (
            validation.issues.map((issue) => (
              <div
                key={issue.id}
                className={`flex items-start justify-between gap-3 rounded-xl border-2 p-3 text-xs ${
                  issue.level === "error"
                    ? "border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100"
                    : issue.level === "warning"
                    ? "border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100"
                    : "border-nb-border bg-nb-surface text-nb-fg"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {issue.level === "error" ? (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : issue.level === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold">{issue.message}</span>
                    {issue.nodeId && (
                      <span className="block mt-0.5 text-[10px] font-mono opacity-80">
                        Node: {issue.nodeId}
                      </span>
                    )}
                  </div>
                </div>

                {issue.nodeId && onFocusNode && (
                  <button
                    type="button"
                    onClick={() => {
                      onFocusNode(issue.nodeId!);
                      onClose();
                    }}
                    className="flex items-center gap-1 rounded-lg border border-current px-2 py-1 text-[10px] font-bold shrink-0 hover:opacity-80"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 border-nb-border bg-nb-surface-alt px-6 py-3">
          <div className="text-xs text-nb-muted">
            {validation.canExportAI ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Ready for AI export
              </span>
            ) : (
              <span className="text-rose-600 font-bold">Fix errors before exporting</span>
            )}
          </div>
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
