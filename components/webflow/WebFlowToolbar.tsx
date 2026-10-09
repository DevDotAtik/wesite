"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Globe,
  Lock,
  Share2,
  Sparkles,
  GitFork,
  Maximize2,
  LayoutGrid,
  AlertTriangle,
  RotateCcw,
  Save,
} from "lucide-react";
import type { WebFlowVisibility } from "@/lib/webflow/types";

interface WebFlowToolbarProps {
  workflowName: string;
  onUpdateName: (name: string) => void;
  saveStatus: "saved" | "saving" | "unsaved";
  onAutoLayout: () => void;
  onFitView: () => void;
  onOpenAIExport: () => void;
  onOpenHumanDoc: () => void;
  onOpenAICopilot?: () => void;
  onValidate: () => void;
  visibility: WebFlowVisibility;
  onChangeVisibility: (v: WebFlowVisibility) => void;
  validationWarningCount: number;
  validationErrorCount: number;
  isOwner?: boolean;
  onDuplicate?: () => void;
  onRemix?: () => void;
  forkCount?: number;
}

export function WebFlowToolbar({
  workflowName,
  onUpdateName,
  saveStatus,
  onAutoLayout,
  onFitView,
  onOpenAIExport,
  onOpenHumanDoc,
  onValidate,
  visibility,
  onChangeVisibility,
  validationWarningCount,
  validationErrorCount,
  isOwner = true,
  onDuplicate,
  onRemix,
  forkCount = 0,
}: WebFlowToolbarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(workflowName);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (nameInput.trim()) {
      onUpdateName(nameInput.trim());
    } else {
      setNameInput(workflowName);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameBlur();
    } else if (e.key === "Escape") {
      setNameInput(workflowName);
      setIsEditingName(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <header className="flex h-14 w-full items-center justify-between border-b-3 border-nb-border bg-nb-card px-4 shadow-sm z-30 shrink-0">
      {/* Left: Back & Title & Save Status */}
      <div className="flex items-center gap-3 overflow-hidden">
        <Link
          href="/webflow"
          className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-nb-border bg-nb-surface text-nb-fg shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all shrink-0"
          title="Back to WebFlow Hub"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        {/* Editable Title */}
        <div className="flex items-center gap-2 overflow-hidden">
          {isEditingName ? (
            <input
              type="text"
              value={nameInput}
              autoFocus
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={handleNameKeyDown}
              className="rounded-lg border-2 border-nb-border bg-nb-surface px-2 py-0.5 text-sm font-black text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[240px] md:max-w-xs"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setNameInput(workflowName);
                setIsEditingName(true);
              }}
              className="truncate text-sm font-black tracking-tight text-nb-fg hover:underline text-left max-w-[200px] md:max-w-xs"
              title="Click to rename"
            >
              {workflowName || "Untitled WebFlow"}
            </button>
          )}

          {/* Save Status Badge */}
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                <Clock className="h-2.5 w-2.5 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                <Check className="h-2.5 w-2.5" />
                Saved
              </span>
            )}
            {saveStatus === "unsaved" && (
              <span className="flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-300">
                Unsaved changes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center: Canvas View Controls */}
      <div className="hidden md:flex items-center gap-1.5">
        <button
          type="button"
          onClick={onAutoLayout}
          className="flex items-center gap-1 rounded-lg border-2 border-nb-border bg-nb-card px-2.5 py-1 text-xs font-bold text-nb-fg shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
          title="Auto-arrange nodes neatly"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>Auto-Layout</span>
        </button>

        <button
          type="button"
          onClick={onFitView}
          className="flex items-center gap-1 rounded-lg border-2 border-nb-border bg-nb-card px-2.5 py-1 text-xs font-bold text-nb-fg shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
          title="Zoom to fit all nodes"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span>Fit</span>
        </button>

        <button
          type="button"
          onClick={onValidate}
          className={`flex items-center gap-1.5 rounded-lg border-2 border-nb-border px-2.5 py-1 text-xs font-bold shadow-nb-sm transition-all ${
            validationErrorCount > 0
              ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-500"
              : validationWarningCount > 0
              ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-500"
              : "bg-nb-card text-nb-fg hover:translate-x-0.5 hover:-translate-y-0.5"
          }`}
          title="Validate workflow graph integrity"
        >
          {validationErrorCount > 0 ? (
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          )}
          <span>Validate</span>
          {(validationWarningCount > 0 || validationErrorCount > 0) && (
            <span className="rounded-full bg-nb-border text-nb-card px-1 text-[10px] font-mono">
              {validationErrorCount + validationWarningCount}
            </span>
          )}
        </button>
      </div>

      {/* Right: Actions, Visibility, Export */}
      <div className="flex items-center gap-2">
        {/* Visibility Selector */}
        {isOwner && (
          <select
            value={visibility}
            onChange={(e) => onChangeVisibility(e.target.value as WebFlowVisibility)}
            className="hidden lg:block rounded-xl border-2 border-nb-border bg-nb-surface px-2.5 py-1 text-xs font-bold text-nb-fg shadow-nb-sm cursor-pointer focus:outline-none"
          >
            <option value="private">🔒 Private</option>
            <option value="public">🌐 Public</option>
            <option value="unlisted">🔗 Unlisted</option>
          </select>
        )}

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="hidden sm:flex items-center gap-1 rounded-xl border-2 border-nb-border bg-nb-card px-2.5 py-1 text-xs font-bold text-nb-fg shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
          title="Copy link to WebFlow"
        >
          {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
          <span>{copiedLink ? "Copied" : "Share"}</span>
        </button>

        {/* Non-owner Remix CTA */}
        {!isOwner && onRemix && (
          <button
            type="button"
            onClick={onRemix}
            className="flex items-center gap-1 rounded-xl border-2 border-nb-border bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-3 py-1 text-xs font-black shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
          >
            <GitFork className="h-3.5 w-3.5" />
            <span>Remix</span>
          </button>
        )}

        {/* Human Guide Modal Button */}
        <button
          type="button"
          onClick={onOpenHumanDoc}
          className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-nb-card px-3 py-1.5 text-xs font-black text-nb-fg shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
        >
          <BookOpen className="h-3.5 w-3.5 text-amber-500" />
          <span className="hidden sm:inline">Guide</span>
        </button>

        {/* PROMINENT "Export for AI" Button */}
        <button
          type="button"
          onClick={onOpenAIExport}
          className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-indigo-600 text-white px-3.5 py-1.5 text-xs font-black shadow-nb-md hover:bg-indigo-700 hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
        >
          <Bot className="h-4 w-4 fill-white/20" />
          <span>Export for AI</span>
        </button>
      </div>
    </header>
  );
}
