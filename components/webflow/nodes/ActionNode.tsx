"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Zap, Sparkles } from "lucide-react";
import { WebFlowNodeData } from "@/lib/webflow/types";

export const ActionNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WebFlowNodeData;
  const {
    label,
    action,
    actionDescription,
    inputs = [],
    outputs = [],
    instructions,
    customBg,
    customBorderColor,
    executionState = "idle",
  } = nodeData;

  const isRunning = executionState === "running";
  const isSuccess = executionState === "success";

  const customStyle: React.CSSProperties = {
    backgroundColor: typeof customBg === "string" && customBg ? customBg : "var(--nb-card)",
    borderColor: typeof customBorderColor === "string" && customBorderColor ? customBorderColor : "var(--nb-border)",
  };

  return (
    <div
      style={customStyle}
      title="Action Task • Click to configure in inspector"
      className={`group relative w-auto min-w-[240px] max-w-[420px] rounded-2xl border-2 border-nb-border bg-nb-card p-3 shadow-nb-md transition-all duration-200 ${
        isRunning
          ? "ring-4 ring-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.5)] -translate-y-1 webflow-node-executing"
          : isSuccess
          ? "ring-3 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
          : selected
          ? "ring-3 ring-amber-500 shadow-nb-xl -translate-y-1"
          : "hover:border-amber-400 hover:shadow-nb-lg hover:-translate-y-0.5"
      }`}
    >
      {isRunning && (
        <div className="absolute -top-3 right-4 z-20 flex items-center gap-1.5 rounded-full bg-amber-600 border border-white/20 px-2.5 py-0.5 text-[9px] font-black text-white shadow-md animate-bounce">
          <span className="size-1.5 rounded-full bg-white animate-ping" />
          <span>Processing...</span>
        </div>
      )}
      {isSuccess && (
        <div className="absolute -top-3 right-4 z-20 flex items-center gap-1 rounded-full bg-emerald-600 border border-white/20 px-2.5 py-0.5 text-[9px] font-black text-white shadow-md">
          <span>✔ Done</span>
        </div>
      )}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!w-3.5 !h-3.5 !border-2 !border-nb-border !bg-amber-500 !-left-1.5 transition-transform hover:scale-130 shadow-nb-xs"
      />

      <div className="flex items-start justify-between gap-2 border-b-2 border-nb-border pb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-400 dark:border-amber-700 shrink-0">
            <Zap className="h-3 w-3" />
          </div>
          <span className="break-words text-xs font-black tracking-tight text-nb-fg leading-tight">
            {label || "Action"}
          </span>
        </div>
        <span className="rounded bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-200 border border-amber-400 dark:border-amber-700 shrink-0">
          Task
        </span>
      </div>

      <div className="mt-2 text-xs font-bold text-nb-fg break-words leading-snug">
        {action || "Execute Step"}
      </div>
      {actionDescription && (
        <div className="mt-1 text-[11px] text-nb-muted break-words leading-relaxed">
          {actionDescription}
        </div>
      )}

      {(inputs.length > 0 || outputs.length > 0 || instructions) && (
        <div className="mt-2.5 flex flex-wrap gap-1 text-[10px]">
          {inputs.length > 0 && (
            <span className="rounded bg-nb-surface-strong px-1.5 py-0.5 font-mono text-nb-fg border border-nb-border">
              in: {inputs.length}
            </span>
          )}
          {outputs.length > 0 && (
            <span className="rounded bg-nb-surface-strong px-1.5 py-0.5 font-mono text-nb-fg border border-nb-border">
              out: {outputs.length}
            </span>
          )}
          {instructions && (
            <span className="rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-400 dark:border-amber-700 px-1.5 py-0.5 font-mono flex items-center gap-0.5 font-bold">
              <Sparkles className="h-2 w-2" /> AI
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!w-3 !h-3 !border-2 !border-nb-border !bg-amber-500 !-right-1.5 transition-transform hover:scale-125"
      />
    </div>
  );
});

ActionNode.displayName = "ActionNode";
