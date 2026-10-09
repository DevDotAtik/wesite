"use client";

import React, { useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Connection,
  Edge,
  Node,
  useReactFlow,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "./nodeTypes";
import { edgeTypes } from "./edgeTypes";
import type { WebFlowNode, WebFlowEdge, WebFlowNodeData } from "@/lib/webflow/types";

interface WebFlowCanvasProps {
  nodes: WebFlowNode[];
  edges: WebFlowEdge[];
  onNodesChange: OnNodesChange<Node>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: OnConnect;
  onNodeSelect: (node: WebFlowNode | null) => void;
  onAddNodeAtPosition: (nodeType: string, data: WebFlowNodeData, position: { x: number; y: number }) => void;
}

export function WebFlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeSelect,
  onAddNodeAtPosition,
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

  return (
    <div ref={reactFlowWrapper} className="relative h-full w-full bg-nb-bg">
      <ReactFlow
        nodes={nodes as unknown as Node[]}
        edges={edges as unknown as Edge[]}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        snapToGrid={true}
        snapGrid={[16, 16]}
        defaultEdgeOptions={{
          type: "labeledEdge",
          animated: false,
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.5}
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode={["Meta", "Control"]}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1.5}
          color="rgba(100, 116, 139, 0.25)"
        />
        <Controls
          showInteractive={false}
          className="!border-2 !border-nb-border !bg-nb-card !shadow-nb-sm !rounded-xl !overflow-hidden"
        />
        <MiniMap
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
              default:
                return "#94a3b8";
            }
          }}
          maskColor="rgba(15, 23, 42, 0.15)"
          className="!border-2 !border-nb-border !rounded-xl !bg-nb-card !shadow-nb-md"
        />
      </ReactFlow>
    </div>
  );
}
