"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Clock } from "lucide-react";
import { WebFlowNodeData } from "@/lib/webflow/types";

export const DelayNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WebFlowNodeData;
  const { label = "Delay", delaySeconds = 5, description } = nodeData;

  return (
    <div
      className={`relative min-w-[200px] rounded-xl border-2 border-nb-border bg-nb-card p-3 shadow-nb-md transition-all duration-150 ${
        selected
          ? "ring-3 ring-orange-500 shadow-nb-lg -translate-y-0.5"
          : "hover:border-orange-400"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!w-3 !h-3 !border-2 !border-nb-border !bg-orange-500 !-left-1.5 transition-transform hover:scale-125"
      />

      <div className="flex items-center justify-between gap-2 border-b-2 border-nb-border/30 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-800 shrink-0">
            <Clock className="h-3 w-3" />
          </div>
          <span className="truncate text-xs font-black tracking-tight text-nb-fg">
            {label}
          </span>
        </div>
        <span className="rounded bg-orange-50 dark:bg-orange-950/80 px-1.5 py-0.5 text-[10px] font-bold text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 shrink-0">
          Wait
        </span>
      </div>

      <div className="mt-2 text-center py-1 rounded bg-nb-surface-alt border border-nb-border/30">
        <span className="font-mono text-sm font-black text-orange-600 dark:text-orange-400">
          {delaySeconds}s
        </span>
        <span className="text-[11px] text-nb-muted ml-1">delay</span>
      </div>

      {description && (
        <div className="mt-1 text-[11px] text-nb-muted line-clamp-1">
          {description}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!w-3 !h-3 !border-2 !border-nb-border !bg-orange-500 !-right-1.5 transition-transform hover:scale-125"
      />
    </div>
  );
});

DelayNode.displayName = "DelayNode";
