import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { apiError, json, requireUser, serializeDocument } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import WebFlow from "@/models/WebFlow";
import type { WebFlowNode, WebFlowEdge, WebFlowVariable, WebFlowCategory, WebFlowNodeKind, WebFlowPort } from "@/lib/webflow/types";

const VALID_CATEGORIES: WebFlowCategory[] = [
  "Productivity",
  "Development",
  "AI",
  "Marketing",
  "Research",
  "Education",
  "Job Search",
  "Design",
  "Business",
  "Social Media",
  "Automation",
  "Personal",
  "Other",
];

function normalizeCategory(cat: unknown): WebFlowCategory {
  if (typeof cat !== "string") return "Productivity";
  const trimmed = cat.trim().toLowerCase();
  const match = VALID_CATEGORIES.find((c) => c.toLowerCase() === trimmed);
  return match || "Other";
}

function normalizeKind(kind: unknown, type: unknown, websiteUrl?: unknown): WebFlowNodeKind {
  const k = String(kind || "").toLowerCase();
  const t = String(type || "").toLowerCase();

  if (Boolean(websiteUrl) || k.includes("website") || t.includes("website")) return "website";
  if (k.includes("ai") || t.includes("ai")) return "ai";
  if (k.includes("condition") || t.includes("condition")) return "condition";
  if (k.includes("start") || t.includes("start")) return "start";
  if (k.includes("end") || t.includes("end")) return "end";
  if (k.includes("delay") || t.includes("delay")) return "delay";
  if (k.includes("transform") || t.includes("transform")) return "transform";
  if (k.includes("input") || t.includes("input")) return "input";
  if (k.includes("output") || t.includes("output")) return "output";
  if (k.includes("note") || t.includes("note")) return "note";

  return "action";
}

