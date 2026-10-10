import type { NextRequest } from "next/server";
import { apiError, json, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Website from "@/models/Website";
import type {
  WebFlowNode,
  WebFlowEdge,
  WebFlowVariable,
  WebFlowCategory,
  WebFlowNodeKind,
  WebFlowNodeData,
} from "@/lib/webflow/types";

// Standard web tools library for synthesis when user hasn't saved a specific website yet
const KNOWN_TOOLS: Record<string, { title: string; url: string; domain: string; faviconUrl: string; defaultAction: string; category?: WebFlowCategory }> = {
  google: {
    title: "Google Search",
    url: "https://google.com",
    domain: "google.com",
    faviconUrl: "https://www.google.com/favicon.ico",
    defaultAction: "Search query and inspect top results",
    category: "Research",
  },
  arxiv: {
    title: "arXiv",
    url: "https://arxiv.org",
    domain: "arxiv.org",
    faviconUrl: "https://arxiv.org/favicon.ico",
    defaultAction: "Query scientific preprints and papers",
    category: "Research",
  },
  github: {
    title: "GitHub",
    url: "https://github.com",
    domain: "github.com",
    faviconUrl: "https://github.com/favicon.ico",
    defaultAction: "Inspect repository diff, PRs, and commit history",
    category: "Development",
  },
  gitlab: {
    title: "GitLab",
    url: "https://gitlab.com",
    domain: "gitlab.com",
    faviconUrl: "https://gitlab.com/favicon.ico",
    defaultAction: "Inspect CI/CD pipeline and code review",
    category: "Development",
  },
  chatgpt: {
    title: "ChatGPT",
    url: "https://chatgpt.com",
    domain: "chatgpt.com",
    faviconUrl: "https://chatgpt.com/favicon.ico",
    defaultAction: "Analyze context and generate structured content",
    category: "AI",
  },
  claude: {
    title: "Anthropic Claude",
    url: "https://claude.ai",
    domain: "claude.ai",
    faviconUrl: "https://claude.ai/favicon.ico",
    defaultAction: "Synthesize research and draft technical analysis",
    category: "AI",
  },
  perplexity: {
    title: "Perplexity AI",
    url: "https://perplexity.ai",
    domain: "perplexity.ai",
    faviconUrl: "https://www.perplexity.ai/favicon.ico",
    defaultAction: "Gather sourced answers with live citations",
    category: "Research",
  },
  notion: {
    title: "Notion",
    url: "https://notion.so",
    domain: "notion.so",
    faviconUrl: "https://www.notion.so/images/favicon.ico",
    defaultAction: "Create database page and persist notes",
    category: "Productivity",
  },
  obsidian: {
    title: "Obsidian",
    url: "https://obsidian.md",
    domain: "obsidian.md",
    faviconUrl: "https://obsidian.md/favicon.ico",
    defaultAction: "Persist markdown vault note with backlinks",
    category: "Productivity",
  },
  linkedin: {
    title: "LinkedIn",
    url: "https://linkedin.com",
    domain: "linkedin.com",
    faviconUrl: "https://www.linkedin.com/favicon.ico",
    defaultAction: "Publish technical post and track reach",
    category: "Social Media",
  },
  twitter: {
    title: "X / Twitter",
    url: "https://x.com",
    domain: "x.com",
    faviconUrl: "https://abs.twimg.com/favicons/twitter.ico",
    defaultAction: "Publish thread update and engage audience",
    category: "Social Media",
  },
  gmail: {
    title: "Gmail",
    url: "https://mail.google.com",
    domain: "mail.google.com",
    faviconUrl: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico",
    defaultAction: "Compose and dispatch message",
    category: "Marketing",
  },
  canva: {
    title: "Canva",
    url: "https://canva.com",
    domain: "canva.com",
    faviconUrl: "https://www.canva.com/favicon.ico",
    defaultAction: "Generate visual banner and asset dimensions",
    category: "Design",
  },
  slack: {
    title: "Slack",
    url: "https://slack.com",
    domain: "slack.com",
    faviconUrl: "https://a.slack-edge.com/80588/marketing/img/meta/favicon-32.png",
    defaultAction: "Post status report to internal channel",
    category: "Productivity",
  },
  discord: {
    title: "Discord",
    url: "https://discord.com",
    domain: "discord.com",
    faviconUrl: "https://discord.com/assets/favicon.ico",
    defaultAction: "Send webhook notification to server",
    category: "Social Media",
  },
  telegram: {
    title: "Telegram",
    url: "https://telegram.org",
    domain: "telegram.org",
    faviconUrl: "https://telegram.org/favicon.ico",
    defaultAction: "Send bot message to channel or chat",
    category: "Social Media",
  },
  figma: {
    title: "Figma",
    url: "https://figma.com",
    domain: "figma.com",
    faviconUrl: "https://static.figma.com/app/icon/1/favicon.ico",
    defaultAction: "Review design specifications and copy",
    category: "Design",
  },
  linear: {
    title: "Linear",
    url: "https://linear.app",
    domain: "linear.app",
    faviconUrl: "https://linear.app/favicon.ico",
    defaultAction: "File bug tracking issue and assign priority",
    category: "Development",
  },
  jira: {
    title: "Jira",
    url: "https://atlassian.com/software/jira",
    domain: "atlassian.com",
    faviconUrl: "https://jira.atlassian.com/favicon.ico",
    defaultAction: "Create sprint task and link ticket",
    category: "Productivity",
  },
  drive: {
    title: "Google Drive",
    url: "https://drive.google.com",
    domain: "drive.google.com",
    faviconUrl: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
    defaultAction: "Upload deliverable and export shared asset",
    category: "Productivity",
  },
  youtube: {
    title: "YouTube",
    url: "https://youtube.com",
    domain: "youtube.com",
    faviconUrl: "https://www.youtube.com/favicon.ico",
    defaultAction: "Extract video transcript and timestamps",
    category: "Social Media",
  },
  stripe: {
    title: "Stripe",
    url: "https://stripe.com",
    domain: "stripe.com",
    faviconUrl: "https://stripe.com/favicon.ico",
    defaultAction: "Create checkout session and verify payment webhook",
    category: "Business",
  },
  shopify: {
    title: "Shopify",
    url: "https://shopify.com",
    domain: "shopify.com",
    faviconUrl: "https://www.shopify.com/favicon.ico",
    defaultAction: "Update product inventory and order status",
    category: "Business",
  },
  supabase: {
    title: "Supabase",
    url: "https://supabase.com",
    domain: "supabase.com",
    faviconUrl: "https://supabase.com/favicon.ico",
    defaultAction: "Query Postgres database and execute RPC function",
    category: "Development",
  },
  vercel: {
    title: "Vercel",
    url: "https://vercel.com",
    domain: "vercel.com",
    faviconUrl: "https://vercel.com/favicon.ico",
    defaultAction: "Trigger preview deployment and verify build logs",
    category: "Development",
  },
  postman: {
    title: "Postman",
    url: "https://postman.com",
    domain: "postman.com",
    faviconUrl: "https://www.postman.com/favicon.ico",
    defaultAction: "Execute automated API integration collection",
    category: "Development",
  },
  zendesk: {
    title: "Zendesk",
    url: "https://zendesk.com",
    domain: "zendesk.com",
    faviconUrl: "https://www.zendesk.com/favicon.ico",
    defaultAction: "Triage support ticket and dispatch resolution",
    category: "Business",
  },
  apollo: {
    title: "Apollo.io",
    url: "https://apollo.io",
    domain: "apollo.io",
    faviconUrl: "https://www.apollo.io/favicon.ico",
    defaultAction: "Extract verified business leads and verified emails",
    category: "Marketing",
  },
  amazon: {
    title: "Amazon",
    url: "https://amazon.com",
    domain: "amazon.com",
    faviconUrl: "https://www.amazon.com/favicon.ico",
    defaultAction: "Scrape product listing and price changes",
    category: "Business",
  },
};

interface UserSavedSite {
  _id: { toString: () => string };
  title?: string;
  domain?: string;
  url?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireUser(request);
    if (response) return response;

    const body = await request.json().catch(() => null);
    if (!body || !body.prompt || typeof body.prompt !== "string") {
      return apiError("Please provide a prompt describing the workflow.", 400);
    }

    const prompt = body.prompt.trim();
    const mode = body.mode === "refine" ? "refine" : "create";
    const currentNodes: WebFlowNode[] = Array.isArray(body.currentNodes) ? body.currentNodes : [];
    const currentEdges: WebFlowEdge[] = Array.isArray(body.currentEdges) ? body.currentEdges : [];
    const userApiKey: string | undefined = body.apiKey && typeof body.apiKey === "string" ? body.apiKey.trim() : undefined;
    const provider: "gemini" | "openai" = body.provider === "openai" ? "openai" : "gemini";

    await connectToDatabase();

    // 1. Fetch user's saved websites library to prioritize their real tools
    const userWebsites = await Website.find({ userId: user._id, isTrashed: false })
      .select("_id title url domain faviconUrl ogImageUrl description tags")
      .lean();

    const timestamp = Date.now();

    // 2. Check if a live LLM API call is possible (Gemini / OpenAI)
    const activeApiKey = userApiKey || (provider === "openai" ? process.env.OPENAI_API_KEY : process.env.GEMINI_API_KEY);

    if (activeApiKey) {
      try {
        const llmResult = await callLiveLLM({
          provider,
          apiKey: activeApiKey,
          prompt,
          mode,
          currentNodes,
          currentEdges,
          userWebsites,
          timestamp,
        });
        if (llmResult) {
          return json(llmResult);
        }
      } catch (llmErr) {
        console.warn("Live LLM failed, falling back to advanced semantic generator:", llmErr);
      }
    }

    // 3. Fallback: High-Fidelity Semantic Generative Engine
    if (mode === "refine" && currentNodes.length > 0) {
      const result = refineExistingWorkflow(prompt, currentNodes, currentEdges, userWebsites, timestamp);
      return json(result);
    } else {
      const result = synthesizeNewWorkflow(prompt, userWebsites, timestamp);
      return json(result);
    }
  } catch (err) {
    console.error("POST /api/webflows/ai-generate error:", err);
    return apiError((err as Error).message || "Failed to generate workflow", 500);
  }
}

