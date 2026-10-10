"use client";

import React, { useEffect, useRef } from "react";
import {
  Zap,
  Bookmark,
  GitFork,
  StickyNote,
  Copy,
  Trash2,
  Maximize2,
  LayoutGrid,
  Undo2,
  Redo2,
  SlidersHorizontal,
  ClipboardPaste,
  Files,
} from "lucide-react";
import { AIIcon } from "./AIIcon";
import type { WebFlowNode, WebFlowEdge, WebFlowNodeData, WebFlowNodeKind } from "@/lib/webflow/types";

export type ContextMenuTarget =
  | { type: "canvas"; x: number; y: number; flowPosition: { x: number; y: number } }
  | { type: "node"; x: number; y: number; node: WebFlowNode }
  | { type: "edge"; x: number; y: number; edge: WebFlowEdge };

interface WebFlowContextMenuProps {
  target: ContextMenuTarget | null;
  onClose: () => void;
  onAddNodeAtPosition: (nodeType: string, data: WebFlowNodeData, position: { x: number; y: number }) => void;
  onCopyNode: (node: WebFlowNode) => void;
  onPasteNode: (position?: { x: number; y: number }) => void;
  onDuplicateNode: (node: WebFlowNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onInspectNode: (node: WebFlowNode) => void;
  onAutoLayout: () => void;
  onFitView: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasCopiedNode: boolean;
}

export function WebFlowContextMenu({
  target,
  onClose,
  onAddNodeAtPosition,
  onCopyNode,
  onPasteNode,
  onDuplicateNode,
  onDeleteNode,
  onDeleteEdge,
  onInspectNode,
  onAutoLayout,
  onFitView,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  hasCopiedNode,
}: WebFlowContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as globalThis.Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("mousedown", handleDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!target) return null;

  // Viewport clamping
  const menuWidth = 220;
  const menuHeight = target.type === "canvas" ? 360 : target.type === "node" ? 220 : 120;
  const clampedX = typeof window !== "undefined" ? Math.max(10, Math.min(target.x, window.innerWidth - menuWidth - 16)) : target.x;
  const clampedY = typeof window !== "undefined" ? Math.max(10, Math.min(target.y, window.innerHeight - menuHeight - 16)) : target.y;

  return (
    <div
      ref={menuRef}
      style={{ left: `${clampedX}px`, top: `${clampedY}px` }}
      className="fixed z-50 w-56 rounded-2xl border-3 border-nb-border bg-nb-card p-1.5 shadow-nb-xl animate-in fade-in zoom-in-95 duration-100 select-none text-xs font-bold text-nb-fg"
    >
      {/* 1. CANVAS CONTEXT MENU */}
      {target.type === "canvas" && (
        <div className="space-y-1">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-nb-muted border-b border-nb-border/30">
            Insert Step
          </div>

          <button
            type="button"
            onClick={() => {
              onAddNodeAtPosition(
                "actionNode",
                {
                  label: "Action Step",
                  kind: "action" as WebFlowNodeKind,
                  action: "Execute Action",
                  status: "ready",
                },
                target.flowPosition
              );
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-nb-surface-strong hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Action / Task</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onAddNodeAtPosition(
                "aiNode",
                {
                  label: "AI Reasoning",
                  kind: "ai" as WebFlowNodeKind,
                  action: "Analyze & Generate",
                  instructions: "Analyze inputs and draft structured output",
                  status: "ready",
                },
                target.flowPosition
              );
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-nb-surface-strong hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="flex items-center gap-2">
              <AIIcon className="h-3.5 w-3.5 text-pink-500" />
              <span>AI Agent Step</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onAddNodeAtPosition(
                "conditionNode",
                {
                  label: "Evaluate Rule",
                  kind: "condition" as WebFlowNodeKind,
                  conditionExpression: "output.success === true",
                  status: "ready",
                },
                target.flowPosition
              );
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-nb-surface-strong hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="flex items-center gap-2">
              <GitFork className="h-3.5 w-3.5 text-violet-500" />
              <span>Condition Branch</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onAddNodeAtPosition(
                "noteNode",
                {
                  label: "Canvas Note",
                  kind: "note" as WebFlowNodeKind,
                  noteContent: "Documentation or credential guidance.",
                  status: "ready",
                },
                target.flowPosition
              );
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-nb-surface-strong hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="flex items-center gap-2">
              <StickyNote className="h-3.5 w-3.5 text-amber-600" />
              <span>Documentation Note</span>
            </span>
          </button>

          <div className="my-1 border-t border-nb-border/30" />

          {/* Paste */}
          <button
            type="button"
            disabled={!hasCopiedNode}
            onClick={() => {
              onPasteNode(target.flowPosition);
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-nb-surface-strong disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <span className="flex items-center gap-2">
              <ClipboardPaste className="h-3.5 w-3.5 text-emerald-500" />
              <span>Paste Node</span>
            </span>
            <kbd className="font-mono text-[10px] text-nb-muted">⌘V</kbd>
          </button>

          {/* Undo */}
          <button
            type="button"
            disabled={!canUndo}
            onClick={() => {
              onUndo();
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-nb-surface-strong disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <span className="flex items-center gap-2">
              <Undo2 className="h-3.5 w-3.5" />
              <span>Undo</span>
            </span>
            <kbd className="font-mono text-[10px] text-nb-muted">⌘Z</kbd>
          </button>

          {/* Redo */}
          <button
            type="button"
            disabled={!canRedo}
            onClick={() => {
              onRedo();
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-nb-surface-strong disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <span className="flex items-center gap-2">
              <Redo2 className="h-3.5 w-3.5" />
              <span>Redo</span>
            </span>
            <kbd className="font-mono text-[10px] text-nb-muted">⌘⇧Z</kbd>
          </button>

          <div className="my-1 border-t border-nb-border/30" />

          {/* Layout & Fit */}
          <button
            type="button"
            onClick={() => {
              onAutoLayout();
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-nb-surface-strong transition-colors"
          >
            <span className="flex items-center gap-2">
              <LayoutGrid className="h-3.5 w-3.5 text-indigo-500" />
              <span>Auto-Layout Graph</span>
            </span>
            <kbd className="font-mono text-[10px] text-nb-muted">⌘L</kbd>
          </button>

          <button
            type="button"
            onClick={() => {
              onFitView();
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-nb-surface-strong transition-colors"
          >
            <span className="flex items-center gap-2">
              <Maximize2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Fit to Viewport</span>
            </span>
            <kbd className="font-mono text-[10px] text-nb-muted">⌘1</kbd>
          </button>
        </div>
      )}

      {/* 2. NODE CONTEXT MENU */}
      {target.type === "node" && (
        <div className="space-y-1">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-nb-muted border-b border-nb-border/30 truncate">
            {target.node.data.label || "Node"}
          </div>

          <button
            type="button"
            onClick={() => {
              onInspectNode(target.node);
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-nb-surface-strong transition-colors"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-500" />
              <span>Inspect & Edit</span>
            </span>
            <kbd className="font-mono text-[10px] text-nb-muted">↵</kbd>
          </button>

          <button
            type="button"
            onClick={() => {
              onCopyNode(target.node);
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-nb-surface-strong transition-colors"
          >
            <span className="flex items-center gap-2">
              <Copy className="h-3.5 w-3.5 text-blue-500" />
              <span>Copy Node</span>
            </span>
            <kbd className="font-mono text-[10px] text-nb-muted">⌘C</kbd>
          </button>

          <button
            type="button"
            onClick={() => {
              onDuplicateNode(target.node);
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-nb-surface-strong transition-colors"
          >
            <span className="flex items-center gap-2">
              <Files className="h-3.5 w-3.5 text-amber-500" />
              <span>Duplicate Node</span>
            </span>
            <kbd className="font-mono text-[10px] text-nb-muted">⌘D</kbd>
          </button>

          <div className="my-1 border-t border-nb-border/30" />

          <button
            type="button"
            onClick={() => {
              onDeleteNode(target.node.id);
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Node</span>
            </span>
            <kbd className="font-mono text-[10px]">⌫</kbd>
          </button>
        </div>
      )}

      {/* 3. EDGE CONTEXT MENU */}
      {target.type === "edge" && (
        <div className="space-y-1">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-nb-muted border-b border-nb-border/30">
            Connection Flow
          </div>

          <button
            type="button"
            onClick={() => {
              onDeleteEdge(target.edge.id);
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Connection</span>
            </span>
            <kbd className="font-mono text-[10px]">⌫</kbd>
          </button>
        </div>
      )}
    </div>
  );
}
