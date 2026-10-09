"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  useReactFlow,
} from "@xyflow/react";
import { toast } from "sonner";
import { WebFlowToolbar } from "./WebFlowToolbar";
import { WebFlowSidebar } from "./WebFlowSidebar";
import { WebFlowCanvas } from "./WebFlowCanvas";
import { NodeInspector } from "./NodeInspector";
import { AIExportModal } from "./AIExportModal";
import { HumanDocModal } from "./HumanDocModal";
import { ValidationModal } from "./ValidationModal";
import { autoLayoutNodes } from "./autoLayout";
import { validateWebFlow } from "@/lib/webflow/validator";
import type {
  WebFlowNode,
  WebFlowEdge,
  WebFlowNodeData,
  WebFlowVariable,
  WebFlowCategory,
  WebFlowVisibility,
  WebFlowItem,
} from "@/lib/webflow/types";

function WebFlowEditorContent({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Workflow Metadata
  const [workflowName, setWorkflowName] = useState("Untitled WebFlow");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [workflowCategory, setWorkflowCategory] = useState<WebFlowCategory>("Productivity");
  const [visibility, setVisibility] = useState<WebFlowVisibility>("private");
  const [variables, setVariables] = useState<WebFlowVariable[]>([]);
  const [version, setVersion] = useState(1);
  const [isOwner, setIsOwner] = useState(true);

  // React Flow State
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Selection & UI Panels
  const [selectedNode, setSelectedNode] = useState<WebFlowNode | null>(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightInspectorOpen, setIsRightInspectorOpen] = useState(true);

  // Save State
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const isFirstLoad = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modals
  const [isAIExportOpen, setIsAIExportOpen] = useState(false);
  const [isHumanDocOpen, setIsHumanDocOpen] = useState(false);
  const [isValidationOpen, setIsValidationOpen] = useState(false);

  const { fitView } = useReactFlow();

  // Load Workflow Data
  useEffect(() => {
    async function loadWorkflow() {
      try {
        setLoading(true);
        const res = await fetch(`/api/webflows/${id}`);
        if (!res.ok) {
          throw new Error("Failed to load workflow");
        }
        const data = await res.json();
        const flow: WebFlowItem = data.webflow;

        setWorkflowName(flow.name || "Untitled WebFlow");
        setWorkflowDescription(flow.description || "");
        setWorkflowCategory(flow.category || "Productivity");
        setVisibility(flow.visibility || "private");
        setVariables(flow.variables || []);
        setVersion(flow.version || 1);
        setIsOwner(data.isOwner ?? true);

        // Populate React Flow
        setNodes((flow.nodes || []) as unknown as Node[]);
        setEdges((flow.edges || []) as unknown as Edge[]);

        setTimeout(() => {
          isFirstLoad.current = false;
        }, 500);
      } catch (err: any) {
        setError(err.message || "Error loading workflow");
      } finally {
        setLoading(false);
      }
    }

    loadWorkflow();
  }, [id, setNodes, setEdges]);

  // Autosave trigger
  const triggerAutosave = useCallback(
    (customData?: Partial<{
      name: string;
      description: string;
      category: WebFlowCategory;
      visibility: WebFlowVisibility;
      nodes: Node[];
      edges: Edge[];
      variables: WebFlowVariable[];
    }>) => {
      if (isFirstLoad.current || !isOwner) return;

      setSaveStatus("unsaved");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        setSaveStatus("saving");
        try {
          const payload = {
            name: customData?.name ?? workflowName,
            description: customData?.description ?? workflowDescription,
            category: customData?.category ?? workflowCategory,
            visibility: customData?.visibility ?? visibility,
            nodes: customData?.nodes ?? nodes,
            edges: customData?.edges ?? edges,
            variables: customData?.variables ?? variables,
          };

          const res = await fetch(`/api/webflows/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) throw new Error("Autosave failed");
          setSaveStatus("saved");
        } catch {
          setSaveStatus("unsaved");
          toast.error("Failed to save changes");
        }
      }, 1200);
    },
    [id, isOwner, workflowName, workflowDescription, workflowCategory, visibility, nodes, edges, variables]
  );

  // Watch for changes after initial load
  useEffect(() => {
    if (!isFirstLoad.current && isOwner) {
      triggerAutosave();
    }
  }, [nodes, edges, triggerAutosave, isOwner]);

  // Connect Handler
  const onConnect = useCallback(
    (connection: Connection) => {
      // Determine if source is a condition branch
      const sourceNode = nodes.find((n) => n.id === connection.source) as unknown as WebFlowNode;
      let branchLabel: string | undefined;

      if (sourceNode?.data.kind === "condition") {
        if (connection.sourceHandle === "true") branchLabel = "true";
        if (connection.sourceHandle === "false") branchLabel = "false";
      }

      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: "labeledEdge",
            data: branchLabel ? { conditionBranch: branchLabel } : undefined,
          },
          eds
        )
      );
    },
    [nodes, setEdges]
  );

  // Add Node from Palette
  const handleAddNode = useCallback(
    (nodeType: string, initialData: any) => {
      const newNodeId = `node_${Date.now()}`;
      // Place offset slightly below center or cascade
      const offset = (nodes.length % 5) * 40;
      const newNode: WebFlowNode = {
        id: newNodeId,
        type: nodeType,
        position: { x: 260 + offset, y: 180 + offset },
        data: initialData,
      };

      setNodes((nds) => [...nds, newNode as unknown as Node]);
      setSelectedNode(newNode);
      setIsRightInspectorOpen(true);
    },
    [nodes.length, setNodes]
  );

  // Add Node via Drag & Drop
  const handleAddNodeAtPosition = useCallback(
    (nodeType: string, data: WebFlowNodeData, position: { x: number; y: number }) => {
      const newNodeId = `node_${Date.now()}`;
      const newNode: WebFlowNode = {
        id: newNodeId,
        type: nodeType,
        position,
        data,
      };

      setNodes((nds) => [...nds, newNode as unknown as Node]);
      setSelectedNode(newNode);
      setIsRightInspectorOpen(true);
    },
    [setNodes]
  );

  // Update Node Data
  const handleUpdateNodeData = useCallback(
    (nodeId: string, partialData: Partial<WebFlowNodeData>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const updated = {
              ...node,
              data: {
                ...node.data,
                ...partialData,
              },
            };
            if (selectedNode?.id === nodeId) {
              setSelectedNode(updated as unknown as WebFlowNode);
            }
            return updated;
          }
          return node;
        })
      );
    },
    [selectedNode, setNodes]
  );

  // Delete Node
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  // Auto Layout
  const handleAutoLayout = useCallback(() => {
    const layouted = autoLayoutNodes(nodes as unknown as WebFlowNode[], edges as unknown as WebFlowEdge[]);
    setNodes(layouted as unknown as Node[]);
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50);
  }, [nodes, edges, setNodes, fitView]);

  // Validation
  const validation = validateWebFlow(nodes as unknown as WebFlowNode[], edges as unknown as WebFlowEdge[]);
  const warningCount = validation.issues.filter((i) => i.level === "warning").length;
  const errorCount = validation.issues.filter((i) => i.level === "error").length;

  // Keyboard shortcut Ctrl/Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        triggerAutosave();
        toast.success("Workflow saved!");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [triggerAutosave]);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-nb-bg space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="text-sm font-bold text-nb-fg">Loading WebFlow Editor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-nb-bg space-y-4 p-4 text-center">
        <div className="rounded-2xl border-3 border-nb-border bg-nb-card p-6 shadow-nb-lg max-w-md">
          <h2 className="text-lg font-black text-rose-600 mb-2">Error Loading WebFlow</h2>
          <p className="text-xs text-nb-muted mb-4">{error}</p>
          <a
            href="/webflow"
            className="inline-block rounded-xl border-2 border-nb-border bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-nb-sm"
          >
            Back to WebFlow Hub
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-nb-bg">
      {/* Top Toolbar */}
      <WebFlowToolbar
        workflowName={workflowName}
        onUpdateName={(name) => {
          setWorkflowName(name);
          triggerAutosave({ name });
        }}
        saveStatus={saveStatus}
        onAutoLayout={handleAutoLayout}
        onFitView={() => fitView({ padding: 0.2, duration: 300 })}
        onOpenAIExport={() => setIsAIExportOpen(true)}
        onOpenHumanDoc={() => setIsHumanDocOpen(true)}
        onValidate={() => setIsValidationOpen(true)}
        visibility={visibility}
        onChangeVisibility={(v) => {
          setVisibility(v);
          triggerAutosave({ visibility: v });
        }}
        validationWarningCount={warningCount}
        validationErrorCount={errorCount}
        isOwner={isOwner}
      />

      {/* Main Workspace Area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Library Dock */}
        <WebFlowSidebar
          isOpen={isLeftSidebarOpen}
          onToggle={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          onAddNode={handleAddNode}
        />

        {/* Center Canvas */}
        <div className="flex-1 relative h-full">
          <WebFlowCanvas
            nodes={nodes as unknown as WebFlowNode[]}
            edges={edges as unknown as WebFlowEdge[]}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeSelect={(node) => {
              setSelectedNode(node);
              if (node && !isRightInspectorOpen) setIsRightInspectorOpen(true);
            }}
            onAddNodeAtPosition={handleAddNodeAtPosition}
          />
        </div>

        {/* Right Inspector Drawer */}
        {isRightInspectorOpen && (
          <NodeInspector
            selectedNode={selectedNode}
            onUpdateNodeData={handleUpdateNodeData}
            onDeleteNode={handleDeleteNode}
            onClose={() => setIsRightInspectorOpen(false)}
            workflowName={workflowName}
            workflowDescription={workflowDescription}
            workflowCategory={workflowCategory}
            workflowVariables={variables}
            onUpdateWorkflowMeta={(updates) => {
              if (updates.name !== undefined) setWorkflowName(updates.name);
              if (updates.description !== undefined) setWorkflowDescription(updates.description);
              if (updates.category !== undefined) setWorkflowCategory(updates.category);
              triggerAutosave(updates);
            }}
            onUpdateVariables={(vars) => {
              setVariables(vars);
              triggerAutosave({ variables: vars });
            }}
          />
        )}
      </div>

      {/* Modals */}
      <AIExportModal
        isOpen={isAIExportOpen}
        onClose={() => setIsAIExportOpen(false)}
        workflow={{
          name: workflowName,
          description: workflowDescription,
          category: workflowCategory,
          version,
        }}
        nodes={nodes as unknown as WebFlowNode[]}
        edges={edges as unknown as WebFlowEdge[]}
        variables={variables}
      />

      <HumanDocModal
        isOpen={isHumanDocOpen}
        onClose={() => setIsHumanDocOpen(false)}
        workflow={{
          name: workflowName,
          description: workflowDescription,
          category: workflowCategory,
          version,
        }}
        nodes={nodes as unknown as WebFlowNode[]}
        edges={edges as unknown as WebFlowEdge[]}
        variables={variables}
      />

      <ValidationModal
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
        validation={validation}
        onFocusNode={(nodeId) => {
          const target = nodes.find((n) => n.id === nodeId);
          if (target) {
            setSelectedNode(target as unknown as WebFlowNode);
            setIsRightInspectorOpen(true);
          }
        }}
      />
    </div>
  );
}

export function WebFlowEditor({ id }: { id: string }) {
  return (
    <ReactFlowProvider>
      <WebFlowEditorContent id={id} />
    </ReactFlowProvider>
  );
}