/**
 * Live LLM Graph Generator (supports Gemini & OpenAI).
 */
async function callLiveLLM({
  provider,
  apiKey,
  prompt,
  mode,
  currentNodes,
  currentEdges,
  userWebsites,
  timestamp,
}: {
  provider: "gemini" | "openai";
  apiKey: string;
  prompt: string;
  mode: "create" | "refine";
  currentNodes: WebFlowNode[];
  currentEdges: WebFlowEdge[];
  userWebsites: UserSavedSite[];
  timestamp: number;
}) {
  const toolsSummary = userWebsites
    .slice(0, 30)
    .map((w) => `ID: ${w._id.toString()}, Title: ${w.title || w.domain}, Domain: ${w.domain}, URL: ${w.url}`)
    .join("\n");

  const systemInstructions = `You are the WebFlow AI Engine for Wesite.
Generate an executable, connected node-based workflow graph strictly as JSON.
Nodes kinds must be one of: "start", "action", "website", "ai", "condition", "transform", "delay", "note", "end".
Valid categories: "Productivity", "Development", "AI", "Marketing", "Research", "Education", "Job Search", "Design", "Business", "Social Media", "Automation", "Personal", "Other".

User's Saved Tools Library:
${toolsSummary || "No custom websites saved yet."}

JSON Structure to return:
{
  "name": "Short Title",
  "description": "Short Description",
  "category": "Productivity",
  "nodes": [
    {
      "id": "node_${timestamp}_0",
      "type": "startNode",
      "position": { "x": 100, "y": 140 },
      "data": {
        "label": "Start",
        "kind": "start",
        "action": "Trigger",
        "status": "ready",
        "inputs": [],
        "outputs": [{ "id": "p0", "name": "payload", "type": "any" }]
      }
    }
  ],
  "edges": [
    {
      "id": "edge_${timestamp}_0",
      "source": "node_${timestamp}_0",
      "target": "node_${timestamp}_1",
      "type": "labeledEdge",
      "label": "flow"
    }
  ],
  "variables": [
    {
      "id": "var_${timestamp}_1",
      "name": "variable_name",
      "type": "string",
      "defaultValue": "value"
    }
  ],
  "summaryOfChanges": "Created workflow with connected steps."
}

Ensure all nodes flow horizontally (x increments by 320). If a conditionNode is used, split into two branches:
- True branch (edge with sourceHandle: "true", label: "TRUE", target placed at y: 80)
- False branch (edge with sourceHandle: "false", label: "FALSE", target placed at y: 260)
Return strictly JSON with no surrounding markdown or explanation.`;

  if (provider === "gemini") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemInstructions },
              {
                text:
                  mode === "refine"
                    ? `Refine existing graph based on instruction: "${prompt}". Existing nodes count: ${currentNodes.length}, edges count: ${currentEdges.length}.`
                    : `Create new workflow based on user prompt: "${prompt}"`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.statusText}`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("Empty Gemini response");

    const parsed = JSON.parse(rawText);
    return sanitizeWorkflowGraph(parsed, timestamp);
  } else {
    // OpenAI API
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstructions },
          {
            role: "user",
            content:
              mode === "refine"
                ? `Refine existing graph with prompt: "${prompt}". Existing nodes: ${JSON.stringify(currentNodes.map((n) => n.id))}`
                : `Create new workflow for: "${prompt}"`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI API error: ${res.statusText}`);
    }

    const data = await res.json();
    const rawText = data?.choices?.[0]?.message?.content;
    if (!rawText) throw new Error("Empty OpenAI response");

    const parsed = JSON.parse(rawText);
    return sanitizeWorkflowGraph(parsed, timestamp);
  }
}

