"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { ArrowLeftToLine, CheckCheck } from "lucide-react";
import { WebFlowNodeData } from "@/lib/webflow/types";

export const OutputNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WebFlowNodeData;
  const { label, outputs = [], description, customBg, customBorderColor } = nodeData;

  const customStyle: React.CSSProperties = {};
  if (typeof customBg === "string" && customBg) customStyle.backgroundColor = customBg;
  if (typeof customBorderColor === "string" && customBorderColor) customStyle.borderColor = customBorderColor;

  return (
    <div
      style={customStyle}
      className={`relative min-w-[220px] max-w-[280px] rounded-xl border-2 border-nb-border bg-nb-card p-3 shadow-nb-md transition-all duration-150 ${
        selected
          ? "ring-3 ring-emerald-500 shadow-nb-lg -translate-y-0.5"
          : "hover:border-emerald-400"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!w-3 !h-3 !border-2 !border-nb-border !bg-emerald-500 !-left-1.5 transition-transform hover:scale-125"
      />

      <div className="flex items-center justify-between gap-2 border-b-2 border-nb-border pb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-700 shrink-0">
            <ArrowLeftToLine className="h-3 w-3" />
          </div>
          <span className="truncate text-xs font-black tracking-tight text-nb-fg">
            {label || "Workflow Outputs"}
          </span>
        </div>
        <span className="rounded bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-700 shrink-0">
          Result
        </span>
      </div>

      {description && (
        <div className="mt-2 text-[11px] text-nb-muted">
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
              className="flex items-center justify-between rounded bg-nb-surface-alt px-2 py-1 text-[11px] font-mono border border-nb-border"
            >
              <div className="flex items-center gap-1.5 truncate">
                <CheckCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-bold text-nb-fg truncate">{out.name}</span>
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
