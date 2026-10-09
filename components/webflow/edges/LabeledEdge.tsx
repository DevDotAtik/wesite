"use client";

import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  useReactFlow,
} from "@xyflow/react";
import { X } from "lucide-react";

export function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data,
  selected,
}: EdgeProps) {
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const onEdgeDelete = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    setEdges((edges) => edges.filter((e) => e.id !== id));
  };

  const conditionBranch = data?.conditionBranch as string | undefined;
  const isTrueBranch = conditionBranch === "true";
  const isFalseBranch = conditionBranch === "false";

  // Dynamic stroke color for condition edges
  const strokeColor = isTrueBranch
    ? "#10b981"
    : isFalseBranch
    ? "#ef4444"
    : selected
    ? "#6366f1"
    : "#0f172a";

  const displayLabel =
    isTrueBranch
      ? "TRUE"
      : isFalseBranch
      ? "FALSE"
      : label || (data?.label as string | undefined);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: strokeColor,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan group flex items-center gap-1"
        >
          {displayLabel && (
            <div
              className={`rounded-full border px-2 py-0.5 text-[10px] font-mono font-bold shadow-sm transition-transform ${
                isTrueBranch
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700"
                  : isFalseBranch
                  ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700"
                  : "bg-nb-card text-nb-fg border-nb-border"
              }`}
            >
              {displayLabel}
            </div>
          )}

          {/* Delete edge button on hover/selected */}
          <button
            type="button"
            onClick={onEdgeDelete}
            className={`flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm transition-opacity hover:bg-rose-600 ${
              selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
            title="Delete connection"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
