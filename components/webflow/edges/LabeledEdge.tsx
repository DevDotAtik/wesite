"use client";

import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  getBezierPath,
  getStraightPath,
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

  const conditionBranch = data?.conditionBranch as string | undefined;
  const isTrueBranch = conditionBranch === "true";
  const isFalseBranch = conditionBranch === "false";

  // Custom styling attributes
  const customLineWidth = typeof data?.customLineWidth === "number" ? data.customLineWidth : undefined;
  const customLineColor = typeof data?.customLineColor === "string" ? data.customLineColor : undefined;
  const customRouting = typeof data?.customLineRouting === "string" ? data.customLineRouting : "smoothstep";
  const customDashed = Boolean(data?.customLineDashed);

  // Compute routing path based on custom choice
  let edgePath = "";
  let labelX = 0;
  let labelY = 0;

  if (customRouting === "bezier") {
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  } else if (customRouting === "straight") {
    [edgePath, labelX, labelY] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });
  } else if (customRouting === "step") {
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 0,
    });
  } else {
    // Default smoothstep
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 8,
    });
  }

  const onEdgeDelete = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    setEdges((edges) => edges.filter((e) => e.id !== id));
  };

  // Determine stroke color with high contrast solid fallback
  const baseColor =
    customLineColor && customLineColor !== "default"
      ? customLineColor
      : "var(--nb-border)";

  const strokeColor = isTrueBranch
    ? "#10b981"
    : isFalseBranch
    ? "#ef4444"
    : selected
    ? "#6366f1"
    : baseColor;

  const strokeWidth = selected
    ? (customLineWidth ? customLineWidth + 1.5 : 4)
    : (customLineWidth || 2.5);

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
          strokeWidth,
          stroke: strokeColor,
          strokeDasharray: customDashed ? "6 4" : undefined,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan group flex items-center gap-1 z-20"
        >
          {displayLabel && (
            <div
              className={`rounded-lg border-2 px-2 py-0.5 text-[10px] font-mono font-bold shadow-nb-xs transition-transform ${
                isTrueBranch
                  ? "bg-emerald-100 text-emerald-900 border-emerald-500 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700"
                  : isFalseBranch
                  ? "bg-rose-100 text-rose-900 border-rose-500 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700"
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
            className={`flex h-4 w-4 items-center justify-center rounded-md border border-nb-border bg-rose-600 text-white shadow-nb-xs hover:bg-rose-700 transition-all ${
              selected ? "block" : "hidden group-hover:flex"
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
