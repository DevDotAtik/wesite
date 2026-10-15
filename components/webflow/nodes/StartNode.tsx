"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";
import { WebFlowNodeData } from "@/lib/webflow/types";

export const StartNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WebFlowNodeData;
  const { label = "Start Flow", description, customBg, customBorderColor, executionState = "idle" } = nodeData;

  const isRunning = executionState === "running";
  const isSuccess = executionState === "success";

  const customStyle: React.CSSProperties = {};
  if (typeof customBg === "string" && customBg) customStyle.backgroundColor = customBg;
  if (typeof customBorderColor === "string" && customBorderColor) customStyle.borderColor = customBorderColor;

  return (
    <div
      style={customStyle}
      title="Start Trigger • Entry point of this workflow"
      className={`group relative w-auto min-w-[190px] max-w-[380px] rounded-2xl border-2 border-nb-border bg-emerald-100 dark:bg-emerald-950 p-3 shadow-nb-md transition-all duration-200 ${
        isRunning
          ? "ring-4 ring-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.5)] -translate-y-1 webflow-node-executing"
          : isSuccess
          ? "ring-3 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
          : selected
          ? "ring-3 ring-emerald-500 shadow-nb-xl -translate-y-1"
          : "hover:border-emerald-500 hover:shadow-nb-lg hover:-translate-y-0.5"
      }`}
    >
      {isRunning && (
        <div className="absolute -top-3 right-4 z-20 flex items-center gap-1.5 rounded-full bg-emerald-600 border border-white/20 px-2 py-0.5 text-[9px] font-black text-white shadow-md animate-bounce">
          <span className="size-1.5 rounded-full bg-white animate-ping" />
          <span>Starting...</span>
        </div>
      )}
      <div className="flex items-center gap-2.5">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white border-2 border-nb-border shadow-nb-sm shrink-0">
          <Play className="h-4 w-4 fill-white translate-x-0.5" />
          <span className="absolute -inset-0.5 rounded-xl border border-emerald-400/50 animate-ping opacity-40 pointer-events-none" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-black tracking-tight text-emerald-950 dark:text-emerald-100 break-words leading-tight">
            {label}
          </div>
          <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold break-words leading-snug mt-0.5">
            {description || "Entry Trigger"}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!w-3.5 !h-3.5 !border-2 !border-nb-border !bg-emerald-500 !-right-1.5 transition-transform hover:scale-130 shadow-nb-xs"
      />
    </div>
  );
});

StartNode.displayName = "StartNode";