/**
 * Validates and sanitizes AI-generated graph to ensure 100% schema compliance.
 */
function sanitizeWorkflowGraph(raw: Record<string, unknown>, timestamp: number) {
  const allowedCategories: WebFlowCategory[] = [
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

  const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.slice(0, 120) : "AI Generated Workflow";
  const description = typeof raw.description === "string" ? raw.description.slice(0, 1000) : "";
  const category: WebFlowCategory = allowedCategories.includes(raw.category as WebFlowCategory)
    ? (raw.category as WebFlowCategory)
    : "Productivity";

  const rawNodes = Array.isArray(raw.nodes) ? raw.nodes : [];
  const rawEdges = Array.isArray(raw.edges) ? raw.edges : [];

  const nodes: WebFlowNode[] = rawNodes.map((n: Record<string, unknown>, idx: number) => {
    const id = typeof n.id === "string" && n.id ? n.id : `node_${timestamp}_${idx}`;
    const data = (n.data as Record<string, unknown>) || {};
    const kind = (data.kind as WebFlowNodeKind) || "action";

    // Ensure type matches registered component
    const type = `${kind}Node`;
    const position =
      n.position && typeof n.position === "object"
        ? {
            x: Number((n.position as { x?: number }).x) || 100 + idx * 320,
            y: Number((n.position as { y?: number }).y) || 140,
          }
        : { x: 100 + idx * 320, y: 140 };

    const sanitizedData: WebFlowNodeData = {
      label: (typeof data.label === "string" ? data.label : "Step").slice(0, 100),
      kind,
      description: typeof data.description === "string" ? data.description.slice(0, 500) : undefined,
      action: typeof data.action === "string" ? data.action.slice(0, 200) : undefined,
      actionDescription: typeof data.actionDescription === "string" ? data.actionDescription.slice(0, 500) : undefined,
      instructions: typeof data.instructions === "string" ? data.instructions.slice(0, 2000) : undefined,
      conditionExpression: typeof data.conditionExpression === "string" ? data.conditionExpression.slice(0, 500) : undefined,
      status: "ready",
      inputs: Array.isArray(data.inputs) ? (data.inputs as WebFlowNodeData["inputs"]) : [],
      outputs: Array.isArray(data.outputs) ? (data.outputs as WebFlowNodeData["outputs"]) : [],
    };

    if (typeof data.websiteUrl === "string") sanitizedData.websiteUrl = data.websiteUrl;
    if (typeof data.websiteTitle === "string") sanitizedData.websiteTitle = data.websiteTitle;
    if (typeof data.websiteDomain === "string") sanitizedData.websiteDomain = data.websiteDomain;
    if (typeof data.websiteFaviconUrl === "string") sanitizedData.websiteFaviconUrl = data.websiteFaviconUrl;
    if (typeof data.websiteThumbnailUrl === "string") sanitizedData.websiteThumbnailUrl = data.websiteThumbnailUrl;
    if (typeof data.websiteId === "string" && /^[a-fA-F0-9]{24}$/.test(data.websiteId)) {
      sanitizedData.websiteId = data.websiteId;
    }

    return { id, type, position, data: sanitizedData };
  });

  const edges: WebFlowEdge[] = rawEdges.map((e: Record<string, unknown>, idx: number) => {
    return {
      id: typeof e.id === "string" ? e.id : `edge_${timestamp}_${idx}`,
      source: String(e.source || nodes[0]?.id || `node_${timestamp}_0`),
      target: String(e.target || nodes[1]?.id || `node_${timestamp}_1`),
      type: "labeledEdge",
      sourceHandle: typeof e.sourceHandle === "string" ? e.sourceHandle : undefined,
      targetHandle: typeof e.targetHandle === "string" ? e.targetHandle : undefined,
      label: typeof e.label === "string" ? e.label.slice(0, 60) : "flow",
      data: e.data as WebFlowEdge["data"],
    };
  });

  const variables: WebFlowVariable[] = Array.isArray(raw.variables)
    ? (raw.variables as WebFlowVariable[])
    : [
        {
          id: `var_${timestamp}_1`,
          name: "input_param",
          type: "string",
          defaultValue: "",
          description: "Global execution parameter",
          required: false,
        },
      ];

  return {
    name,
    description,
    category,
    nodes,
    edges,
    variables,
    summaryOfChanges: typeof raw.summaryOfChanges === "string" ? raw.summaryOfChanges : "Workflow synthesized successfully.",
  };
}

/**
 * Advanced Semantic Generative Engine (Offline / Built-in).
 * Handles branching, multi-tool pipelines, conditions, and realistic port configurations.
 */
function synthesizeNewWorkflow(
  prompt: string,
  userWebsites: UserSavedSite[],
  timestamp: number
) {
  const lowerPrompt = prompt.toLowerCase();

  // 1. Tool Matching Helper (user library first, then comprehensive known tools)
  const findTool = (keywords: string[]) => {
    for (const kw of keywords) {
      const match = userWebsites.find(
        (w) =>
          (w.title && w.title.toLowerCase().includes(kw)) ||
          (w.domain && w.domain.toLowerCase().includes(kw)) ||
          (w.url && w.url.toLowerCase().includes(kw))
      );
      if (match) {
        return {
          websiteId: match._id.toString(),
          title: match.title || match.domain,
          url: match.url,
          domain: match.domain,
          faviconUrl: match.faviconUrl,
          thumbnailUrl:
            match.ogImageUrl ||
            (match.url
              ? `https://s0.wp.com/mshots/v1/${encodeURIComponent(
                  match.url.startsWith("http") ? match.url : "https://" + match.url
                )}?w=800`
              : undefined),
          defaultAction: "Open tool and interact",
        };
      }
    }

    for (const kw of keywords) {
      if (KNOWN_TOOLS[kw]) {
        const kt = KNOWN_TOOLS[kw];
        return {
          websiteId: null,
          title: kt.title,
          url: kt.url,
          domain: kt.domain,
          faviconUrl: kt.faviconUrl,
          thumbnailUrl: `https://s0.wp.com/mshots/v1/${encodeURIComponent(kt.url)}?w=800`,
          defaultAction: kt.defaultAction,
        };
      }
    }

    return null;
  };

  // 2. Identify Workflow Domain & Archetype
  let name = "Custom Automated Workflow";
  let category: WebFlowCategory = "Automation";

  type StepPlan = {
    kind: WebFlowNodeKind;
    title: string;
    action: string;
    desc: string;
    instructions?: string;
    website?: Record<string, unknown> | null;
    inputs?: Array<{ id: string; name: string; type: "string" | "number" | "boolean" | "file" | "json" | "any" }>;
    outputs?: Array<{ id: string; name: string; type: "string" | "number" | "boolean" | "file" | "json" | "any" }>;
    conditionExpr?: string;
    branch?: "main" | "true" | "false";
  };

  const hasCondition = /if|check|verify|filter|alert if|is valid|threshold|greater than|less than|discount|approved/i.test(
    lowerPrompt
  );

  const steps: StepPlan[] = [];

  // Start Trigger
  steps.push({
    kind: "start",
    title: "Workflow Start",
    action: "Trigger Execution",
    desc: "Manual or scheduled workflow execution entry point",
    outputs: [{ id: "p0", name: "trigger_payload", type: "any" }],
  });

  // Archetype A: Price Monitoring / E-Commerce Tracker (With Condition Branching!)
  if (/price|amazon|discount|shop|product|deal|scraper|monitor/i.test(lowerPrompt)) {
    name = "Price Tracker & Deal Notification Pipeline";
    category = "Business";

    const shopTool = findTool(["amazon", "shopify", "google"]) || KNOWN_TOOLS.amazon;
    steps.push({
      kind: "website",
      title: shopTool.title || "Target Marketplace",
      action: "Scrape Product Price & Availability",
      desc: `Monitor product page on ${shopTool.title} for pricing fluctuations`,
      website: shopTool,
      inputs: [{ id: "i1", name: "product_url", type: "string" }],
      outputs: [
        { id: "o1", name: "current_price", type: "number" },
        { id: "o2", name: "is_in_stock", type: "boolean" },
      ],
    });

    steps.push({
      kind: "condition",
      title: "Evaluate Price Drop",
      action: "Check Threshold Condition",
      desc: "Verify if current price is lower than target threshold and item in stock",
      conditionExpr: "current_price <= target_threshold && is_in_stock === true",
      inputs: [{ id: "c1", name: "current_price", type: "number" }],
    });

    // True Branch (Alert)
    const alertTool = findTool(["telegram", "slack", "discord", "gmail"]) || KNOWN_TOOLS.telegram;
    steps.push({
      kind: "website",
      title: alertTool.title || "Dispatch Alert",
      action: "Send Immediate Deal Notification",
      desc: "Dispatch instant alert with product purchase link",
      website: alertTool,
      branch: "true",
      inputs: [{ id: "i_alert", name: "deal_details", type: "string" }],
      outputs: [{ id: "o_alert", name: "alert_id", type: "string" }],
    });

    // False Branch (Log & Wait)
    steps.push({
      kind: "delay",
      title: "Wait 1 Hour",
      action: "Schedule Next Check",
      desc: "Price has not met threshold. Pause execution before retry cycle.",
      branch: "false",
    });
  }
  // Archetype B: Lead Generation & Cold Email Outreach
  else if (/lead|sales|outreach|email|prospect|cold|crm|apollo/i.test(lowerPrompt)) {
    name = "B2B Lead Generation & Outreach Pipeline";
    category = "Marketing";

    const leadTool = findTool(["apollo", "linkedin", "google"]) || KNOWN_TOOLS.apollo;
    steps.push({
      kind: "website",
      title: leadTool.title || "Prospecting Database",
      action: "Search & Extract Verified Contacts",
      desc: "Filter target ideal customer profile by job title and industry",
      website: leadTool,
      inputs: [{ id: "i1", name: "target_title", type: "string" }],
      outputs: [{ id: "o1", name: "lead_records", type: "json" }],
    });

    steps.push({
      kind: "ai",
      title: "AI Personalization",
      action: "Draft Contextual Pitch",
      desc: "Analyze prospect background and write tailored, non-generic email pitch",
      instructions: "Generate a personalized 3-sentence outreach email referencing recipient's domain.",
      inputs: [{ id: "i2", name: "lead_records", type: "json" }],
      outputs: [{ id: "o2", name: "personalized_copy", type: "string" }],
    });

    steps.push({
      kind: "action",
      title: "Human Quality Review",
      action: "Approve Email Copy",
      desc: "Verify tone and personalization before dispatching",
      inputs: [{ id: "i_rev", name: "draft_copy", type: "string" }],
      outputs: [{ id: "o_rev", name: "approved_copy", type: "string" }],
    });

    const mailTool = findTool(["gmail", "slack"]) || KNOWN_TOOLS.gmail;
    steps.push({
      kind: "website",
      title: mailTool.title || "Dispatch Email",
      action: "Send Outreach Email",
      desc: "Send approved email and log thread identifier",
      website: mailTool,
      inputs: [{ id: "i_send", name: "final_message", type: "string" }],
      outputs: [{ id: "o_send", name: "message_id", type: "string" }],
    });
  }
  // Archetype C: YouTube / Video Content Repurposing
  else if (/youtube|video|podcast|transcript|tiktok|audio/i.test(lowerPrompt)) {
    name = "Video Transcript & Social Repurposing Engine";
    category = "Social Media";

    const ytTool = findTool(["youtube"]) || KNOWN_TOOLS.youtube;
    steps.push({
      kind: "website",
      title: ytTool.title || "YouTube",
      action: "Extract Full Subtitles & Timestamps",
      desc: "Download captions and clean up timecode formatting",
      website: ytTool,
      inputs: [{ id: "i1", name: "video_url", type: "string" }],
      outputs: [{ id: "o1", name: "clean_transcript", type: "string" }],
    });

    steps.push({
      kind: "ai",
      title: "AI Viral Synthesis",
      action: "Generate Post & Hook",
      desc: "Distill the transcript into an engaging 5-point post with hook and CTA",
      instructions: "Extract top 3 counter-intuitive takeaways and draft punchy social post.",
      inputs: [{ id: "i2", name: "clean_transcript", type: "string" }],
      outputs: [{ id: "o2", name: "drafted_post", type: "string" }],
    });

    const pubTool = findTool(["linkedin", "twitter"]) || KNOWN_TOOLS.linkedin;
    steps.push({
      kind: "website",
      title: pubTool.title || "Social Platform",
      action: "Publish Post & Thread",
      desc: `Post the finalized breakdown to ${pubTool.title}`,
      website: pubTool,
      inputs: [{ id: "i3", name: "final_copy", type: "string" }],
      outputs: [{ id: "o3", name: "post_live_url", type: "string" }],
    });
  }
  // Archetype D: GitHub PR / CI-CD / Bug Triage
  else if (/github|code|bug|pr|deploy|docker|commit|regression|test/i.test(lowerPrompt)) {
    name = "Codebase PR & Automated Triage Pipeline";
    category = "Development";

    const gitTool = findTool(["github", "gitlab"]) || KNOWN_TOOLS.github;
    steps.push({
      kind: "website",
      title: gitTool.title || "GitHub",
      action: "Fetch Pull Request Unified Diff",
      desc: "Extract modified files, commit logs, and issue reference context",
      website: gitTool,
      inputs: [{ id: "i1", name: "pr_number", type: "number" }],
      outputs: [{ id: "o1", name: "diff_payload", type: "string" }],
    });

    steps.push({
      kind: "ai",
      title: "AI Security & Bug Analysis",
      action: "Detect Vulnerabilities",
      desc: "Audit the diff for race conditions, security flaws, and performance regressions",
      instructions: "Review code diff. Provide bulleted security audit and flag potential breaking changes.",
      inputs: [{ id: "i2", name: "diff_payload", type: "string" }],
      outputs: [{ id: "o2", name: "triage_report", type: "string" }],
    });

    const notifTool = findTool(["slack", "linear", "discord"]) || KNOWN_TOOLS.slack;
    steps.push({
      kind: "website",
      title: notifTool.title || "Engineering Channel",
      action: "Post Audit Report",
      desc: "Broadcast triage summary to the core team",
      website: notifTool,
      inputs: [{ id: "i3", name: "report_content", type: "string" }],
      outputs: [{ id: "o3", name: "message_ts", type: "string" }],
    });
  }
  // Archetype E: Academic / Research & Synthesis
  else if (/research|paper|arxiv|study|scholar|literature|article/i.test(lowerPrompt)) {
    name = "Literature Research & Knowledge Base Pipeline";
    category = "Research";

    const searchTool = findTool(["arxiv", "google", "perplexity"]) || KNOWN_TOOLS.arxiv;
    steps.push({
      kind: "website",
      title: searchTool.title || "Research Portal",
      action: "Search Papers & Retrieve Abstracts",
      desc: "Gather top peer-reviewed preprints matching query",
      website: searchTool,
      inputs: [{ id: "i1", name: "search_query", type: "string" }],
      outputs: [{ id: "o1", name: "paper_abstracts", type: "string" }],
    });

    steps.push({
      kind: "ai",
      title: "AI Thesis Extraction",
      action: "Extract Findings & Citations",
      desc: "Synthesize methodology, core discoveries, benchmarks, and citations",
      instructions: "Extract thesis, statistical findings, methodological limitations, and full references.",
      inputs: [{ id: "i2", name: "paper_abstracts", type: "string" }],
      outputs: [{ id: "o2", name: "structured_summary", type: "string" }],
    });

    const docTool = findTool(["notion", "obsidian", "drive"]) || KNOWN_TOOLS.notion;
    steps.push({
      kind: "website",
      title: docTool.title || "Knowledge Base",
      action: "Store Structured Research Notes",
      desc: "Create new database entry with markdown body and tags",
      website: docTool,
      inputs: [{ id: "i3", name: "notes_payload", type: "string" }],
      outputs: [{ id: "o3", name: "page_url", type: "string" }],
    });
  }
  // Archetype F: Generic Multi-Step Pipeline with Intelligent Tool Matching
  else {
    name = prompt.slice(0, 40).replace(/[^\w\s]/g, "") || "Multi-Step Web Workflow";
    category = "Productivity";

    const toolA = findTool(["google", "notion", "github", "drive", "youtube", "figma"]) || KNOWN_TOOLS.google;
    steps.push({
      kind: "website",
      title: toolA.title || "Input Source",
      action: toolA.defaultAction,
      desc: `Gather initial payload using ${toolA.title}`,
      website: toolA,
      inputs: [{ id: "i1", name: "source_query", type: "string" }],
      outputs: [{ id: "o1", name: "raw_data", type: "any" }],
    });

    steps.push({
      kind: "ai",
      title: "AI Transformation",
      action: "Process & Refine Context",
      desc: "Analyze incoming data and format according to workflow objectives",
      instructions: prompt,
      inputs: [{ id: "i2", name: "raw_data", type: "any" }],
      outputs: [{ id: "o2", name: "processed_result", type: "any" }],
    });

    if (hasCondition) {
      steps.push({
        kind: "condition",
        title: "Quality Verification",
        action: "Validate Result Status",
        desc: "Evaluate whether output meets quality criteria",
        conditionExpr: "output.success === true && output.score >= 0.8",
      });

      const toolB = findTool(["slack", "linkedin", "gmail", "notion"]) || KNOWN_TOOLS.notion;
      steps.push({
        kind: "website",
        title: toolB.title || "Destination",
        action: toolB.defaultAction,
        desc: `Deliver successful output via ${toolB.title}`,
        website: toolB,
        branch: "true",
      });

      steps.push({
        kind: "action",
        title: "Log Exception",
        action: "Record Failure Case",
        desc: "Quality check did not pass; log payload for manual inspection",
        branch: "false",
      });
    } else {
      const toolB = findTool(["linkedin", "notion", "gmail", "slack", "drive"]) || KNOWN_TOOLS.notion;
      steps.push({
        kind: "website",
        title: toolB.title || "Output Destination",
        action: toolB.defaultAction,
        desc: `Persist final output via ${toolB.title}`,
        website: toolB,
        inputs: [{ id: "i3", name: "processed_result", type: "any" }],
        outputs: [{ id: "o3", name: "delivery_status", type: "string" }],
      });
    }
  }

  // End Terminals
  const hasBranches = steps.some((s) => s.branch === "true" || s.branch === "false");

  if (hasBranches) {
    steps.push({
      kind: "end",
      title: "Flow Success",
      action: "Success Terminal",
      desc: "Workflow completed successfully along true branch",
      branch: "true",
    });
    steps.push({
      kind: "end",
      title: "Flow Terminated",
      action: "Exit Terminal",
      desc: "Workflow stopped along alternate branch",
      branch: "false",
    });
  } else {
    steps.push({
      kind: "end",
      title: "Flow Complete",
      action: "Final Exit",
      desc: "Workflow successfully executed all sequential steps",
    });
  }

  // 3. Build React Flow Nodes & Topological Layout
  let currentMainX = 100;
  let trueBranchX = 0;
  let falseBranchX = 0;

  const nodes: WebFlowNode[] = steps.map((step, idx) => {
    const nodeId = `node_${timestamp}_${idx}`;
    let x = currentMainX;
    let y = 140;

    if (step.branch === "true") {
      if (!trueBranchX) trueBranchX = currentMainX;
      x = trueBranchX;
      y = 70;
      trueBranchX += 340;
    } else if (step.branch === "false") {
      if (!falseBranchX) falseBranchX = currentMainX - 340;
      x = falseBranchX;
      y = 280;
      falseBranchX += 340;
    } else {
      x = currentMainX;
      y = 140;
      currentMainX += 340;
      trueBranchX = currentMainX;
      falseBranchX = currentMainX;
    }

    const data: WebFlowNodeData = {
      label: step.title,
      kind: step.kind,
      description: step.desc,
      action: step.action,
      inputs: step.inputs || [],
      outputs: step.outputs || [],
      status: "ready",
    };

    if (step.instructions) data.instructions = step.instructions;
    if (step.conditionExpr) data.conditionExpression = step.conditionExpr;

    if (step.website) {
      if (typeof step.website.websiteId === "string" && /^[a-fA-F0-9]{24}$/.test(step.website.websiteId)) {
        data.websiteId = step.website.websiteId;
      }
      data.websiteTitle = step.website.title as string | undefined;
      data.websiteUrl = step.website.url as string | undefined;
      data.websiteDomain = step.website.domain as string | undefined;
      data.websiteFaviconUrl = step.website.faviconUrl as string | undefined;
      data.websiteThumbnailUrl = step.website.thumbnailUrl as string | undefined;
    }

    return {
      id: nodeId,
      type: `${step.kind}Node`,
      position: { x, y },
      data,
    };
  });

  // 4. Construct Edges (with true/false branches if condition exists)
  const edges: WebFlowEdge[] = [];
  const conditionNodeIdx = steps.findIndex((s) => s.kind === "condition");

  if (conditionNodeIdx !== -1) {
    const condNode = nodes[conditionNodeIdx];

    // Main line before condition
    for (let i = 0; i < conditionNodeIdx; i++) {
      edges.push({
        id: `edge_${timestamp}_${i}`,
        source: nodes[i].id,
        target: nodes[i + 1].id,
        type: "labeledEdge",
        label: i === 0 ? "trigger" : "data flow",
      });
    }

    // Connect True Branch
    const trueNodes = nodes.filter((_, idx) => steps[idx].branch === "true");
    if (trueNodes.length > 0) {
      edges.push({
        id: `edge_${timestamp}_true_0`,
        source: condNode.id,
        target: trueNodes[0].id,
        sourceHandle: "true",
        type: "labeledEdge",
        label: "TRUE",
        data: { conditionBranch: "true" },
      });
      for (let i = 0; i < trueNodes.length - 1; i++) {
        edges.push({
          id: `edge_${timestamp}_true_${i + 1}`,
          source: trueNodes[i].id,
          target: trueNodes[i + 1].id,
          type: "labeledEdge",
          label: "proceed",
        });
      }
    }

    // Connect False Branch
    const falseNodes = nodes.filter((_, idx) => steps[idx].branch === "false");
    if (falseNodes.length > 0) {
      edges.push({
        id: `edge_${timestamp}_false_0`,
        source: condNode.id,
        target: falseNodes[0].id,
        sourceHandle: "false",
        type: "labeledEdge",
        label: "FALSE",
        data: { conditionBranch: "false" },
      });
      for (let i = 0; i < falseNodes.length - 1; i++) {
        edges.push({
          id: `edge_${timestamp}_false_${i + 1}`,
          source: falseNodes[i].id,
          target: falseNodes[i + 1].id,
          type: "labeledEdge",
          label: "fallback",
        });
      }
    }
  } else {
    // Pure sequential flow
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        id: `edge_${timestamp}_${i}`,
        source: nodes[i].id,
        target: nodes[i + 1].id,
        type: "labeledEdge",
        label: i === 0 ? "trigger" : i === nodes.length - 2 ? "finish" : "flow",
      });
    }
  }

  const variables: WebFlowVariable[] = [
    {
      id: `var_${timestamp}_1`,
      name: "workflow_topic",
      type: "string",
      defaultValue: prompt.slice(0, 40),
      description: "Primary keyword or execution parameter",
      required: true,
    },
  ];

  return {
    name,
    description: prompt,
    category,
    nodes,
    edges,
    variables,
    summaryOfChanges: `Generated ${nodes.length}-step ${category} workflow with connected flow channels.`,
  };
}

