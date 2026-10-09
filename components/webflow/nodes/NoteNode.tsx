"use client";

import React, { memo } from "react";
import { NodeProps } from "@xyflow/react";
import { StickyNote } from "lucide-react";
import { WebFlowNodeData } from "@/lib/webflow/types";

export const NoteNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WebFlowNodeData;
  const { label = "Note", noteContent } = nodeData;

  return (
    <div
      className={`relative min-w-[200px] max-w-[280px] rounded-xl border-2 border-nb-border bg-amber-50 dark:bg-amber-950/40 p-3 shadow-nb-md transition-all duration-150 ${
        selected
          ? "ring-3 ring-amber-400 shadow-nb-lg -translate-y-0.5"
          : "hover:border-amber-500"
      }`}
    >
      <div className="flex items-center gap-1.5 border-b border-nb-border/20 pb-1.5 text-amber-800 dark:text-amber-300">
        <StickyNote className="h-3.5 w-3.5" />
        <span className="text-xs font-bold truncate">{label}</span>
      </div>

      <div className="mt-2 text-xs text-amber-950 dark:text-amber-100 whitespace-pre-wrap font-sans leading-relaxed">
        {noteContent || "Add workflow documentation notes or instructions here..."}
      </div>
    </div>
  );
});

NoteNode.displayName = "NoteNode";
