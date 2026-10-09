"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";
import { WebFlowNodeData } from "@/lib/webflow/types";

export const StartNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WebFlowNodeData;
  const { label = "Start Flow", description } = nodeData;

  return (
    <div
      className={`relative min-w-[170px] rounded-xl border-2 border-nb-border bg-emerald-50 dark:bg-emerald-950/60 p-2.5 shadow-nb-md transition-all duration-150 ${
        selected
          ? "ring-3 ring-emerald-500 shadow-nb-lg -translate-y-0.5"
          : "hover:border-emerald-500"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white border border-nb-border shadow-nb-sm shrink-0">
          <Play className="h-4 w-4 fill-white translate-x-0.5" />
        </div>
        <div className="overflow-hidden">
          <div className="text-xs font-black tracking-tight text-emerald-950 dark:text-emerald-100 truncate">
            {label}
          </div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium truncate">
            {description || "Workflow Trigger"}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!w-3 !h-3 !border-2 !border-nb-border !bg-emerald-500 !-right-1.5 transition-transform hover:scale-125"
      />
    </div>
  );
});

StartNode.displayName = "StartNode";
