"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { CheckCircle2 } from "lucide-react";
import { WebFlowNodeData } from "@/lib/webflow/types";

export const EndNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WebFlowNodeData;
  const { label = "Flow Complete", description } = nodeData;

  return (
    <div
      className={`relative min-w-[170px] rounded-xl border-2 border-nb-border bg-slate-50 dark:bg-slate-900/80 p-2.5 shadow-nb-md transition-all duration-150 ${
        selected
          ? "ring-3 ring-slate-500 shadow-nb-lg -translate-y-0.5"
          : "hover:border-slate-500"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!w-3 !h-3 !border-2 !border-nb-border !bg-slate-500 !-left-1.5 transition-transform hover:scale-125"
      />

      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 dark:bg-slate-700 text-white border border-nb-border shadow-nb-sm shrink-0">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div className="overflow-hidden">
          <div className="text-xs font-black tracking-tight text-slate-950 dark:text-slate-100 truncate">
            {label}
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate">
            {description || "Exit Terminal"}
          </div>
        </div>
      </div>
    </div>
  );
});

EndNode.displayName = "EndNode";
