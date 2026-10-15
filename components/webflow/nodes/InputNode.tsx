"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { ArrowRightToLine, FileCode } from "lucide-react";
import { WebFlowNodeData } from "@/lib/webflow/types";

export const InputNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WebFlowNodeData;
  const { label, inputs = [], description, customBg, customBorderColor } = nodeData;

  const customStyle: React.CSSProperties = {
    backgroundColor: typeof customBg === "string" && customBg ? customBg : "var(--nb-card)",
    borderColor: typeof customBorderColor === "string" && customBorderColor ? customBorderColor : "var(--nb-border)",
  };

  return (
    <div
      style={customStyle}
      className={`relative w-auto min-w-[240px] max-w-[420px] rounded-xl border-2 border-nb-border bg-nb-card p-3 shadow-nb-md transition-all duration-150 ${
        selected
          ? "ring-3 ring-cyan-500 shadow-nb-lg -translate-y-0.5"
          : "hover:border-cyan-400"
      }`}
    >
      <div className="flex items-start justify-between gap-2 border-b-2 border-nb-border pb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-400 dark:border-cyan-700 shrink-0">
            <ArrowRightToLine className="h-3 w-3" />
          </div>
          <span className="break-words text-xs font-black tracking-tight text-nb-fg leading-tight">
            {label || "Workflow Inputs"}
          </span>
        </div>
        <span className="rounded bg-cyan-100 dark:bg-cyan-950 px-1.5 py-0.5 text-[10px] font-bold text-cyan-800 dark:text-cyan-300 border border-cyan-400 dark:border-cyan-700 shrink-0">
          Input
        </span>
      </div>

      {description && (
        <div className="mt-2 text-[11px] text-nb-muted break-words leading-relaxed">
          {description}
        </div>
      )}

      <div className="mt-2.5 space-y-1">
        {inputs.length === 0 ? (
          <div className="rounded bg-nb-surface-alt p-1.5 text-center text-[10px] text-nb-muted italic border border-nb-border">
            No input fields declared
          </div>
        ) : (
          inputs.map((inp, idx) => (
            <div
              key={inp.id || idx}
              className="flex items-center justify-between gap-2 rounded bg-nb-surface-alt px-2 py-1 text-[11px] font-mono border border-nb-border"
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <FileCode className="h-3 w-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span className="font-bold text-nb-fg break-words leading-snug">{inp.name}</span>
              </div>
              <span className="text-[10px] text-nb-muted shrink-0">{inp.type || "string"}</span>
            </div>
          ))
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!w-3 !h-3 !border-2 !border-nb-border !bg-cyan-500 !-right-1.5 transition-transform hover:scale-125"
      />
    </div>
  );
});

InputNode.displayName = "InputNode";
