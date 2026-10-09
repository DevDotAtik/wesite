"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { GitFork, Check, X } from "lucide-react";
import { WebFlowNodeData } from "@/lib/webflow/types";

export const ConditionNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WebFlowNodeData;
  const { label, conditionExpression, description } = nodeData;

  return (
    <div
      className={`relative min-w-[240px] max-w-[280px] rounded-xl border-2 border-nb-border bg-nb-card p-3 shadow-nb-md transition-all duration-150 ${
        selected
          ? "ring-3 ring-violet-500 shadow-nb-lg -translate-y-0.5"
          : "hover:border-violet-400"
      }`}
    >
      {/* Incoming flow handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!w-3 !h-3 !border-2 !border-nb-border !bg-violet-500 !-left-1.5 transition-transform hover:scale-125"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b-2 border-nb-border/30 pb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-400 border border-violet-300 dark:border-violet-800 shrink-0">
            <GitFork className="h-3 w-3" />
          </div>
          <span className="truncate text-xs font-black tracking-tight text-nb-fg">
            {label || "Condition"}
          </span>
        </div>
        <span className="rounded bg-violet-50 dark:bg-violet-950/80 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800 shrink-0">
          Branch
        </span>
      </div>

      {/* Condition Expression */}
      <div className="mt-2 rounded bg-nb-surface-alt p-2 font-mono text-[11px] font-bold text-nb-fg border border-nb-border/40">
        <span className="text-violet-600 dark:text-violet-400">IF </span>
        <span className="break-all">{conditionExpression || "expression === true"}</span>
      </div>

      {description && (
        <div className="mt-1 text-[11px] text-nb-muted line-clamp-2">
          {description}
        </div>
      )}

      {/* Branch Outputs indicator */}
      <div className="mt-3 space-y-1.5 border-t border-nb-border/30 pt-2">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Check className="h-3 w-3" /> TRUE
          </span>
          <span className="text-[10px] text-nb-muted">Pass</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
            <X className="h-3 w-3" /> FALSE
          </span>
          <span className="text-[10px] text-nb-muted">Fail</span>
        </div>
      </div>

      {/* Out Handles: True (top right) & False (bottom right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: "68%" }}
        className="!w-3 !h-3 !border-2 !border-nb-border !bg-emerald-500 !-right-1.5 transition-transform hover:scale-125"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: "86%" }}
        className="!w-3 !h-3 !border-2 !border-nb-border !bg-rose-500 !-right-1.5 transition-transform hover:scale-125"
      />
    </div>
  );
});

ConditionNode.displayName = "ConditionNode";
