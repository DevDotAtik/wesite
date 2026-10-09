import YAML from "yaml";
import type { WebFlowEdge, WebFlowNode, WebFlowVariable } from "./types";

export type AIAgentExport = {
  workflow: {
    name: string;
    description: string;
    purpose: string;
    version: string;
    category: string;
    generated_at: string;
    created_with: string;
  };
  inputs: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
  variables: Array<{
    name: string;
    type: string;
    defaultValue: string;
    description: string;
  }>;
  steps: Array<{
    id: string;
    step_number: number;
    type: string;
    label: string;
    website?: {
      name: string;
      url: string;
      domain?: string;
    };
    action: string;
    purpose: string;
    inputs: Array<{ name: string; type?: string; description?: string }>;
    outputs: Array<{ name: string; type?: string; description?: string }>;
    instructions: string[];
    condition_expression?: string;
    next_steps: Array<{ target_id: string; condition_branch?: string; label?: string }>;
    success_criteria?: string;
    failure_handling?: string;
  }>;
  connections: Array<{
    from_node: string;
    to_node: string;
    label?: string;
    condition_branch?: string;
  }>;
  conditions: Array<{
    node_id: string;
    expression: string;
    true_target?: string;
    false_target?: string;
  }>;
  outputs: Array<{
    name: string;
    type: string;
    source_node: string;
    description: string;
  }>;
  constraints: string[];
  failure_handling: string[];
};

/**
 * Topologically sorts or sequences nodes starting from entry points.
 */
function getOrderedNodes(nodes: WebFlowNode[], edges: WebFlowEdge[]): WebFlowNode[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  });

  edges.forEach((e) => {
    if (inDegree.has(e.target)) {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
    if (adj.has(e.source)) {
      adj.get(e.source)!.push(e.target);
    }
  });

  const queue: string[] = [];
  // Prioritize Start nodes or inDegree 0
  nodes.forEach((n) => {
    if (inDegree.get(n.id) === 0) {
      queue.push(n.id);
    }
  });

  const orderedIds: string[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr)) continue;
    visited.add(curr);
    orderedIds.push(curr);

    const neighbors = adj.get(curr) || [];
    for (const neighbor of neighbors) {
      const deg = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, deg);
      if (deg <= 0 && !visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  // Add any remaining unvisited nodes
  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      orderedIds.push(n.id);
    }
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return orderedIds.map((id) => nodeMap.get(id)!).filter(Boolean);
}

/**
 * Convert visual WebFlow graph to machine-readable AI Agent specification.
 */
export function convertToAIAgentFormat(params: {
  name: string;
  description?: string;
  category?: string;
  nodes: WebFlowNode[];
  edges: WebFlowEdge[];
  variables?: WebFlowVariable[];
}): AIAgentExport {
  const { name, description = "", category = "Productivity", nodes, edges, variables = [] } = params;

  const orderedNodes = getOrderedNodes(nodes, edges);
  const outgoingMap = new Map<string, WebFlowEdge[]>();
  edges.forEach((e) => {
    if (!outgoingMap.has(e.source)) outgoingMap.set(e.source, []);
    outgoingMap.get(e.source)!.push(e);
  });

  // Extract workflow-level inputs
  const workflowInputs: AIAgentExport["inputs"] = [];
  const workflowOutputs: AIAgentExport["outputs"] = [];

  orderedNodes.forEach((node) => {
    if (node.data.kind === "input") {
      workflowInputs.push({
        name: node.data.label,
        type: "string",
        description: node.data.description || "Initial workflow input",
        required: true,
      });
    }
    if (node.data.kind === "output") {
      workflowOutputs.push({
        name: node.data.label,
        type: "string",
        source_node: node.id,
        description: node.data.description || "Final workflow deliverable",
      });
    }
  });

  const steps: AIAgentExport["steps"] = orderedNodes
    .filter((n) => n.data.kind !== "note")
    .map((node, index) => {
      const nextEdges = outgoingMap.get(node.id) || [];
      const instructions = node.data.instructions
        ? node.data.instructions.split("\n").filter((l) => l.trim().length > 0)
        : [];

      return {
        id: node.id,
        step_number: index + 1,
        type:
          node.data.kind === "website"
            ? "website_action"
            : node.data.kind === "ai"
              ? "ai_instruction"
              : `${node.data.kind}_step`,
        label: node.data.label,
        website:
          node.data.kind === "website" && node.data.websiteUrl
            ? {
                name: node.data.websiteTitle || node.data.label,
                url: node.data.websiteUrl,
                domain: node.data.websiteDomain,
              }
            : undefined,
        action: node.data.action || node.data.description || "Execute step",
        purpose: node.data.description || node.data.actionDescription || node.data.label,
        inputs: (node.data.inputs || []).map((p) => ({
          name: p.name,
          type: p.type,
          description: p.description,
        })),
        outputs: (node.data.outputs || []).map((p) => ({
          name: p.name,
          type: p.type,
          description: p.description,
        })),
        instructions: instructions.length > 0 ? instructions : [node.data.action || "Perform action"],
        condition_expression: node.data.conditionExpression,
        next_steps: nextEdges.map((e) => ({
          target_id: e.target,
          condition_branch: e.data?.conditionBranch,
          label: e.label,
        })),
        success_criteria: `Step ${node.data.label} completed and expected output produced.`,
        failure_handling: "If step fails, verify URL, credentials, and inputs, then retry.",
      };
    });

  const conditions: AIAgentExport["conditions"] = orderedNodes
    .filter((n) => n.data.kind === "condition")
    .map((n) => {
      const out = outgoingMap.get(n.id) || [];
      const trueEdge = out.find((e) => e.data?.conditionBranch === "true");
      const falseEdge = out.find((e) => e.data?.conditionBranch === "false");
      return {
        node_id: n.id,
        expression: n.data.conditionExpression || "evaluate condition",
        true_target: trueEdge?.target || out[0]?.target,
        false_target: falseEdge?.target || out[1]?.target,
      };
    });

  return {
    workflow: {
      name,
      description,
      purpose: description || `Automate and document ${name}`,
      version: "1.0",
      category,
      generated_at: new Date().toISOString(),
      created_with: "Wesite WebFlow Platform",
    },
    inputs: workflowInputs,
    variables: variables.map((v) => ({
      name: v.name,
      type: v.type,
      defaultValue: v.defaultValue || "",
      description: v.description || "",
    })),
    steps,
    connections: edges.map((e) => ({
      from_node: e.source,
      to_node: e.target,
      label: e.label,
      condition_branch: e.data?.conditionBranch,
    })),
    conditions,
    outputs: workflowOutputs,
    constraints: [
      "Follow node sequences in order unless branching condition directs otherwise.",
      "Check input validation before submitting data to websites.",
      "Never submit plain text passwords or credentials without explicit approval.",
    ],
    failure_handling: [
      "Halt execution if an unhandled conditional branch is reached.",
      "Log errors and request human operator intervention on critical action failures.",
    ],
  };
}

