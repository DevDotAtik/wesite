"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
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
import {
  LayoutGrid,
  Maximize2,
  BookOpen,
  CheckCircle2,
  Zap,
  Split,
  StickyNote,
  Save,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  Files,
  Keyboard,
  Sliders,
} from "lucide-react";
import { AIIcon } from "./AIIcon";
import { WebFlowToolbar } from "./WebFlowToolbar";
import { WebFlowSidebar } from "./WebFlowSidebar";
import { WebFlowCanvas } from "./WebFlowCanvas";
import { NodeInspector } from "./NodeInspector";
import { AIExportModal } from "./AIExportModal";
import { AICopilotModal } from "./AICopilotModal";
import { WebFlowCommandPalette, type PaletteCommand } from "./WebFlowCommandPalette";
import { HumanDocModal } from "./HumanDocModal";
import { ValidationModal } from "./ValidationModal";
import { WebFlowContextMenu, type ContextMenuTarget } from "./WebFlowContextMenu";
import { WebFlowShortcutsModal } from "./WebFlowShortcutsModal";
import { WebFlowCustomizerModal } from "./WebFlowCustomizerModal";
import { autoLayoutNodes } from "./autoLayout";
import { validateWebFlow } from "@/lib/webflow/validator";
import { loadCanvasStyle, type CanvasCustomization } from "@/lib/webflow/canvasStyle";
import type {
  WebFlowNode,
  WebFlowEdge,
  WebFlowNodeData,
  WebFlowVariable,
  WebFlowCategory,
  WebFlowVisibility,
  WebFlowItem,
} from "@/lib/webflow/types";

interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
}

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

  // History & Undo / Redo Stack
  const [past, setPast] = useState<HistorySnapshot[]>([]);
  const [future, setFuture] = useState<HistorySnapshot[]>([]);
  const isUndoingOrRedoing = useRef(false);

  // Clipboard State
  const [copiedNode, setCopiedNode] = useState<WebFlowNode | null>(null);

  // Context Menu & Shortcuts Modal
  const [contextMenuTarget, setContextMenuTarget] = useState<ContextMenuTarget | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Modals & Customization
  const [isAIExportOpen, setIsAIExportOpen] = useState(false);
  const [isHumanDocOpen, setIsHumanDocOpen] = useState(false);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [styleSettings, setStyleSettings] = useState<CanvasCustomization>(() => loadCanvasStyle());

  // Mobile View Detection (Restricts to View-Only Diagram)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error loading WebFlow";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }

    loadWorkflow();
  }, [id, setNodes, setEdges]);

  // Snapshot Record Helper
  const takeSnapshot = useCallback(() => {
    if (isUndoingOrRedoing.current) return;
    setPast((prev) => {
      const next = [...prev, { nodes: [...nodes], edges: [...edges] }];
      if (next.length > 50) next.shift(); // Limit history stack to 50 items
      return next;
    });
    setFuture([]);
  }, [nodes, edges]);

  // Autosave Function
  const triggerAutosave = useCallback(
    (overrides?: {
      name?: string;
      description?: string;
      category?: WebFlowCategory;
      visibility?: WebFlowVisibility;
      nodes?: Node[];
      edges?: Edge[];
      variables?: WebFlowVariable[];
    }) => {
      if (!isOwner) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setSaveStatus("saving");

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const payload = {
            name: overrides?.name ?? workflowName,
            description: overrides?.description ?? workflowDescription,
            category: overrides?.category ?? workflowCategory,
            visibility: overrides?.visibility ?? visibility,
            nodes: overrides?.nodes ?? nodes,
            edges: overrides?.edges ?? edges,
            variables: overrides?.variables ?? variables,
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

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (past.length === 0) return;
    isUndoingOrRedoing.current = true;
    const previous = past[past.length - 1];
    setPast((prev) => prev.slice(0, prev.length - 1));
    setFuture((prev) => [{ nodes: [...nodes], edges: [...edges] }, ...prev]);
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setSelectedNode(null);
    triggerAutosave({ nodes: previous.nodes, edges: previous.edges });
    toast.info("Undo: reverted change", { duration: 1500 });
    setTimeout(() => {
      isUndoingOrRedoing.current = false;
    }, 50);
  }, [past, nodes, edges, setNodes, setEdges, triggerAutosave]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    isUndoingOrRedoing.current = true;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setPast((prev) => [...prev, { nodes: [...nodes], edges: [...edges] }]);
    setNodes(next.nodes);
    setEdges(next.edges);
    setSelectedNode(null);
    triggerAutosave({ nodes: next.nodes, edges: next.edges });
    toast.info("Redo: reapplied change", { duration: 1500 });
    setTimeout(() => {
      isUndoingOrRedoing.current = false;
    }, 50);
  }, [future, nodes, edges, setNodes, setEdges, triggerAutosave]);

  // Node Drag Stop (records position movement to undo stack)
  const handleNodeDragStop = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  // Connect Handler
  const onConnect = useCallback(
    (connection: Connection) => {
      takeSnapshot();
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
    [nodes, setEdges, takeSnapshot]
  );

  // Add Node from Palette
  const handleAddNode = useCallback(
    (nodeType: string, initialData: WebFlowNodeData) => {
      takeSnapshot();
      const newNodeId = `node_${Date.now()}`;
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
    [nodes.length, setNodes, takeSnapshot]
  );

  // Add Node via Drag & Drop or Context Menu Position
  const handleAddNodeAtPosition = useCallback(
    (nodeType: string, data: WebFlowNodeData, position: { x: number; y: number }) => {
      takeSnapshot();
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
    [setNodes, takeSnapshot]
  );

  // Update Node Data
  const handleUpdateNodeData = useCallback(
    (nodeId: string, partialData: Partial<WebFlowNodeData>) => {
      takeSnapshot();
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
    [selectedNode, setNodes, takeSnapshot]
  );

  // Delete Node
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      takeSnapshot();
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
      toast.success("Step removed from workflow");
    },
    [setNodes, setEdges, selectedNode, takeSnapshot]
  );

  // Delete Edge
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      takeSnapshot();
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      toast.success("Connection removed");
    },
    [setEdges, takeSnapshot]
  );

  // Copy Node to internal clipboard
  const handleCopyNode = useCallback((node: WebFlowNode) => {
    setCopiedNode(node);
    toast.success(`Copied "${node.data.label || "Step"}" to clipboard`);
  }, []);

  // Paste Node from internal clipboard
  const handlePasteNode = useCallback(
    (position?: { x: number; y: number }) => {
      if (!copiedNode) {
        toast.error("Clipboard is empty. Copy a node first with ⌘C.");
        return;
      }
      takeSnapshot();
      const newNodeId = `node_${Date.now()}`;
      const targetPos = position || {
        x: (copiedNode.position?.x || 200) + 40,
        y: (copiedNode.position?.y || 150) + 40,
      };

      const pastedNode: WebFlowNode = {
        ...copiedNode,
        id: newNodeId,
        position: targetPos,
        data: {
          ...copiedNode.data,
          label: `${copiedNode.data.label || "Step"} (Copy)`,
        },
      };

      setNodes((nds) => [...nds, pastedNode as unknown as Node]);
      setSelectedNode(pastedNode);
      toast.success(`Pasted "${pastedNode.data.label}"`);
    },
    [copiedNode, takeSnapshot, setNodes]
  );

  // Duplicate Node
  const handleDuplicateNode = useCallback(
    (node: WebFlowNode) => {
      takeSnapshot();
      const newNodeId = `node_${Date.now()}`;
      const duplicateNode: WebFlowNode = {
        ...node,
        id: newNodeId,
        position: {
          x: (node.position?.x || 200) + 40,
          y: (node.position?.y || 150) + 40,
        },
        data: {
          ...node.data,
          label: `${node.data.label || "Step"} (Copy)`,
        },
      };

      setNodes((nds) => [...nds, duplicateNode as unknown as Node]);
      setSelectedNode(duplicateNode);
      toast.success(`Duplicated "${node.data.label || "Step"}"`);
    },
    [takeSnapshot, setNodes]
  );

  // Handle Apply AI Graph from Copilot Modal
  const handleApplyAIGraph = useCallback(
    (result: { nodes: WebFlowNode[]; edges: WebFlowEdge[]; summaryOfChanges?: string }) => {
      takeSnapshot();
      setNodes(result.nodes as unknown as Node[]);
      setEdges(result.edges as unknown as Edge[]);
      triggerAutosave({
        nodes: result.nodes as unknown as Node[],
        edges: result.edges as unknown as Edge[],
      });
      setTimeout(() => {
        const layouted = autoLayoutNodes(result.nodes, result.edges);
        setNodes(layouted as unknown as Node[]);
        fitView({ padding: 0.2, duration: 400 });
      }, 50);
      if (result.summaryOfChanges) {
        toast.success(result.summaryOfChanges);
      } else {
        toast.success("Workflow graph updated");
      }
    },
    [setNodes, setEdges, triggerAutosave, fitView, takeSnapshot]
  );

  // Auto Layout
  const handleAutoLayout = useCallback(() => {
    takeSnapshot();
    const layouted = autoLayoutNodes(nodes as unknown as WebFlowNode[], edges as unknown as WebFlowEdge[]);
    setNodes(layouted as unknown as Node[]);
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50);
    toast.success("Canvas layout updated");
  }, [nodes, edges, setNodes, fitView, takeSnapshot]);

  // Command Palette Items
  const paletteCommands: PaletteCommand[] = [
    {
      id: "ai-assistant",
      title: "AI Workflow Copilot",
      subtitle: "Generate or modify nodes with prompt",
      category: "Actions",
      icon: <AIIcon className="h-4 w-4 text-amber-500" glow />,
      shortcut: "⌘J",
      onSelect: () => setIsAICopilotOpen(true),
    },
    {
      id: "undo",
      title: "Undo",
      subtitle: "Revert the last canvas operation",
      category: "Actions",
      icon: <Undo2 className="h-4 w-4 text-indigo-500" />,
      shortcut: "⌘Z",
      onSelect: handleUndo,
    },
    {
      id: "redo",
      title: "Redo",
      subtitle: "Reapply previously undone change",
      category: "Actions",
      icon: <Redo2 className="h-4 w-4 text-indigo-500" />,
      shortcut: "⌘⇧Z",
      onSelect: handleRedo,
    },
    {
      id: "copy-node",
      title: "Copy Selected Node",
      subtitle: "Copy current node to clipboard",
      category: "Actions",
      icon: <Copy className="h-4 w-4 text-blue-500" />,
      shortcut: "⌘C",
      onSelect: () => {
        if (selectedNode) handleCopyNode(selectedNode);
        else toast.error("Select a node first");
      },
    },
    {
      id: "paste-node",
      title: "Paste Node",
      subtitle: "Paste copied node onto canvas",
      category: "Actions",
      icon: <ClipboardPaste className="h-4 w-4 text-emerald-500" />,
      shortcut: "⌘V",
      onSelect: () => handlePasteNode(),
    },
    {
      id: "duplicate-node",
      title: "Duplicate Selected Node",
      subtitle: "Clone current node with offset",
      category: "Actions",
      icon: <Files className="h-4 w-4 text-amber-500" />,
      shortcut: "⌘D",
      onSelect: () => {
        if (selectedNode) handleDuplicateNode(selectedNode);
        else toast.error("Select a node first");
      },
    },
    {
      id: "auto-layout",
      title: "Auto-Layout Canvas",
      subtitle: "Reorganize nodes topologically",
      category: "View",
      icon: <LayoutGrid className="h-4 w-4 text-indigo-500" />,
      shortcut: "⌘L",
      onSelect: handleAutoLayout,
    },
    {
      id: "fit-view",
      title: "Fit Viewport",
      subtitle: "Center canvas to encompass all nodes",
      category: "View",
      icon: <Maximize2 className="h-4 w-4 text-slate-500" />,
      shortcut: "⌘1",
      onSelect: () => fitView({ padding: 0.2, duration: 300 }),
    },
    {
      id: "shortcuts",
      title: "Keyboard Shortcuts Guide",
      subtitle: "View comprehensive hotkeys cheat sheet",
      category: "View",
      icon: <Keyboard className="h-4 w-4 text-indigo-500" />,
      shortcut: "⌘/",
      onSelect: () => setIsShortcutsOpen(true),
    },
    {
      id: "customizer",
      title: "Customize Canvas & Styles",
      subtitle: "Adjust line width, colors, card theme, and grid",
      category: "View",
      icon: <Sliders className="h-4 w-4 text-amber-500" />,
      onSelect: () => setIsCustomizerOpen(true),
    },
    {
      id: "export-ai",
      title: "Export for AI Agent",
      subtitle: "Generate multi-format agent specifications",
      category: "Actions",
      icon: <AIIcon className="h-4 w-4 text-indigo-600" />,
      onSelect: () => setIsAIExportOpen(true),
    },
    {
      id: "doc-guide",
      title: "Interactive Guide",
      subtitle: "Generate step-by-step documentation",
      category: "Actions",
      icon: <BookOpen className="h-4 w-4 text-amber-600" />,
      onSelect: () => setIsHumanDocOpen(true),
    },
    {
      id: "validate",
      title: "Validate Workflow",
      subtitle: "Check connectivity and graph integrity",
      category: "Actions",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      onSelect: () => setIsValidationOpen(true),
    },
    {
      id: "add-action",
      title: "Add Action Step",
      subtitle: "Insert execution node",
      category: "Insert Nodes",
      icon: <Zap className="h-4 w-4 text-indigo-500" />,
      onSelect: () =>
        handleAddNode("actionNode", {
          label: "Execute Step",
          kind: "action",
          actionDescription: "Perform action",
          status: "configured",
        }),
    },
    {
      id: "add-condition",
      title: "Add Condition Branch",
      subtitle: "Insert True/False decision split",
      category: "Insert Nodes",
      icon: <Split className="h-4 w-4 text-amber-500" />,
      onSelect: () =>
        handleAddNode("conditionNode", {
          label: "Check Condition",
          kind: "condition",
          conditionExpression: "status === 200",
          status: "configured",
        }),
    },
    {
      id: "add-note",
      title: "Add Note",
      subtitle: "Insert canvas documentation block",
      category: "Insert Nodes",
      icon: <StickyNote className="h-4 w-4 text-yellow-500" />,
      onSelect: () =>
        handleAddNode("noteNode", {
          label: "Workflow Note",
          kind: "note",
          noteContent: "Add instructions or notes here...",
          status: "configured",
        }),
    },
    {
      id: "save-flow",
      title: "Save Workflow",
      subtitle: "Manually persist current state",
      category: "Actions",
      icon: <Save className="h-4 w-4 text-emerald-600" />,
      shortcut: "⌘S",
      onSelect: () => {
        triggerAutosave();
        toast.success("Workflow saved!");
      },
    },
  ];

  // Validation
  const validation = validateWebFlow(nodes as unknown as WebFlowNode[], edges as unknown as WebFlowEdge[]);
  const warningCount = validation.issues.filter((i) => i.level === "warning").length;
  const errorCount = validation.issues.filter((i) => i.level === "error").length;

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMobile) return;
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute("contenteditable") === "true";

      // Global shortcut: Save (⌘S)
      if ((e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        triggerAutosave();
        toast.success("Workflow saved!");
        return;
      }

      // Global shortcut: Palette (⌘K)
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Global shortcut: AI Copilot (⌘J)
      if ((e.metaKey || e.ctrlKey) && (e.key === "j" || e.key === "J")) {
        e.preventDefault();
        setIsAICopilotOpen((prev) => !prev);
        return;
      }

      // Global shortcut: Shortcuts Cheat Sheet (⌘/ or ?)
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // If typing inside an input or textarea, let native text controls handle keystrokes
      if (isInput) return;

      // Undo: ⌘Z (without shift)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: ⌘⇧Z or ⌘Y
      if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "z" || e.key === "Z")) ||
        ((e.metaKey || e.ctrlKey) && (e.key === "y" || e.key === "Y"))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Copy: ⌘C
      if ((e.metaKey || e.ctrlKey) && (e.key === "c" || e.key === "C")) {
        if (selectedNode) {
          e.preventDefault();
          handleCopyNode(selectedNode);
        }
        return;
      }

      // Paste: ⌘V
      if ((e.metaKey || e.ctrlKey) && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        handlePasteNode();
        return;
      }

      // Duplicate: ⌘D
      if ((e.metaKey || e.ctrlKey) && (e.key === "d" || e.key === "D")) {
        if (selectedNode) {
          e.preventDefault();
          handleDuplicateNode(selectedNode);
        }
        return;
      }

      // Auto-Layout: ⌘L
      if ((e.metaKey || e.ctrlKey) && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        handleAutoLayout();
        return;
      }

      // Fit View: ⌘1
      if ((e.metaKey || e.ctrlKey) && e.key === "1") {
        e.preventDefault();
        fitView({ padding: 0.2, duration: 300 });
        return;
      }

      // Delete Selected Node: Delete or Backspace
      if (e.key === "Backspace" || e.key === "Delete") {
        if (selectedNode) {
          e.preventDefault();
          handleDeleteNode(selectedNode.id);
        }
        return;
      }

      // Escape: Deselect / Close context menu & modals
      if (e.key === "Escape") {
        setContextMenuTarget(null);
        setSelectedNode(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    triggerAutosave,
    handleUndo,
    handleRedo,
    handleCopyNode,
    handlePasteNode,
    handleDuplicateNode,
    handleAutoLayout,
    handleDeleteNode,
    selectedNode,
    fitView,
  ]);

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
          <Link
            href="/webflow"
            className="inline-block rounded-xl border-2 border-nb-border bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-nb-sm"
          >
            Back to WebFlow Hub
          </Link>
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
        onOpenAICopilot={() => setIsAICopilotOpen(true)}
        onValidate={() => setIsValidationOpen(true)}
        visibility={visibility}
        onChangeVisibility={(v) => {
          setVisibility(v);
          triggerAutosave({ visibility: v });
        }}
        validationWarningCount={warningCount}
        validationErrorCount={errorCount}
        isOwner={isOwner}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        isReadOnly={isMobile}
      />

      {/* Main Workspace Area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Library Dock (Desktop Only) */}
        {!isMobile && (
          <div className={`z-30 h-full ${isLeftSidebarOpen ? "absolute inset-y-0 left-0 md:static md:inset-auto" : ""}`}>
            <WebFlowSidebar
              isOpen={isLeftSidebarOpen}
              onToggle={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
              onAddNode={handleAddNode}
            />
          </div>
        )}

        {/* Center Canvas */}
        <div className="flex-1 relative h-full">
          <WebFlowCanvas
            nodes={nodes as unknown as WebFlowNode[]}
            edges={edges as unknown as WebFlowEdge[]}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeSelect={(node) => {
              if (isMobile) return;
              setSelectedNode(node);
              if (node && !isRightInspectorOpen) setIsRightInspectorOpen(true);
            }}
            onAddNodeAtPosition={handleAddNodeAtPosition}
            onPaneContextMenu={(e, flowPos) => {
              if (isMobile) return;
              setContextMenuTarget({
                type: "canvas",
                x: e.clientX,
                y: e.clientY,
                flowPosition: flowPos,
              });
            }}
            onNodeContextMenu={(e, node) => {
              if (isMobile) return;
              setSelectedNode(node);
              setContextMenuTarget({
                type: "node",
                x: e.clientX,
                y: e.clientY,
                node,
              });
            }}
            onEdgeContextMenu={(e, edge) => {
              if (isMobile) return;
              setContextMenuTarget({
                type: "edge",
                x: e.clientX,
                y: e.clientY,
                edge,
              });
            }}
            onNodeDragStop={handleNodeDragStop}
            styleSettings={styleSettings}
            isReadOnly={isMobile}
          />

          {/* Floating Bottom AI Pill (Desktop Only) */}
          {!isMobile && !isAICopilotOpen && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => setIsAICopilotOpen(true)}
                className="flex items-center gap-2.5 rounded-2xl border-3 border-nb-border bg-nb-card hover:bg-nb-surface text-nb-fg px-4 py-2.5 shadow-nb-lg hover:translate-x-0.5 hover:-translate-y-0.5 active:translate-y-0 transition-all text-xs font-black group"
                title="Ask AI Copilot to generate or modify workflow (⌘J)"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400 text-black border-2 border-nb-border shadow-nb-xs shrink-0">
                  <AIIcon className="h-4 w-4" glow />
                </div>
                <span className="text-xs font-black tracking-tight">Ask AI Copilot...</span>
                <kbd className="hidden sm:inline-block rounded border border-nb-border bg-nb-surface px-1.5 py-0.5 font-mono text-[10px] text-nb-muted">
                  ⌘J
                </kbd>
              </button>
            </div>
          )}

          {/* Right-Click Context Menu Overlay (Desktop Only) */}
          {!isMobile && (
            <WebFlowContextMenu
              target={contextMenuTarget}
              onClose={() => setContextMenuTarget(null)}
              onAddNodeAtPosition={handleAddNodeAtPosition}
              onCopyNode={handleCopyNode}
              onPasteNode={handlePasteNode}
              onDuplicateNode={handleDuplicateNode}
              onDeleteNode={handleDeleteNode}
              onDeleteEdge={handleDeleteEdge}
              onInspectNode={(node) => {
                setSelectedNode(node);
                setIsRightInspectorOpen(true);
              }}
              onAutoLayout={handleAutoLayout}
              onFitView={() => fitView({ padding: 0.2, duration: 300 })}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={past.length > 0}
              canRedo={future.length > 0}
              hasCopiedNode={Boolean(copiedNode)}
            />
          )}
        </div>

        {/* Right Inspector Drawer (Desktop Only) */}
        {!isMobile && isRightInspectorOpen && (
          <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-80 md:w-96 md:static md:inset-auto h-full flex">
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
          </div>
        )}
      </div>

      {/* Modals (Desktop Only) */}
      {!isMobile && (
        <>
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

          <AICopilotModal
            isOpen={isAICopilotOpen}
            onClose={() => setIsAICopilotOpen(false)}
            mode="editor"
            currentNodes={nodes as unknown as WebFlowNode[]}
            currentEdges={edges as unknown as WebFlowEdge[]}
            onApplyGraph={handleApplyAIGraph}
          />

          <WebFlowShortcutsModal
            isOpen={isShortcutsOpen}
            onClose={() => setIsShortcutsOpen(false)}
          />

          <WebFlowCommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            commands={paletteCommands}
          />

          <WebFlowCustomizerModal
            isOpen={isCustomizerOpen}
            onClose={() => setIsCustomizerOpen(false)}
            styleSettings={styleSettings}
            onUpdateStyle={setStyleSettings}
          />
        </>
      )}
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
