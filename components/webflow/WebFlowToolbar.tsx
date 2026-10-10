"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  Share2,
  GitFork,
  Maximize2,
  LayoutGrid,
  AlertTriangle,
  MoreHorizontal,
  Undo2,
  Redo2,
  Keyboard,
  Sliders,
} from "lucide-react";
import { AIIcon } from "./AIIcon";
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
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onOpenShortcuts?: () => void;
  onOpenCustomizer?: () => void;
  isReadOnly?: boolean;
}

export function WebFlowToolbar({
  workflowName,
  onUpdateName,
  saveStatus,
  onAutoLayout,
  onFitView,
  onOpenAIExport,
  onOpenHumanDoc,
  onOpenAICopilot,
  onValidate,
  visibility,
  onChangeVisibility,
  validationWarningCount,
  validationErrorCount,
  isOwner = true,
  onDuplicate,
  onRemix,
  forkCount = 0,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onOpenShortcuts,
  onOpenCustomizer,
  isReadOnly = false,
}: WebFlowToolbarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(workflowName);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  if (isReadOnly) {
    return (
      <header className="flex h-12 w-full items-center justify-between border-b-3 border-nb-border bg-nb-card px-3 shadow-sm z-30 shrink-0">
        {/* Left: Back Link & Workflow Title & View Only badge */}
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          <Link
            href="/webflow"
            className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-nb-border bg-nb-surface text-nb-fg shadow-nb-sm active:translate-y-0.5 transition-all shrink-0"
            title="Back to WebFlow Hub"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="truncate text-xs font-black tracking-tight text-nb-fg max-w-[160px] sm:max-w-xs" title={workflowName}>
            {workflowName || "Untitled WebFlow"}
          </span>
          <span className="flex items-center gap-1 rounded-full border border-nb-border bg-nb-surface px-2 py-0.5 text-[10px] font-black text-nb-muted shrink-0">
            <Eye className="h-3 w-3 text-indigo-500" />
            <span>View Only</span>
          </span>
        </div>

        {/* Right: Fit-to-screen button only (viewing convenience, no editing/customizing) */}
        <button
          type="button"
          onClick={onFitView}
          className="flex items-center gap-1 rounded-xl border-2 border-nb-border bg-nb-surface px-2.5 py-1 text-xs font-bold text-nb-fg shadow-nb-sm active:translate-y-0.5 shrink-0"
          title="Fit diagram to screen"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span>Fit</span>
        </button>
      </header>
    );
  }

  return (
    <header className="flex h-14 w-full items-center justify-between border-b-3 border-nb-border bg-nb-card px-2 sm:px-4 shadow-sm z-30 shrink-0">
      {/* Left: Back & Title & Save Status */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-hidden min-w-0">
        <Link
          href="/webflow"
          className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-nb-border bg-nb-surface text-nb-fg shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all shrink-0"
          title="Back to WebFlow Hub"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        {/* Editable Title */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden min-w-0">
          {isEditingName ? (
            <input
              type="text"
              value={nameInput}
              autoFocus
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={handleNameKeyDown}
              className="rounded-lg border-2 border-nb-border bg-nb-surface px-2 py-0.5 text-xs sm:text-sm font-black text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[130px] sm:max-w-[200px] md:max-w-xs"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setNameInput(workflowName);
                setIsEditingName(true);
              }}
              className="truncate text-xs sm:text-sm font-black tracking-tight text-nb-fg hover:underline text-left max-w-[120px] sm:max-w-[200px] md:max-w-xs"
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

      {/* Center: Canvas View & History Controls (Desktop) */}
      <div className="hidden md:flex items-center gap-1.5">
        {/* Undo / Redo Segment */}
        <div className="flex items-center rounded-lg border-2 border-nb-border bg-nb-card p-0.5 shadow-nb-sm">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className="p-1 rounded-md hover:bg-nb-surface-strong text-nb-fg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Undo (⌘Z / Ctrl+Z)"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <div className="w-[1px] h-3.5 bg-nb-border/40 mx-0.5" />
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            className="p-1 rounded-md hover:bg-nb-surface-strong text-nb-fg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Redo (⌘⇧Z / Ctrl+Shift+Z / Ctrl+Y)"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onAutoLayout}
          className="flex items-center gap-1 rounded-lg border-2 border-nb-border bg-nb-card px-2.5 py-1 text-xs font-bold text-nb-fg shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
          title="Auto-arrange nodes neatly (⌘L)"
        >
          <LayoutGrid className="h-3.5 w-3.5 text-indigo-500" />
          <span>Auto-Layout</span>
        </button>

        <button
          type="button"
          onClick={onFitView}
          className="flex items-center gap-1 rounded-lg border-2 border-nb-border bg-nb-card px-2.5 py-1 text-xs font-bold text-nb-fg shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
          title="Zoom to fit all nodes (⌘1)"
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

        {onOpenShortcuts && (
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="flex items-center gap-1 rounded-lg border-2 border-nb-border bg-nb-card px-2 py-1 text-xs font-bold text-nb-fg shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
            title="Keyboard Shortcuts Cheatsheet (⌘/)"
          >
            <Keyboard className="h-3.5 w-3.5 text-indigo-500" />
            <span className="hidden xl:inline">Hotkeys</span>
          </button>
        )}

        {onOpenCustomizer && (
          <button
            type="button"
            onClick={onOpenCustomizer}
            className="flex items-center gap-1 rounded-lg border-2 border-nb-border bg-nb-card px-2 py-1 text-xs font-bold text-nb-fg shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
            title="Canvas Styling & Appearance"
          >
            <Sliders className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden lg:inline">Style</span>
          </button>
        )}
      </div>

      {/* Right: Actions, Visibility, Export */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Visibility Selector (Desktop) */}
        {isOwner && (
          <select
            value={visibility}
            onChange={(e) => onChangeVisibility(e.target.value as WebFlowVisibility)}
            className="hidden lg:block rounded-xl border-2 border-nb-border bg-nb-surface dark:bg-zinc-900 px-2.5 py-1 text-xs font-bold text-nb-fg dark:text-zinc-100 shadow-nb-sm cursor-pointer focus:outline-none"
          >
            <option value="private">🔒 Private</option>
            <option value="public">🌐 Public</option>
            <option value="unlisted">🔗 Unlisted</option>
          </select>
        )}

        {/* Share Button (Desktop) */}
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
            className="flex items-center gap-1 rounded-xl border-2 border-nb-border bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2.5 sm:px-3 py-1 text-xs font-black shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
          >
            <GitFork className="h-3.5 w-3.5" />
            <span>Remix</span>
          </button>
        )}

        {/* Duplicate button */}
        {onDuplicate && (
          <button
            type="button"
            onClick={onDuplicate}
            className="hidden sm:flex items-center gap-1 rounded-xl border-2 border-nb-border bg-nb-card px-2.5 sm:px-3 py-1 text-xs font-black text-nb-fg shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
            title="Duplicate WebFlow"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Duplicate</span>
            {forkCount > 0 && <span className="text-[10px] opacity-60 font-mono">({forkCount})</span>}
          </button>
        )}

        {/* Human Guide Modal Button */}
        <button
          type="button"
          onClick={onOpenHumanDoc}
          className="flex items-center gap-1 rounded-xl border-2 border-nb-border bg-nb-card px-2.5 sm:px-3 py-1.5 text-xs font-black text-nb-fg shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
          title="Step-by-step human guide"
        >
          <BookOpen className="h-3.5 w-3.5 text-amber-500" />
          <span className="hidden sm:inline">Guide</span>
        </button>

        {/* AI Assistant Button */}
        {onOpenAICopilot && (
          <button
            type="button"
            onClick={onOpenAICopilot}
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl border-2 border-nb-border bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black px-2.5 sm:px-3.5 py-1.5 text-xs font-black shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
            title="Ask AI to generate or modify workflow steps"
          >
            <AIIcon className="h-4 w-4" glow />
            <span className="hidden sm:inline">AI Copilot</span>
            <span className="sm:hidden text-[11px]">AI</span>
          </button>
        )}

        {/* PROMINENT "Export for AI" Button */}
        <button
          type="button"
          onClick={onOpenAIExport}
          className="flex items-center gap-1.5 sm:gap-2 rounded-xl border-2 border-nb-border bg-indigo-600 text-white px-2.5 sm:px-3.5 py-1.5 text-xs font-black shadow-nb-md hover:bg-indigo-700 hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
        >
          <AIIcon className="h-4 w-4 text-indigo-200" />
          <span className="hidden sm:inline">Export for AI</span>
          <span className="sm:hidden text-[11px]">Export</span>
        </button>

        {/* Mobile Extra Tools Dropdown */}
        <div className="relative md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-nb-border bg-nb-card text-nb-fg shadow-nb-sm active:translate-y-0.5"
            title="More Options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {isMobileMenuOpen && (
            <div className="absolute right-0 top-10 z-50 w-52 rounded-2xl border-3 border-nb-border bg-nb-card p-2 shadow-nb-xl space-y-1 text-xs font-bold animate-in fade-in zoom-in-95">
              {/* Mobile Undo / Redo */}
              <div className="grid grid-cols-2 gap-1 pb-1 border-b border-nb-border/30">
                <button
                  type="button"
                  disabled={!canUndo}
                  onClick={() => {
                    onUndo?.();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-lg p-1.5 hover:bg-nb-surface-alt disabled:opacity-40 text-nb-fg border border-nb-border/40 text-xs font-bold"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  <span>Undo</span>
                </button>
                <button
                  type="button"
                  disabled={!canRedo}
                  onClick={() => {
                    onRedo?.();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-lg p-1.5 hover:bg-nb-surface-alt disabled:opacity-40 text-nb-fg border border-nb-border/40 text-xs font-bold"
                >
                  <Redo2 className="h-3.5 w-3.5" />
                  <span>Redo</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onAutoLayout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 rounded-xl p-2 text-left hover:bg-nb-surface-alt text-nb-fg"
              >
                <LayoutGrid className="h-4 w-4 text-indigo-500" />
                <span>Auto-Layout Graph</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onFitView();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 rounded-xl p-2 text-left hover:bg-nb-surface-alt text-nb-fg"
              >
                <Maximize2 className="h-4 w-4 text-slate-500" />
                <span>Fit to Viewport</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onValidate();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between rounded-xl p-2 text-left hover:bg-nb-surface-alt text-nb-fg"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Validate Graph</span>
                </span>
                {(validationErrorCount > 0 || validationWarningCount > 0) && (
                  <span className="rounded-full bg-rose-500 text-white px-1.5 py-0.5 text-[10px] font-mono">
                    {validationErrorCount + validationWarningCount}
                  </span>
                )}
              </button>

              {onOpenShortcuts && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenShortcuts();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 rounded-xl p-2 text-left hover:bg-nb-surface-alt text-nb-fg"
                >
                  <Keyboard className="h-4 w-4 text-indigo-500" />
                  <span>Keyboard Shortcuts</span>
                </button>
              )}

              {onOpenCustomizer && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenCustomizer();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 rounded-xl p-2 text-left hover:bg-nb-surface-alt text-nb-fg"
                >
                  <Sliders className="h-4 w-4 text-amber-500" />
                  <span>Canvas Appearance</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  handleShare();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 rounded-xl p-2 text-left hover:bg-nb-surface-alt text-nb-fg"
              >
                <Share2 className="h-4 w-4 text-amber-500" />
                <span>{copiedLink ? "Link Copied!" : "Share Link"}</span>
              </button>

              {isOwner && (
                <div className="pt-2 border-t border-nb-border/40">
                  <label className="text-[10px] uppercase font-mono text-nb-muted px-2 block mb-1">
                    Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => {
                      onChangeVisibility(e.target.value as WebFlowVisibility);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full rounded-lg border-2 border-nb-border bg-nb-surface dark:bg-zinc-900 p-1.5 text-xs font-bold text-nb-fg dark:text-zinc-100 cursor-pointer"
                  >
                    <option value="private">🔒 Private</option>
                    <option value="public">🌐 Public</option>
                    <option value="unlisted">🔗 Unlisted</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
