import type { WebFlowEdge, WebFlowNode } from "./types";

export type ValidationIssue = {
  id: string;
  level: "error" | "warning" | "info";
  message: string;
  nodeId?: string;
  edgeId?: string;
};

export type WorkflowValidationResult = {
  isValid: boolean;
  canExportAI: boolean;
  issues: ValidationIssue[];
  metrics: {
    nodeCount: number;
    edgeCount: number;
    websiteNodeCount: number;
    actionNodeCount: number;
    conditionCount: number;
    inputPortCount: number;
    outputPortCount: number;
    hasStart: boolean;
    hasEnd: boolean;
    hasCycles: boolean;
  };
};

export function validateWebFlow(
  nodes: WebFlowNode[],
  edges: WebFlowEdge[],
): WorkflowValidationResult {
  const issues: ValidationIssue[] = [];

  const nodeMap = new Map<string, WebFlowNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const incomingEdges = new Map<string, WebFlowEdge[]>();
  const outgoingEdges = new Map<string, WebFlowEdge[]>();

  nodes.forEach((n) => {
    incomingEdges.set(n.id, []);
    outgoingEdges.set(n.id, []);
  });

  edges.forEach((e) => {
    if (incomingEdges.has(e.target)) {
      incomingEdges.get(e.target)!.push(e);
    }
    if (outgoingEdges.has(e.source)) {
      outgoingEdges.get(e.source)!.push(e);
    }
  });

  let hasStart = false;
  let hasEnd = false;
  let websiteNodeCount = 0;
  let actionNodeCount = 0;
  let conditionCount = 0;
  let inputPortCount = 0;
  let outputPortCount = 0;

  nodes.forEach((node) => {
    const kind = node.data.kind;

    if (kind === "start") hasStart = true;
    if (kind === "end") hasEnd = true;
    if (kind === "website") websiteNodeCount++;
    if (kind === "action") actionNodeCount++;
    if (kind === "condition") conditionCount++;

    inputPortCount += node.data.inputs?.length || 0;
    outputPortCount += node.data.outputs?.length || 0;

    // 1. Check Website node integrity
    if (kind === "website") {
      if (!node.data.websiteUrl && !node.data.websiteTitle) {
        issues.push({
          id: `missing-website-${node.id}`,
          level: "error",
          message: `Node "${node.data.label}" does not have an associated website or URL.`,
          nodeId: node.id,
        });
      }
      if (!node.data.action || node.data.action.trim() === "") {
        issues.push({
          id: `missing-action-${node.id}`,
          level: "warning",
          message: `Node "${node.data.label}" has no specific action described.`,
          nodeId: node.id,
        });
      }
    }

    // 2. Check Action node integrity
    if (kind === "action") {
      if (!node.data.action && !node.data.description) {
        issues.push({
          id: `missing-action-desc-${node.id}`,
          level: "warning",
          message: `Action node "${node.data.label}" has no action details.`,
          nodeId: node.id,
        });
      }
    }

    // 3. Check Condition branches
    if (kind === "condition") {
      const out = outgoingEdges.get(node.id) || [];
      if (out.length < 2) {
        issues.push({
          id: `condition-branches-${node.id}`,
          level: "warning",
          message: `Condition node "${node.data.label}" should typically branch into at least two paths.`,
          nodeId: node.id,
        });
      }
      if (!node.data.conditionExpression?.trim()) {
        issues.push({
          id: `missing-condition-expr-${node.id}`,
          level: "warning",
          message: `Condition node "${node.data.label}" has no condition expression defined.`,
          nodeId: node.id,
        });
      }
    }

    // 4. Check for Disconnected nodes (exclude pure canvas Notes)
    if (kind !== "note") {
      const inCount = incomingEdges.get(node.id)?.length || 0;
      const outCount = outgoingEdges.get(node.id)?.length || 0;

      if (inCount === 0 && outCount === 0 && nodes.length > 1) {
        issues.push({
          id: `disconnected-${node.id}`,
          level: "warning",
          message: `Node "${node.data.label}" is completely disconnected from the workflow.`,
          nodeId: node.id,
        });
      }
    }

    // 5. Privacy & Secrets Scan
    const fullText = [
      node.data.label,
      node.data.description,
      node.data.action,
      node.data.actionDescription,
      node.data.instructions,
      node.data.noteContent,
    ]
      .filter(Boolean)
      .join(" ");

    if (
      /(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|bearer\s+[a-zA-Z0-9_\-\.]{20,}|password\s*[:=]\s*[^\s]+)/i.test(
        fullText,
      )
    ) {
      issues.push({
        id: `privacy-leak-${node.id}`,
        level: "warning",
        message: `Node "${node.data.label}" may contain API keys, passwords, or personal credentials. Remove sensitive tokens before sharing.`,
        nodeId: node.id,
      });
    }
  });

  // 6. Check for cycles / circular paths
  let hasCycles = false;
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfsDetectCycle(nodeId: string): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);

    const neighbors = (outgoingEdges.get(nodeId) || []).map((e) => e.target);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfsDetectCycle(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfsDetectCycle(node.id)) {
        hasCycles = true;
        break;
      }
    }
  }

  if (hasCycles) {
    issues.push({
      id: "circular-cycle-detected",
      level: "warning",
      message: "Circular dependency detected. While valid for iterative loops, ensure loop termination is defined.",
    });
  }

  if (nodes.length > 0 && !hasStart) {
    issues.push({
      id: "missing-start-node",
      level: "info",
      message: "No dedicated Start node defined. The workflow will infer entry points automatically.",
    });
  }

  const errors = issues.filter((i) => i.level === "error");
  const isValid = errors.length === 0;
  const canExportAI = nodes.length > 0 && errors.length === 0;

  return {
    isValid,
    canExportAI,
    issues,
    metrics: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      websiteNodeCount,
      actionNodeCount,
      conditionCount,
      inputPortCount,
      outputPortCount,
      hasStart,
      hasEnd,
      hasCycles,
    },
  };
}
