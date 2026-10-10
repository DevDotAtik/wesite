"use client";

import React, { useCallback, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Edge,
  Node,
  useReactFlow,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "./nodeTypes";
import { edgeTypes } from "./edgeTypes";
import type { WebFlowNode, WebFlowEdge, WebFlowNodeData } from "@/lib/webflow/types";
import { CanvasCustomization, DEFAULT_CANVAS_STYLE } from "@/lib/webflow/canvasStyle";

interface WebFlowCanvasProps {
  nodes: WebFlowNode[];
  edges: WebFlowEdge[];
  onNodesChange: OnNodesChange<Node>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: OnConnect;
  onNodeSelect: (node: WebFlowNode | null) => void;
  onAddNodeAtPosition: (nodeType: string, data: WebFlowNodeData, position: { x: number; y: number }) => void;
  onPaneContextMenu?: (event: React.MouseEvent, flowPosition: { x: number; y: number }) => void;
  onNodeContextMenu?: (event: React.MouseEvent, node: WebFlowNode) => void;
  onEdgeContextMenu?: (event: React.MouseEvent, edge: WebFlowEdge) => void;
  onNodeDragStop?: OnNodeDrag<Node>;
  styleSettings?: CanvasCustomization;
  isReadOnly?: boolean;
}

export function WebFlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeSelect,
  onAddNodeAtPosition,
  onPaneContextMenu,
  onNodeContextMenu,
  onEdgeContextMenu,
  onNodeDragStop,
  styleSettings = DEFAULT_CANVAS_STYLE,
  isReadOnly = false,
}: WebFlowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Drag over handler for HTML5 drag-and-drop
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Drop handler
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const rawData = event.dataTransfer.getData("application/reactflow");
      if (!rawData) return;

      try {
        const { type, data } = JSON.parse(rawData);
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        onAddNodeAtPosition(type, data, position);
      } catch (e) {
        console.error("Failed to parse dropped node", e);
      }
    },
    [screenToFlowPosition, onAddNodeAtPosition]
  );

  // Selection handlers
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect(node as unknown as WebFlowNode);
    },
    [onNodeSelect]
  );

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  const handlePaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      const mouseEvent = event as React.MouseEvent;
      const flowPos = screenToFlowPosition({
        x: mouseEvent.clientX,
        y: mouseEvent.clientY,
      });
      onPaneContextMenu?.(mouseEvent, flowPos);
    },
    [onPaneContextMenu, screenToFlowPosition]
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      onNodeContextMenu?.(event, node as unknown as WebFlowNode);
    },
    [onNodeContextMenu]
  );

  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      onEdgeContextMenu?.(event, edge as unknown as WebFlowEdge);
    },
    [onEdgeContextMenu]
  );

  // Enrich edges with live canvas customizer properties
  const styledEdges = useMemo(() => {
    return edges.map((e) => ({
      ...e,
      animated: styleSettings.animatedLines || e.animated,
      data: {
        ...(e.data || {}),
        customLineWidth: styleSettings.lineWidth,
        customLineColor: styleSettings.lineColor,
        customLineRouting: styleSettings.lineRouting,
        customLineDashed: styleSettings.lineDashed,
      },
    }));
  }, [edges, styleSettings]);

  // Enrich nodes with global card theme if no individual customBg is set
  const styledNodes = useMemo(() => {
    return nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        globalCardTheme: styleSettings.cardTheme,
        globalBorderWidth: styleSettings.nodeBorderWidth,
        globalBorderRadius: styleSettings.nodeBorderRadius,
      },
    }));
  }, [nodes, styleSettings]);

  // Map grid variant
  const bgVariant = useMemo(() => {
    switch (styleSettings.gridVariant) {
      case "lines":
        return BackgroundVariant.Lines;
      case "cross":
        return BackgroundVariant.Cross;
      case "dots":
      default:
        return BackgroundVariant.Dots;
    }
  }, [styleSettings.gridVariant]);

  return (
    <div ref={reactFlowWrapper} className={`relative h-full w-full bg-nb-bg select-none ${isReadOnly ? "webflow-readonly" : ""}`}>
      <ReactFlow
        nodes={styledNodes as unknown as Node[]}
        edges={styledEdges as unknown as Edge[]}
        onNodesChange={isReadOnly ? undefined : onNodesChange}
        onEdgesChange={isReadOnly ? undefined : onEdgesChange}
        onConnect={isReadOnly ? undefined : onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onDragOver={isReadOnly ? undefined : onDragOver}
        onDrop={isReadOnly ? undefined : onDrop}
        onNodeClick={isReadOnly ? undefined : handleNodeClick}
        onPaneClick={handlePaneClick}
        onPaneContextMenu={isReadOnly ? undefined : handlePaneContextMenu}
        onNodeContextMenu={isReadOnly ? undefined : handleNodeContextMenu}
        onEdgeContextMenu={isReadOnly ? undefined : handleEdgeContextMenu}
        onNodeDragStop={isReadOnly ? undefined : onNodeDragStop}
        nodesDraggable={!isReadOnly}
        nodesConnectable={!isReadOnly}
        elementsSelectable={!isReadOnly}
        panOnDrag={true}
        zoomOnPinch={true}
        zoomOnScroll={true}
        preventScrolling={true}
        snapToGrid={styleSettings.snapToGrid}
        snapGrid={[styleSettings.gridGap, styleSettings.gridGap]}
        defaultEdgeOptions={{
          type: "labeledEdge",
          animated: styleSettings.animatedLines,
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.5}
        deleteKeyCode={isReadOnly ? null : ["Backspace", "Delete"]}
        multiSelectionKeyCode={isReadOnly ? null : ["Meta", "Control"]}
        proOptions={{ hideAttribution: true }}
      >
        {styleSettings.gridVariant !== "none" && (
          <Background
            variant={bgVariant}
            gap={styleSettings.gridGap}
            size={1.5}
            color="var(--nb-border)"
          />
        )}
        <Controls
          position="bottom-left"
          showInteractive={false}
          className="!border-2 !border-nb-border !bg-nb-card !shadow-nb-sm !rounded-xl"
        />
        {!isReadOnly && (
          <MiniMap
            position="bottom-right"
            nodeColor={(n) => {
              const nodeData = n.data as WebFlowNodeData;
              switch (nodeData?.kind) {
                case "website":
                  return "#6366f1";
                case "action":
                  return "#f59e0b";
                case "condition":
                  return "#8b5cf6";
                case "ai":
                  return "#ec4899";
                case "start":
                  return "#10b981";
                case "end":
                  return "#64748b";
                case "transform":
                  return "#14b8a6";
                case "delay":
                  return "#f97316";
                case "note":
                  return "#eab308";
                default:
                  return "#94a3b8";
              }
            }}
            maskColor="rgba(0, 0, 0, 0.45)"
            nodeStrokeWidth={2}
            nodeBorderRadius={4}
            className="!border-2 !border-nb-border !rounded-xl !bg-nb-card !shadow-nb-lg !opacity-100 hidden sm:block"
          />
        )}
      </ReactFlow>
    </div>
  );
}