/**
 * Intelligently refines an existing workflow graph according to user instructions.
 */
function refineExistingWorkflow(
  prompt: string,
  nodes: WebFlowNode[],
  edges: WebFlowEdge[],
  userWebsites: UserSavedSite[],
  timestamp: number
) {
  const updatedNodes = [...nodes];
  const updatedEdges = [...edges];
  const lowerPrompt = prompt.toLowerCase();

  let changeDescription = "Updated workflow";
  const maxX = updatedNodes.length > 0 ? Math.max(...updatedNodes.map((n) => n.position.x || 0)) : 100;
  const lastNode = updatedNodes[updatedNodes.length - 1];

  // 1. Condition / Branch Request
  if (/condition|if|check|validate|branch|filter/i.test(lowerPrompt)) {
    const conditionNodeId = `node_cond_${timestamp}`;
    const newCondNode: WebFlowNode = {
      id: conditionNodeId,
      type: "conditionNode",
      position: { x: maxX + 280, y: 140 },
      data: {
        label: "Validation Condition",
        kind: "condition",
        description: "Evaluate expression before proceeding",
        conditionExpression: "output.success === true",
        status: "ready",
      },
    };
    updatedNodes.push(newCondNode);

    if (lastNode) {
      updatedEdges.push({
        id: `edge_cond_in_${timestamp}`,
        source: lastNode.id,
        target: conditionNodeId,
        type: "labeledEdge",
        label: "check",
      });
    }

    changeDescription = "Added validation condition node to the workflow.";
  }
  // 2. Human Approval Step
  else if (/approval|review|human|check manually|verify/i.test(lowerPrompt)) {
    const reviewNodeId = `node_review_${timestamp}`;
    const newReviewNode: WebFlowNode = {
      id: reviewNodeId,
      type: "actionNode",
      position: { x: maxX + 280, y: 140 },
      data: {
        label: "Human Review",
        kind: "action",
        action: "Approve Output",
        actionDescription: "Inspect data before automated dispatch",
        status: "ready",
      },
    };
    updatedNodes.push(newReviewNode);

    if (lastNode) {
      updatedEdges.push({
        id: `edge_review_${timestamp}`,
        source: lastNode.id,
        target: reviewNodeId,
        type: "labeledEdge",
        label: "review",
      });
    }

    changeDescription = "Added human review and manual approval gate.";
  }
  // 3. AI Step or Website Tool
  else {
    const isAI = /ai|summarize|prompt|gpt|claude|generate|analyze/i.test(lowerPrompt);
    const newStepId = `node_step_${timestamp}`;

    const newNode: WebFlowNode = {
      id: newStepId,
      type: isAI ? "aiNode" : "actionNode",
      position: { x: maxX + 280, y: 140 },
      data: {
        label: isAI ? "AI Reasoning" : "Task Step",
        kind: isAI ? "ai" : "action",
        action: prompt.slice(0, 60),
        actionDescription: prompt,
        instructions: isAI ? prompt : undefined,
        status: "ready",
      },
    };

    updatedNodes.push(newNode);

    if (lastNode) {
      updatedEdges.push({
        id: `edge_new_${timestamp}`,
        source: lastNode.id,
        target: newNode.id,
        type: "labeledEdge",
        label: "flow",
      });
    }

    changeDescription = `Added ${newNode.data.label} step: "${prompt.slice(0, 40)}"`;
  }

  return {
    nodes: updatedNodes,
    edges: updatedEdges,
    summaryOfChanges: changeDescription,
  };
}
