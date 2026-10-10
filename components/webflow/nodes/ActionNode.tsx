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
  } = nodeData;

  const customStyle: React.CSSProperties = {};
  if (typeof customBg === "string" && customBg) customStyle.backgroundColor = customBg;
  if (typeof customBorderColor === "string" && customBorderColor) customStyle.borderColor = customBorderColor;

  return (
    <div
      style={customStyle}
      className={`relative min-w-[240px] max-w-[300px] rounded-xl border-2 border-nb-border bg-nb-card p-3 shadow-nb-md transition-all duration-150 ${
        selected
          ? "ring-3 ring-amber-500 shadow-nb-lg -translate-y-0.5"
          : "hover:border-amber-400"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!w-3 !h-3 !border-2 !border-nb-border !bg-amber-500 !-left-1.5 transition-transform hover:scale-125"
      />

      <div className="flex items-center justify-between gap-2 border-b-2 border-nb-border pb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-400 dark:border-amber-700 shrink-0">
            <Zap className="h-3 w-3" />
          </div>
          <span className="truncate text-xs font-black tracking-tight text-nb-fg">
            {label || "Action"}
          </span>
        </div>
        <span className="rounded bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-200 border border-amber-400 dark:border-amber-700 shrink-0">
          Task
        </span>
      </div>

      <div className="mt-2 text-xs font-bold text-nb-fg">
        {action || "Execute Step"}
      </div>
      {actionDescription && (
        <div className="mt-0.5 text-[11px] text-nb-muted line-clamp-2">
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
