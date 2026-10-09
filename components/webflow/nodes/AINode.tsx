"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Sparkles, Bot, BrainCircuit } from "lucide-react";
import { WebFlowNodeData } from "@/lib/webflow/types";

export const AINode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WebFlowNodeData;
  const { label, instructions, action, inputs = [], outputs = [] } = nodeData;

  return (
    <div
      className={`relative min-w-[240px] max-w-[300px] rounded-xl border-2 border-nb-border bg-nb-card p-3 shadow-nb-md transition-all duration-150 ${
        selected
          ? "ring-3 ring-pink-500 shadow-nb-lg -translate-y-0.5"
          : "hover:border-pink-400"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!w-3 !h-3 !border-2 !border-nb-border !bg-pink-500 !-left-1.5 transition-transform hover:scale-125"
      />

      <div className="flex items-center justify-between gap-2 border-b-2 border-nb-border/30 pb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-400 border border-pink-300 dark:border-pink-800 shrink-0">
            <Sparkles className="h-3 w-3" />
          </div>
          <span className="truncate text-xs font-black tracking-tight text-nb-fg">
            {label || "AI Agent Step"}
          </span>
        </div>
        <span className="rounded bg-pink-50 dark:bg-pink-950/80 px-1.5 py-0.5 text-[10px] font-bold text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-800 shrink-0">
          Agent
        </span>
      </div>

      <div className="mt-2 text-xs font-bold text-nb-fg">
        {action || "Prompt / Reasoning"}
      </div>

      {instructions ? (
        <div className="mt-1.5 rounded bg-nb-surface-alt p-2 text-[11px] font-mono text-nb-fg line-clamp-3 border border-nb-border/30">
          {instructions}
        </div>
      ) : (
        <div className="mt-1 text-[11px] text-nb-muted italic">
          No agent prompt configured
        </div>
      )}

      {(inputs.length > 0 || outputs.length > 0) && (
        <div className="mt-2.5 flex flex-wrap gap-1 text-[10px]">
          {inputs.length > 0 && (
            <span className="rounded bg-nb-surface-strong px-1.5 py-0.5 font-mono text-nb-fg">
              in: {inputs.length}
            </span>
          )}
          {outputs.length > 0 && (
            <span className="rounded bg-nb-surface-strong px-1.5 py-0.5 font-mono text-nb-fg">
              out: {outputs.length}
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!w-3 !h-3 !border-2 !border-nb-border !bg-pink-500 !-right-1.5 transition-transform hover:scale-125"
      />
    </div>
  );
});

AINode.displayName = "AINode";
