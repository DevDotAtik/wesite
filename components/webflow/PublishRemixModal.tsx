"use client";

import React, { useState, useEffect } from "react";
import { X, GitFork, ShieldCheck, Sparkles, ArrowRight, AlertCircle } from "lucide-react";

interface PublishRemixModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalWorkflowName: string;
  originalAuthorName: string;
  currentRemixNote: string;
  onConfirmPublish: (remixNote: string) => void;
}

export function PublishRemixModal({
  isOpen,
  onClose,
  originalWorkflowName,
  originalAuthorName,
  currentRemixNote,
  onConfirmPublish,
}: PublishRemixModalProps) {
  const [note, setNote] = useState(currentRemixNote || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNote(currentRemixNote || "");
      setError("");
    }
  }, [isOpen, currentRemixNote]);

  if (!isOpen) return null;

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = note.trim();
    if (!trimmed) {
      setError("Please describe the thoughts, tools, or enhancements you added to this workflow.");
      return;
    }
    if (trimmed.length < 5) {
      setError("Please provide a slightly more descriptive note (at least 5 characters).");
      return;
    }
    onConfirmPublish(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-100">
      <div className="relative flex flex-col w-full max-w-lg rounded-2xl border-3 border-nb-border bg-nb-card shadow-nb-xl overflow-hidden text-nb-fg">
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-nb-border bg-amber-400 px-6 py-4 text-black">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-amber-400 font-black shadow-nb-sm border-2 border-black">
              <GitFork className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-black flex items-center gap-2">
                Publish Community Remix
              </h2>
              <p className="text-xs text-black/85 font-bold">
                Share your ideas while crediting the original creator
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-black bg-white text-black hover:bg-neutral-100 shadow-nb-xs transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handlePublish} className="p-6 space-y-4">
          {/* Attribution Notice */}
          <div className="rounded-xl border-2 border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 text-xs font-black">
              <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Immutable Community Attribution</span>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
              This workflow is derived from{" "}
              <strong>&ldquo;{originalWorkflowName || "Original Workflow"}&rdquo;</strong> originally created by{" "}
              <strong>@{originalAuthorName || "Creator"}</strong>. When published to the community Explore tab, full credit will permanently remain with the original author.
            </p>
          </div>

          {/* User's Contribution Note */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-nb-fg">
              What did you improve or add? <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-nb-muted">
              Add your thoughts, optimizations, or new tools added to help others understand your evolution of this workflow.
            </p>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Added Gemini 2.5 Flash reasoning node, connected LinkedIn webhook step, and restructured execution flow..."
              className="w-full rounded-xl border-2 border-nb-border bg-nb-surface p-3 text-xs text-nb-fg placeholder:text-nb-muted/60 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shadow-nb-sm"
              autoFocus
            />
            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-nb-border/30">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-nb-border bg-nb-surface px-4 py-2 text-xs font-bold text-nb-fg hover:bg-nb-surface-strong shadow-nb-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl border-2 border-nb-border bg-amber-400 hover:bg-amber-300 text-black px-4 py-2 text-xs font-black shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Publish Remix with Attribution</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
