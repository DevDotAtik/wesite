"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Binary, ArrowUpDown } from "lucide-react";
import { WebFlowNodeData } from "@/lib/webflow/types";

export const TransformNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WebFlowNodeData;
  const { label = "Transform", action, actionDescription, inputs = [], outputs = [] } = nodeData;

  return (
    <div
      className={`relative min-w-[220px] max-w-[280px] rounded-xl border-2 border-nb-border bg-nb-card p-3 shadow-nb-md transition-all duration-150 ${
        selected
          ? "ring-3 ring-teal-500 shadow-nb-lg -translate-y-0.5"
          : "hover:border-teal-400"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!w-3 !h-3 !border-2 !border-nb-border !bg-teal-500 !-left-1.5 transition-transform hover:scale-125"
      />

      <div className="flex items-center justify-between gap-2 border-b-2 border-nb-border/30 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 border border-teal-300 dark:border-teal-800 shrink-0">
            <ArrowUpDown className="h-3 w-3" />
          </div>
          <span className="truncate text-xs font-black tracking-tight text-nb-fg">
            {label}
          </span>
        </div>
        <span className="rounded bg-teal-50 dark:bg-teal-950/80 px-1.5 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 shrink-0">
          Transform
        </span>
      </div>

      <div className="mt-2 text-xs font-bold text-nb-fg">
        {action || "Map & Format Data"}
      </div>

      {actionDescription && (
        <div className="mt-1 text-[11px] text-nb-muted line-clamp-2">
          {actionDescription}
        </div>
      )}

      {(inputs.length > 0 || outputs.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
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
        className="!w-3 !h-3 !border-2 !border-nb-border !bg-teal-500 !-right-1.5 transition-transform hover:scale-125"
      />
    </div>
  );
});

TransformNode.displayName = "TransformNode";
