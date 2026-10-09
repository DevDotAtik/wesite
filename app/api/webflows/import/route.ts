import type { NextRequest } from "next/server";
import { apiError, json, parseBody, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import WebFlow from "@/models/WebFlow";
import type { WebFlowNode, WebFlowEdge, WebFlowVariable, WebFlowCategory } from "@/lib/webflow/types";

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireUser(request);
    if (response) return response;

    let payload: any;
    try {
      payload = await request.json();
    } catch {
      return apiError("Invalid JSON input", 400);
    }

    if (!payload || typeof payload !== "object") {
      return apiError("Missing workflow JSON data", 400);
    }

    let name = "Imported WebFlow";
    let description = "";
    let category: WebFlowCategory = "Productivity";
    let rawNodes: any[] = [];
    let rawEdges: any[] = [];
    let rawVariables: any[] = [];

    // Format A: Standard WebFlow export or object
    if (Array.isArray(payload.nodes)) {
      name = payload.name || "Imported WebFlow";
      description = payload.description || "";
      category = payload.category || "Productivity";
      rawNodes = payload.nodes;
      rawEdges = Array.isArray(payload.edges) ? payload.edges : [];
      rawVariables = Array.isArray(payload.variables) ? payload.variables : [];
    }
    // Format B: AI Agent Spec JSON format
    else if (payload.workflow && Array.isArray(payload.steps)) {
      name = payload.workflow.name || "Imported WebFlow";
      description = payload.workflow.description || "";
      category = (payload.workflow.category as WebFlowCategory) || "Productivity";
      rawVariables = Array.isArray(payload.variables) ? payload.variables : [];

      // Convert steps into WebFlow nodes
      const steps = payload.steps;
      rawNodes = steps.map((step: any, index: number) => {
        const isWebsite = Boolean(step.website && step.website.url);
        const kind = isWebsite ? "website" : step.type === "condition" ? "condition" : "action";
        return {
          id: step.id || `step_${index}`,
          type: kind,
          position: { x: 100 + index * 260, y: 150 + (index % 2) * 50 },
          data: {
            label: step.label || (isWebsite ? step.website.name : `Step ${index + 1}`),
            kind,
            description: step.purpose || "",
            websiteUrl: step.website?.url,
            websiteTitle: step.website?.name,
            websiteDomain: step.website?.domain,
            action: step.action || "",
            inputs: step.inputs || [],
            outputs: step.outputs || [],
            instructions: Array.isArray(step.instructions) ? step.instructions.join("\n") : step.instructions || "",
            conditionExpression: step.condition_expression,
          },
        };
      });

      // Convert connections into WebFlow edges
      if (Array.isArray(payload.connections)) {
        rawEdges = payload.connections.map((conn: any, idx: number) => ({
          id: `edge_${idx}`,
          source: conn.from_node,
          target: conn.to_node,
          label: conn.label || "",
          data: { conditionBranch: conn.condition_branch },
        }));
      }
    } else {
      return apiError("Unrecognized WebFlow format. Expected nodes/edges or workflow/steps structure.", 400);
    }

    // Secure remapping: never trust imported IDs, generate clean internal IDs
    const idMap = new Map<string, string>();
    const timestamp = Date.now();

    const sanitizedNodes: WebFlowNode[] = rawNodes.map((node, index) => {
      const oldId = String(node.id || `node_${index}`);
      const newId = `node_${timestamp}_${index}`;
      idMap.set(oldId, newId);

      const d = node.data || {};
      return {
        id: newId,
        type: node.type || d.kind || "website",
        position: {
          x: typeof node.position?.x === "number" ? node.position.x : 100 + index * 260,
          y: typeof node.position?.y === "number" ? node.position.y : 150,
        },
        data: {
          label: String(d.label || "Step " + (index + 1)).slice(0, 120),
          kind: d.kind || "website",
          description: d.description ? String(d.description).slice(0, 1000) : undefined,
          websiteUrl: d.websiteUrl ? String(d.websiteUrl).slice(0, 2048) : undefined,
          websiteTitle: d.websiteTitle ? String(d.websiteTitle).slice(0, 250) : undefined,
          websiteDomain: d.websiteDomain ? String(d.websiteDomain).slice(0, 150) : undefined,
          action: d.action ? String(d.action).slice(0, 200) : undefined,
          actionDescription: d.actionDescription ? String(d.actionDescription).slice(0, 1000) : undefined,
          inputs: Array.isArray(d.inputs) ? d.inputs : [],
          outputs: Array.isArray(d.outputs) ? d.outputs : [],
          instructions: d.instructions ? String(d.instructions).slice(0, 5000) : undefined,
          conditionExpression: d.conditionExpression ? String(d.conditionExpression).slice(0, 1000) : undefined,
          noteContent: d.noteContent ? String(d.noteContent).slice(0, 5000) : undefined,
          category: d.category ? String(d.category).slice(0, 60) : undefined,
          tags: Array.isArray(d.tags) ? d.tags.slice(0, 20) : [],
        },
      };
    });

    const sanitizedEdges: WebFlowEdge[] = rawEdges
      .map((edge, index) => {
        const source = idMap.get(String(edge.source)) || edge.source;
        const target = idMap.get(String(edge.target)) || edge.target;

        if (!source || !target) return null;

        return {
          id: `edge_${timestamp}_${index}`,
          source,
          target,
          sourceHandle: edge.sourceHandle || undefined,
          targetHandle: edge.targetHandle || undefined,
          label: edge.label ? String(edge.label).slice(0, 100) : undefined,
          type: edge.type || "labeled",
          data: edge.data || {},
        };
      })
      .filter(Boolean) as WebFlowEdge[];

    const sanitizedVariables: WebFlowVariable[] = rawVariables.map((v, index) => ({
      id: `var_${timestamp}_${index}`,
      name: String(v.name || `variable_${index}`).slice(0, 80),
      type: ["string", "number", "boolean", "file", "json"].includes(v.type) ? v.type : "string",
      defaultValue: v.defaultValue ? String(v.defaultValue).slice(0, 500) : "",
      description: v.description ? String(v.description).slice(0, 300) : "",
      required: Boolean(v.required),
    }));

    await connectToDatabase();

    const createdFlow = await WebFlow.create({
      userId: user._id,
      name: `${name} (Imported)`.slice(0, 140),
      description: description.slice(0, 1500),
      category,
      visibility: "private",
      nodes: sanitizedNodes,
      edges: sanitizedEdges,
      variables: sanitizedVariables,
      version: 1,
    });

    return json(
      {
        webflow: serializeDocument(createdFlow),
        message: "WebFlow imported successfully",
      },
      201
    );
  } catch (err) {
    console.error("POST /api/webflows/import error:", err);
    return apiError((err as Error).message || "Failed to import WebFlow", 500);
  }
}
