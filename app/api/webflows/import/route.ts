import type { NextRequest } from "next/server";
import { apiError, json, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import WebFlow from "@/models/WebFlow";
import type { WebFlowNode, WebFlowEdge, WebFlowVariable, WebFlowCategory } from "@/lib/webflow/types";

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireUser(request);
    if (response) return response;

    let payload: Record<string, unknown>;
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
    let rawNodes: Array<Record<string, unknown>> = [];
    let rawEdges: Array<Record<string, unknown>> = [];
    let rawVariables: Array<Record<string, unknown>> = [];

    // Format A: Standard WebFlow export or object
    if (Array.isArray(payload.nodes)) {
      name = (payload.name as string) || "Imported WebFlow";
      description = (payload.description as string) || "";
      category = (payload.category as WebFlowCategory) || "Productivity";
      rawNodes = payload.nodes as Array<Record<string, unknown>>;
      rawEdges = Array.isArray(payload.edges) ? (payload.edges as Array<Record<string, unknown>>) : [];
      rawVariables = Array.isArray(payload.variables) ? (payload.variables as Array<Record<string, unknown>>) : [];
    }
    // Format B: AI Agent Spec JSON format
    else if (payload.workflow && Array.isArray(payload.steps)) {
      const wf = payload.workflow as Record<string, unknown>;
      name = (wf.name as string) || "Imported WebFlow";
      description = (wf.description as string) || "";
      category = (wf.category as WebFlowCategory) || "Productivity";
      rawVariables = Array.isArray(payload.variables) ? (payload.variables as Array<Record<string, unknown>>) : [];

      // Convert steps into WebFlow nodes
      const steps = payload.steps as Array<Record<string, unknown>>;
      rawNodes = steps.map((step, index: number) => {
        const site = step.website as Record<string, unknown> | undefined;
        const isWebsite = Boolean(site && site.url);
        const kind = isWebsite ? "website" : step.type === "condition" ? "condition" : "action";
        return {
          id: (step.id as string) || `step_${index}`,
          type: kind,
          position: { x: 100 + index * 260, y: 150 + (index % 2) * 50 },
          data: {
            label: (step.label as string) || (isWebsite ? (site?.name as string) : `Step ${index + 1}`),
            kind,
            description: (step.purpose as string) || "",
            websiteUrl: site?.url,
            websiteTitle: site?.name,
            websiteDomain: site?.domain,
            action: (step.action as string) || "",
            inputs: step.inputs || [],
            outputs: step.outputs || [],
            instructions: Array.isArray(step.instructions) ? step.instructions.join("\n") : (step.instructions as string) || "",
            conditionExpression: step.condition_expression,
          },
        };
      });

      // Convert connections into WebFlow edges
      if (Array.isArray(payload.connections)) {
        const conns = payload.connections as Array<Record<string, unknown>>;
        rawEdges = conns.map((conn, idx: number) => ({
          id: `edge_${idx}`,
          source: conn.from_node,
          target: conn.to_node,
          label: (conn.label as string) || "",
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

      const d = (node.data || {}) as Record<string, unknown>;
      const pos = node.position as { x?: number; y?: number } | undefined;
      return {
        id: newId,
        type: (node.type as string) || (d.kind as string) || "website",
        position: {
          x: typeof pos?.x === "number" ? pos.x : 100 + index * 260,
          y: typeof pos?.y === "number" ? pos.y : 150,
        },
        data: {
          label: String(d.label || "Step " + (index + 1)).slice(0, 120),
          kind: (d.kind as WebFlowNode["data"]["kind"]) || "website",
          description: d.description ? String(d.description).slice(0, 1000) : undefined,
          websiteUrl: d.websiteUrl ? String(d.websiteUrl).slice(0, 2048) : undefined,
          websiteTitle: d.websiteTitle ? String(d.websiteTitle).slice(0, 250) : undefined,
          websiteDomain: d.websiteDomain ? String(d.websiteDomain).slice(0, 150) : undefined,
          action: d.action ? String(d.action).slice(0, 200) : undefined,
          actionDescription: d.actionDescription ? String(d.actionDescription).slice(0, 1000) : undefined,
          inputs: Array.isArray(d.inputs) ? (d.inputs as WebFlowNode["data"]["inputs"]) : [],
          outputs: Array.isArray(d.outputs) ? (d.outputs as WebFlowNode["data"]["outputs"]) : [],
          instructions: d.instructions ? String(d.instructions).slice(0, 5000) : undefined,
          conditionExpression: d.conditionExpression ? String(d.conditionExpression).slice(0, 1000) : undefined,
          noteContent: d.noteContent ? String(d.noteContent).slice(0, 5000) : undefined,
          category: d.category ? String(d.category).slice(0, 60) : undefined,
          tags: Array.isArray(d.tags) ? (d.tags as string[]).slice(0, 20) : [],
        },
      };
    });

    const sanitizedEdges: WebFlowEdge[] = rawEdges
      .map((edge, index) => {
        const source = idMap.get(String(edge.source)) || (edge.source as string);
        const target = idMap.get(String(edge.target)) || (edge.target as string);

        if (!source || !target) return null;

        return {
          id: `edge_${timestamp}_${index}`,
          source,
          target,
          sourceHandle: (edge.sourceHandle as string) || undefined,
          targetHandle: (edge.targetHandle as string) || undefined,
          label: edge.label ? String(edge.label).slice(0, 100) : undefined,
          type: (edge.type as string) || "labeled",
          data: (edge.data as Record<string, unknown>) || {},
        };
      })
      .filter(Boolean) as WebFlowEdge[];

    const allowedVarTypes = ["string", "number", "boolean", "file", "json"] as const;
    const sanitizedVariables: WebFlowVariable[] = rawVariables.map((v, index) => {
      const rawType = String(v.type || "");
      const isAllowed = allowedVarTypes.includes(rawType as (typeof allowedVarTypes)[number]);
      return {
        id: `var_${timestamp}_${index}`,
        name: String(v.name || `variable_${index}`).slice(0, 80),
        type: isAllowed ? (rawType as WebFlowVariable["type"]) : "string",
        defaultValue: v.defaultValue ? String(v.defaultValue).slice(0, 500) : "",
        description: v.description ? String(v.description).slice(0, 300) : "",
        required: Boolean(v.required),
      };
    });

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
