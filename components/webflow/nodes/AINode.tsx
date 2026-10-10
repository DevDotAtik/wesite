"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { AIIcon } from "../AIIcon";
import { WebFlowNodeData } from "@/lib/webflow/types";

export const AINode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WebFlowNodeData;
  const {
    label,
    instructions,
    action,
    inputs = [],
    outputs = [],
    customBg,
    customBorderColor,
  } = nodeData;

  const customStyle: React.CSSProperties = {};
  if (typeof customBg === "string" && customBg) customStyle.backgroundColor = customBg;
  if (typeof customBorderColor === "string" && customBorderColor) customStyle.borderColor = customBorderColor;

  return (
    <div
      style={customStyle}
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

      <div className="flex items-center justify-between gap-2 border-b-2 border-nb-border pb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-400 border border-pink-400 dark:border-pink-700 shrink-0">
            <AIIcon className="h-3.5 w-3.5 text-pink-500" glow />
          </div>
          <span className="truncate text-xs font-black tracking-tight text-nb-fg">
            {label || "AI Agent Step"}
          </span>
        </div>
        <span className="rounded bg-pink-100 dark:bg-pink-950 px-1.5 py-0.5 text-[10px] font-bold text-pink-800 dark:text-pink-300 border border-pink-400 dark:border-pink-700 shrink-0">
          Agent
        </span>
      </div>

      <div className="mt-2 text-xs font-bold text-nb-fg">
        {action || "Prompt / Reasoning"}
      </div>

      {instructions ? (
        <div className="mt-1.5 rounded bg-nb-surface-alt p-2 text-[11px] font-mono text-nb-fg line-clamp-3 border border-nb-border">
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
            <span className="rounded bg-nb-surface-strong px-1.5 py-0.5 font-mono text-nb-fg border border-nb-border">
              in: {inputs.length}
            </span>
          )}
          {outputs.length > 0 && (
            <span className="rounded bg-nb-surface-strong px-1.5 py-0.5 font-mono text-nb-fg border border-nb-border">
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
