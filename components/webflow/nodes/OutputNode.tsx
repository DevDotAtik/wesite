"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { ArrowLeftToLine, CheckCheck } from "lucide-react";
import { WebFlowNodeData } from "@/lib/webflow/types";

export const OutputNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WebFlowNodeData;
  const { label, outputs = [], description, customBg, customBorderColor, executionState = "idle" } = nodeData;

  const isRunning = executionState === "running";
  const isSuccess = executionState === "success";

  const customStyle: React.CSSProperties = {
    backgroundColor: typeof customBg === "string" && customBg ? customBg : "var(--nb-card)",
    borderColor: typeof customBorderColor === "string" && customBorderColor ? customBorderColor : "var(--nb-border)",
  };

  return (
    <div
      style={customStyle}
      title="Workflow Output • Final deliverables and results"
      className={`group relative w-auto min-w-[240px] max-w-[420px] rounded-2xl border-2 border-nb-border bg-nb-card p-3 shadow-nb-md transition-all duration-200 ${
        isRunning
          ? "ring-4 ring-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.5)] -translate-y-1 webflow-node-executing"
          : isSuccess
          ? "ring-3 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
          : selected
          ? "ring-3 ring-emerald-500 shadow-nb-xl -translate-y-1"
          : "hover:border-emerald-400 hover:shadow-nb-lg hover:-translate-y-0.5"
      }`}
    >
      {isRunning && (
        <div className="absolute -top-3 right-4 z-20 flex items-center gap-1.5 rounded-full bg-emerald-600 border border-white/20 px-2.5 py-0.5 text-[9px] font-black text-white shadow-md animate-bounce">
          <span className="size-1.5 rounded-full bg-white animate-ping" />
          <span>Collecting...</span>
        </div>
      )}
      {isSuccess && (
        <div className="absolute -top-3 right-4 z-20 flex items-center gap-1 rounded-full bg-emerald-600 border border-white/20 px-2.5 py-0.5 text-[9px] font-black text-white shadow-md">
          <span>✔ Produced</span>
        </div>
      )}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!w-3.5 !h-3.5 !border-2 !border-nb-border !bg-emerald-500 !-left-1.5 transition-transform hover:scale-130 shadow-nb-xs"
      />

      <div className="flex items-start justify-between gap-2 border-b-2 border-nb-border pb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-700 shrink-0">
            <ArrowLeftToLine className="h-3 w-3" />
          </div>
          <span className="break-words text-xs font-black tracking-tight text-nb-fg leading-tight">
            {label || "Workflow Outputs"}
          </span>
        </div>
        <span className="rounded bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-700 shrink-0">
          Result
        </span>
      </div>

      {description && (
        <div className="mt-2 text-[11px] text-nb-muted break-words leading-relaxed">
          {description}
        </div>
      )}

      <div className="mt-2.5 space-y-1">
        {outputs.length === 0 ? (
          <div className="rounded bg-nb-surface-alt p-1.5 text-center text-[10px] text-nb-muted italic border border-nb-border">
            No output artifacts declared
          </div>
        ) : (
          outputs.map((out, idx) => (
            <div
              key={out.id || idx}
              className="flex items-center justify-between gap-2 rounded bg-nb-surface-alt px-2 py-1 text-[11px] font-mono border border-nb-border"
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <CheckCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-bold text-nb-fg break-words leading-snug">{out.name}</span>
              </div>
              <span className="text-[10px] text-nb-muted shrink-0">{out.type || "string"}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

OutputNode.displayName = "OutputNode";