/**
 * Generate human-readable Markdown documentation for the WebFlow.
 */
export function convertToHumanMarkdown(params: {
  name: string;
  description?: string;
  category?: string;
  nodes: WebFlowNode[];
  edges: WebFlowEdge[];
  variables?: WebFlowVariable[];
}): string {
  const { name, description = "", category = "Productivity", nodes, edges, variables = [] } = params;
  const orderedNodes = getOrderedNodes(nodes, edges);

  const websiteNodes = nodes.filter((n) => n.data.kind === "website" && n.data.websiteUrl);
  const notes = nodes.filter((n) => n.data.kind === "note");

  const lines: string[] = [];

  lines.push(`# ${name}`);
  if (description) {
    lines.push(`\n> ${description}\n`);
  }
  lines.push(`**Category:** ${category} | **Total Steps:** ${orderedNodes.filter((n) => n.data.kind !== "note").length}`);
  lines.push(`\n---\n`);

  // Variables section
  if (variables.length > 0) {
    lines.push(`## Required Variables\n`);
    lines.push(`| Variable | Type | Default Value | Description |`);
    lines.push(`| :--- | :--- | :--- | :--- |`);
    variables.forEach((v) => {
      lines.push(`| \`{{${v.name}}}\` | \`${v.type}\` | ${v.defaultValue || "—"} | ${v.description || "—"} |`);
    });
    lines.push(`\n---\n`);
  }

  // Tools & Websites used
  if (websiteNodes.length > 0) {
    lines.push(`## Tools & Websites Used\n`);
    const uniqueSites = new Map<string, { title: string; url: string; domain?: string }>();
    websiteNodes.forEach((w) => {
      const url = w.data.websiteUrl!;
      if (!uniqueSites.has(url)) {
        uniqueSites.set(url, {
          title: w.data.websiteTitle || w.data.label,
          url,
          domain: w.data.websiteDomain,
        });
      }
    });

    uniqueSites.forEach((site) => {
      lines.push(`- **[${site.title}](${site.url})** \`${site.domain || site.url}\``);
    });
    lines.push(`\n---\n`);
  }

  // Step-by-step workflow
  lines.push(`## Step-by-Step Instructions\n`);

  let stepNumber = 1;
  orderedNodes.forEach((node) => {
    if (node.data.kind === "note") return;

    lines.push(`### Step ${stepNumber}: ${node.data.label}`);

    if (node.data.kind === "website" && node.data.websiteUrl) {
      lines.push(`- **Website:** [${node.data.websiteTitle || node.data.label}](${node.data.websiteUrl})`);
    }

    if (node.data.action) {
      lines.push(`- **Action:** ${node.data.action}`);
    }

    if (node.data.actionDescription) {
      lines.push(`- **Details:** ${node.data.actionDescription}`);
    }

    if (node.data.conditionExpression) {
      lines.push(`- **Condition:** \`${node.data.conditionExpression}\``);
    }

    if (node.data.inputs && node.data.inputs.length > 0) {
      lines.push(`- **Inputs:** ${node.data.inputs.map((i) => `\`${i.name}\``).join(", ")}`);
    }

    if (node.data.outputs && node.data.outputs.length > 0) {
      lines.push(`- **Outputs:** ${node.data.outputs.map((o) => `\`${o.name}\``).join(", ")}`);
    }

    if (node.data.instructions) {
      lines.push(`\n**Instructions:**\n${node.data.instructions}`);
    }

    lines.push("");
    stepNumber++;
  });

  // Canvas Notes & Documentation
  if (notes.length > 0) {
    lines.push(`---\n## Process Notes & Guidelines\n`);
    notes.forEach((note) => {
      lines.push(`> 📝 **${note.data.label}**\n>\n> ${note.data.noteContent || note.data.description || "No note body"}\n`);
    });
  }

  return lines.join("\n");
}

/**
 * Generate YAML format for AI Agent configurations.
 */
export function convertToYAML(data: AIAgentExport): string {
  return YAML.stringify(data, { indent: 2 });
}

/**
 * Generate clean plain text format.
 */
export function convertToPlainText(humanMarkdown: string): string {
  return humanMarkdown
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1 ($2)")
    .replace(/`([^`]+)`/g, "$1");
}