function kindToNodeType(kind: WebFlowNodeKind): string {
  switch (kind) {
    case "website":
      return "websiteNode";
    case "ai":
      return "aiNode";
    case "condition":
      return "conditionNode";
    case "start":
      return "startNode";
    case "end":
      return "endNode";
    case "delay":
      return "delayNode";
    case "transform":
      return "transformNode";
    case "input":
      return "inputNode";
    case "output":
      return "outputNode";
    case "note":
      return "noteNode";
    case "action":
    default:
      return "actionNode";
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireUser(request);
    if (response) return response;

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return apiError("Invalid JSON input: Could not parse file", 400);
    }

    if (!payload || typeof payload !== "object") {
      return apiError("Missing workflow JSON data", 400);
    }

    // Support payload root unwrap: payload, payload.webflow, payload.workflow, payload.data
    const dict = payload as Record<string, unknown>;
    const root: Record<string, unknown> =
      (dict.webflow && typeof dict.webflow === "object" ? (dict.webflow as Record<string, unknown>) : null) ||
      (dict.workflow && typeof dict.workflow === "object" && Array.isArray((dict.workflow as Record<string, unknown>).nodes)
        ? (dict.workflow as Record<string, unknown>)
        : null) ||
      (dict.data && typeof dict.data === "object" ? (dict.data as Record<string, unknown>) : null) ||
      dict;

    let name = "Imported WebFlow";
    let description = "";
    let category: WebFlowCategory = "Productivity";

    // Extract name
    if (typeof root.name === "string" && root.name.trim()) {
      name = root.name.trim();
    } else if (dict.workflow && typeof dict.workflow === "object" && typeof (dict.workflow as Record<string, unknown>).name === "string") {
      name = ((dict.workflow as Record<string, unknown>).name as string).trim();
    } else if (typeof root.title === "string" && root.title.trim()) {
      name = root.title.trim();
    }

    // Extract description
    if (typeof root.description === "string") {
      description = root.description;
    } else if (dict.workflow && typeof dict.workflow === "object" && typeof (dict.workflow as Record<string, unknown>).description === "string") {
      description = (dict.workflow as Record<string, unknown>).description as string;
    } else if (dict.workflow && typeof dict.workflow === "object" && typeof (dict.workflow as Record<string, unknown>).purpose === "string") {
      description = (dict.workflow as Record<string, unknown>).purpose as string;
    }

    // Extract category
    if (root.category) {
      category = normalizeCategory(root.category);
    } else if (dict.workflow && typeof dict.workflow === "object" && (dict.workflow as Record<string, unknown>).category) {
      category = normalizeCategory((dict.workflow as Record<string, unknown>).category);
    }

    let rawNodes: Array<Record<string, unknown>> = [];
    let rawEdges: Array<Record<string, unknown>> = [];
    let rawVariables: Array<Record<string, unknown>> = [];

    // Extract variables
    if (Array.isArray(root.variables)) {
      rawVariables = root.variables as Array<Record<string, unknown>>;
    } else if (Array.isArray(dict.variables)) {
      rawVariables = dict.variables as Array<Record<string, unknown>>;
    }

    // FORMAT A: Graph with nodes array
    if (Array.isArray(root.nodes)) {
      rawNodes = root.nodes as Array<Record<string, unknown>>;
      if (Array.isArray(root.edges)) {
        rawEdges = root.edges as Array<Record<string, unknown>>;
      } else if (Array.isArray(dict.edges)) {
        rawEdges = dict.edges as Array<Record<string, unknown>>;
      }
    }
    // FORMAT B: Direct array of nodes
    else if (Array.isArray(payload)) {
      rawNodes = payload as Array<Record<string, unknown>>;
    }
    // FORMAT C: AI Agent Spec format (steps array)
    else {
      const steps = (Array.isArray(dict.steps) ? dict.steps : Array.isArray(root.steps) ? root.steps : null) as Array<Record<string, unknown>> | null;

      if (steps && steps.length > 0) {
        rawNodes = steps.map((step, index) => {
          const site = step.website as Record<string, unknown> | undefined;
          const kind = normalizeKind(step.kind, step.type, site?.url);
          const type = kindToNodeType(kind);

          let pos: { x: number; y: number } = {
            x: 80 + (index % 4) * 280,
            y: 120 + Math.floor(index / 4) * 220,
          };
          if (step.position && typeof step.position === "object") {
            const p = step.position as { x?: number; y?: number };
            if (typeof p.x === "number" && !isNaN(p.x) && typeof p.y === "number" && !isNaN(p.y)) {
              pos = { x: p.x, y: p.y };
            }
          }

          const instructions = Array.isArray(step.instructions)
            ? step.instructions.map(String).join("\n")
            : typeof step.instructions === "string"
            ? step.instructions
            : "";

          return {
            id: String(step.id || `step_${index + 1}`),
            type,
            position: pos,
            data: {
              label: String(step.label || site?.name || `Step ${index + 1}`).slice(0, 120),
              kind,
              description: String(step.purpose || step.description || ""),
              websiteUrl: site?.url ? String(site.url) : undefined,
              websiteTitle: site?.name ? String(site.name) : undefined,
              websiteDomain: site?.domain ? String(site.domain) : undefined,
              action: typeof step.action === "string" ? step.action : "",
              actionDescription: typeof step.purpose === "string" ? step.purpose : "",
              inputs: Array.isArray(step.inputs) ? step.inputs : [],
              outputs: Array.isArray(step.outputs) ? step.outputs : [],
              instructions,
              conditionExpression: typeof step.condition_expression === "string" ? step.condition_expression : undefined,
              delaySeconds: typeof step.delay_seconds === "number" ? step.delay_seconds : undefined,
              noteContent: typeof step.note_content === "string" ? step.note_content : undefined,
              customBg: typeof step.customBg === "string" ? step.customBg : undefined,
              customBorderColor: typeof step.customBorderColor === "string" ? step.customBorderColor : undefined,
            },
          };
        });

        // Extract edges from connections
        if (Array.isArray(dict.connections)) {
          rawEdges = (dict.connections as Array<Record<string, unknown>>).map((conn, idx) => ({
            id: `edge_${idx}`,
            source: conn.from_node || conn.source,
            target: conn.to_node || conn.target,
            label: conn.label || "",
            data: { conditionBranch: conn.condition_branch || "default" },
          }));
        } else if (Array.isArray(root.connections)) {
          rawEdges = (root.connections as Array<Record<string, unknown>>).map((conn, idx) => ({
            id: `edge_${idx}`,
            source: conn.from_node || conn.source,
            target: conn.to_node || conn.target,
            label: conn.label || "",
            data: { conditionBranch: conn.condition_branch || "default" },
          }));
        }

        // If no explicit connections array, extract from step.next_steps
        if (rawEdges.length === 0) {
          steps.forEach((step, sIdx) => {
            const stepId = String(step.id || `step_${sIdx + 1}`);
            if (Array.isArray(step.next_steps)) {
              step.next_steps.forEach((next: Record<string, unknown>, nIdx: number) => {
                const target = next.target_id || next.target || next.to_node;
                if (target) {
                  rawEdges.push({
                    id: `edge_${stepId}_${nIdx}`,
                    source: stepId,
                    target: String(target),
                    label: (next.label as string) || "",
                    data: { conditionBranch: (next.condition_branch as string) || "default" },
                  });
                }
              });
            }
          });
        }

        // Extract condition branching if present
        const conditions = (Array.isArray(dict.conditions) ? dict.conditions : Array.isArray(root.conditions) ? root.conditions : []) as Array<Record<string, unknown>>;
        conditions.forEach((c, cIdx) => {
          if (c.node_id && c.true_target) {
            rawEdges.push({
              id: `edge_cond_true_${cIdx}`,
              source: String(c.node_id),
              target: String(c.true_target),
              label: "TRUE",
              data: { conditionBranch: "true" },
            });
          }
          if (c.node_id && c.false_target) {
            rawEdges.push({
              id: `edge_cond_false_${cIdx}`,
              source: String(c.node_id),
              target: String(c.false_target),
              label: "FALSE",
              data: { conditionBranch: "false" },
            });
          }
        });
      }
    }

    if (rawNodes.length === 0) {
      return apiError(
        "No workflow steps or nodes found in JSON file. Expected standard WebFlow JSON or AI Agent Spec format.",
        400
      );
    }

    const timestamp = Date.now();
    const idMap = new Map<string, string>();

    // 1. Sanitize Nodes
    const sanitizedNodes: WebFlowNode[] = rawNodes.map((node, index) => {
      const originalId = node.id ? String(node.id) : `node_${index + 1}`;
      // Clean string ID ensuring uniqueness
      const cleanId = originalId.replace(/[^a-zA-Z0-9_-]/g, "_") || `node_${timestamp}_${index}`;
      idMap.set(originalId, cleanId);

      const d = (node.data || {}) as Record<string, unknown>;
      const kind = normalizeKind(d.kind, node.type, d.websiteUrl);
      const type = kindToNodeType(kind);

      let posX = 80 + (index % 4) * 280;
      let posY = 120 + Math.floor(index / 4) * 220;

      if (node.position && typeof node.position === "object") {
        const p = node.position as { x?: number; y?: number };
        if (typeof p.x === "number" && !isNaN(p.x)) posX = p.x;
        if (typeof p.y === "number" && !isNaN(p.y)) posY = p.y;
      }

      // Sanitize websiteId: must be a valid 24-char ObjectId hex string or null
      let validWebsiteId: string | null = null;
      if (typeof d.websiteId === "string" && mongoose.Types.ObjectId.isValid(d.websiteId)) {
        validWebsiteId = d.websiteId;
      }

      // Sanitize input ports - CRITICAL: each port must have required id and name
      const validPortTypes = ["string", "number", "boolean", "file", "json", "any"] as const;
      type PortType = (typeof validPortTypes)[number];
      const normalizePortType = (t: unknown): PortType => {
        const str = String(t || "string").toLowerCase();
        return validPortTypes.includes(str as PortType) ? (str as PortType) : "string";
      };

      const rawInputs = Array.isArray(d.inputs) ? (d.inputs as Array<Record<string, unknown>>) : [];
      const sanitizedInputs: WebFlowPort[] = rawInputs.map((port, pIdx) => ({
        id: String(port.id || `port_in_${timestamp}_${index}_${pIdx}`),
        name: String(port.name || `in_${pIdx + 1}`).slice(0, 80),
        type: normalizePortType(port.type),
        description: String(port.description || "").slice(0, 300),
        defaultValue: String(port.defaultValue || "").slice(0, 500),
        required: Boolean(port.required),
      }));

      // Sanitize output ports - CRITICAL: each port must have required id and name
      const rawOutputs = Array.isArray(d.outputs) ? (d.outputs as Array<Record<string, unknown>>) : [];
      const sanitizedOutputs: WebFlowPort[] = rawOutputs.map((port, pIdx) => ({
        id: String(port.id || `port_out_${timestamp}_${index}_${pIdx}`),
        name: String(port.name || `out_${pIdx + 1}`).slice(0, 80),
        type: normalizePortType(port.type),
        description: String(port.description || "").slice(0, 300),
        defaultValue: String(port.defaultValue || "").slice(0, 500),
        required: Boolean(port.required),
      }));

      return {
        id: cleanId,
        type,
        position: { x: posX, y: posY },
        data: {
          label: String(d.label || `Step ${index + 1}`).slice(0, 120),
          kind,
          description: d.description ? String(d.description).slice(0, 1000) : "",
          websiteId: validWebsiteId,
          websiteUrl: d.websiteUrl ? String(d.websiteUrl).slice(0, 2048) : "",
          websiteTitle: d.websiteTitle ? String(d.websiteTitle).slice(0, 250) : "",
          websiteDomain: d.websiteDomain ? String(d.websiteDomain).slice(0, 150) : "",
          websiteFaviconUrl: d.websiteFaviconUrl ? String(d.websiteFaviconUrl).slice(0, 2048) : "",
          action: d.action ? String(d.action).slice(0, 200) : "",
          actionDescription: d.actionDescription ? String(d.actionDescription).slice(0, 1000) : "",
          inputs: sanitizedInputs,
          outputs: sanitizedOutputs,
          instructions: d.instructions ? String(d.instructions).slice(0, 5000) : "",
          conditionExpression: d.conditionExpression ? String(d.conditionExpression).slice(0, 1000) : "",
          delaySeconds: typeof d.delaySeconds === "number" && !isNaN(d.delaySeconds) ? d.delaySeconds : 0,
          noteContent: d.noteContent ? String(d.noteContent).slice(0, 5000) : "",
          tags: Array.isArray(d.tags) ? d.tags.map(String).slice(0, 20) : [],
          category: d.category ? String(d.category).slice(0, 60) : "",
          status: "configured",
          customBg: typeof d.customBg === "string" ? d.customBg : undefined,
          customBorderColor: typeof d.customBorderColor === "string" ? d.customBorderColor : undefined,
        },
      };
    });

    // 2. Sanitize Edges (Ensuring both source and target exist)
    const validNodeIdSet = new Set(sanitizedNodes.map((n) => n.id));

    const sanitizedEdges: WebFlowEdge[] = rawEdges
      .map((edge, index) => {
        const rawSource = String(edge.source || "");
        const rawTarget = String(edge.target || "");

        const source = idMap.get(rawSource) || rawSource;
        const target = idMap.get(rawTarget) || rawTarget;

        if (!source || !target || !validNodeIdSet.has(source) || !validNodeIdSet.has(target)) {
          return null;
        }

        const edgeData = (edge.data || {}) as Record<string, unknown>;
        const conditionBranch =
          edgeData.conditionBranch ||
          (edge.label === "TRUE" ? "true" : edge.label === "FALSE" ? "false" : "default");

        return {
          id: `edge_${timestamp}_${index}`,
          source,
          target,
          sourceHandle: typeof edge.sourceHandle === "string" ? edge.sourceHandle : undefined,
          targetHandle: typeof edge.targetHandle === "string" ? edge.targetHandle : undefined,
          label: edge.label ? String(edge.label).slice(0, 100) : undefined,
          type: "labeledEdge",
          animated: Boolean(edge.animated),
          data: {
            conditionBranch: String(conditionBranch),
            dataType: typeof edgeData.dataType === "string" ? edgeData.dataType : "",
            description: typeof edgeData.description === "string" ? edgeData.description : "",
          },
        };
      })
      .filter(Boolean) as WebFlowEdge[];

    // 3. Sanitize Variables
    const allowedVarTypes = ["string", "number", "boolean", "file", "json"] as const;
    const sanitizedVariables: WebFlowVariable[] = rawVariables.map((v, index) => {
      const rawType = String(v.type || "").toLowerCase();
      const isAllowed = allowedVarTypes.includes(rawType as (typeof allowedVarTypes)[number]);
      return {
        id: `var_${timestamp}_${index}`,
        name: String(v.name || `variable_${index + 1}`).replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 80),
        type: isAllowed ? (rawType as WebFlowVariable["type"]) : "string",
        defaultValue: v.defaultValue ? String(v.defaultValue).slice(0, 500) : "",
        description: v.description ? String(v.description).slice(0, 300) : "",
        required: Boolean(v.required),
      };
    });

    await connectToDatabase();

    const cleanTitle = name.endsWith("(Imported)") ? name : `${name} (Imported)`;

    const createdFlow = await WebFlow.create({
      userId: user._id,
      name: cleanTitle.slice(0, 140),
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
