import type { NextRequest } from "next/server";
import { apiError, json, parseBody, requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import Website from "@/models/Website";
import type {
  WebFlowNode,
  WebFlowEdge,
  WebFlowVariable,
  WebFlowCategory,
  WebFlowNodeKind,
} from "@/lib/webflow/types";

// Standard web tools library for synthesis when user hasn't saved a specific website yet
const KNOWN_TOOLS: Record<string, { title: string; url: string; domain: string; faviconUrl: string; defaultAction: string }> = {
  google: {
    title: "Google Search",
    url: "https://google.com",
    domain: "google.com",
    faviconUrl: "https://www.google.com/favicon.ico",
    defaultAction: "Search query and inspect top results",
  },
  github: {
    title: "GitHub",
    url: "https://github.com",
    domain: "github.com",
    faviconUrl: "https://github.com/favicon.ico",
    defaultAction: "Inspect repository codebase and pull requests",
  },
  chatgpt: {
    title: "ChatGPT",
    url: "https://chatgpt.com",
    domain: "chatgpt.com",
    faviconUrl: "https://chatgpt.com/favicon.ico",
    defaultAction: "Analyze context and generate structured content",
  },
  claude: {
    title: "Anthropic Claude",
    url: "https://claude.ai",
    domain: "claude.ai",
    faviconUrl: "https://claude.ai/favicon.ico",
    defaultAction: "Synthesize research and draft technical analysis",
  },
  notion: {
    title: "Notion",
    url: "https://notion.so",
    domain: "notion.so",
    faviconUrl: "https://www.notion.so/images/favicon.ico",
    defaultAction: "Create database page and persist notes",
  },
  linkedin: {
    title: "LinkedIn",
    url: "https://linkedin.com",
    domain: "linkedin.com",
    faviconUrl: "https://www.linkedin.com/favicon.ico",
    defaultAction: "Publish technical post and track reach",
  },
  twitter: {
    title: "X / Twitter",
    url: "https://x.com",
    domain: "x.com",
    faviconUrl: "https://abs.twimg.com/favicons/twitter.ico",
    defaultAction: "Publish thread update and engage audience",
  },
  gmail: {
    title: "Gmail",
    url: "https://mail.google.com",
    domain: "mail.google.com",
    faviconUrl: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico",
    defaultAction: "Compose and dispatch message",
  },
  canva: {
    title: "Canva",
    url: "https://canva.com",
    domain: "canva.com",
    faviconUrl: "https://www.canva.com/favicon.ico",
    defaultAction: "Generate visual banner and asset dimensions",
  },
  slack: {
    title: "Slack",
    url: "https://slack.com",
    domain: "slack.com",
    faviconUrl: "https://a.slack-edge.com/80588/marketing/img/meta/favicon-32.png",
    defaultAction: "Post status report to internal channel",
  },
  figma: {
    title: "Figma",
    url: "https://figma.com",
    domain: "figma.com",
    faviconUrl: "https://static.figma.com/app/icon/1/favicon.ico",
    defaultAction: "Review design specifications and copy",
  },
  linear: {
    title: "Linear",
    url: "https://linear.app",
    domain: "linear.app",
    faviconUrl: "https://linear.app/favicon.ico",
    defaultAction: "File bug tracking issue and assign priority",
  },
  drive: {
    title: "Google Drive",
    url: "https://drive.google.com",
    domain: "drive.google.com",
    faviconUrl: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
    defaultAction: "Upload deliverable and export shared asset",
  },
  youtube: {
    title: "YouTube",
    url: "https://youtube.com",
    domain: "youtube.com",
    faviconUrl: "https://www.youtube.com/favicon.ico",
    defaultAction: "Extract video transcript and timestamps",
  },
};

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

    await connectToDatabase();

    // 1. Fetch user's saved websites library to prioritize their real tools
    const userWebsites = await Website.find({ userId: user._id, isTrashed: false })
      .select("_id title url domain faviconUrl ogImageUrl description tags")
      .lean();

    const timestamp = Date.now();

    // 2. Synthesize workflow based on prompt and tools
    if (mode === "refine" && currentNodes.length > 0) {
      // REFINE EXISTING WORKFLOW: add/modify steps based on prompt
      const result = refineExistingWorkflow(prompt, currentNodes, currentEdges, userWebsites, timestamp);
      return json(result);
    } else {
      // CREATE NEW WORKFLOW
      const result = synthesizeNewWorkflow(prompt, userWebsites, timestamp);
      return json(result);
    }
  } catch (err) {
    console.error("POST /api/webflows/ai-generate error:", err);
    return apiError((err as Error).message || "Failed to generate workflow", 500);
  }
}

/**
 * Intelligent semantic generator constructing rich, connected workflows from natural language prompts.
 */
function synthesizeNewWorkflow(
  prompt: string,
  userWebsites: any[],
  timestamp: number
) {
  const lowerPrompt = prompt.toLowerCase();

  // Infer workflow name and category
  let name = "Custom Automated Workflow";
  let description = prompt;
  let category: WebFlowCategory = "Productivity";

  if (/research|paper|arxiv|read|literature|study/i.test(lowerPrompt)) {
    name = "Research & Synthesis Workflow";
    category = "Research";
  } else if (/linkedin|twitter|social|post|script|content|youtube/i.test(lowerPrompt)) {
    name = "Content Creation & Publishing Pipeline";
    category = "Social Media";
  } else if (/github|code|bug|pr|repo|deploy|commit|test/i.test(lowerPrompt)) {
    name = "Codebase & Deployment Pipeline";
    category = "Development";
  } else if (/job|apply|resume|interview|application|career/i.test(lowerPrompt)) {
    name = "Job Application & Outreach Workflow";
    category = "Job Search";
  } else if (/customer|email|outreach|sales|lead|crm/i.test(lowerPrompt)) {
    name = "Outreach & Communication Workflow";
    category = "Marketing";
  }

  // Identify tool steps to sequence
  type StepPlan = {
    kind: WebFlowNodeKind;
    title: string;
    action: string;
    desc: string;
    instructions?: string;
    website?: any;
    inputs?: Array<{ id: string; name: string; type: string }>;
    outputs?: Array<{ id: string; name: string; type: string }>;
    conditionExpr?: string;
  };

  const steps: StepPlan[] = [];

  // Start with explicit Start trigger
  steps.push({
    kind: "start",
    title: "Workflow Start",
    action: "Trigger Execution",
    desc: "Manual or scheduled workflow initialization",
    outputs: [{ id: "p0", name: "trigger_payload", type: "any" }],
  });

  // Match tools from user's library first, or fallback to known tools
  const findTool = (keywords: string[]) => {
    // 1. Try finding in user's saved library
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
          thumbnailUrl: match.ogImageUrl || `https://s0.wp.com/mshots/v1/${encodeURIComponent(match.url.startsWith("http") ? match.url : "https://" + match.url)}?w=800`,
          defaultAction: "Open tool and interact",
        };
      }
    }

    // 2. Fallback to standard web tool
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

  // Build sequential steps based on domain
  if (/research|paper|arxiv|study/i.test(lowerPrompt)) {
    const searchTool = findTool(["google", "notion"]);
    steps.push({
      kind: "website",
      title: searchTool?.title || "Search Engine",
      action: "Search Topic & Query Papers",
      desc: "Gather authoritative articles, papers, and references",
      website: searchTool,
      inputs: [{ id: "i1", name: "research_topic", type: "string" }],
      outputs: [{ id: "o1", name: "source_urls", type: "file" }],
    });

    steps.push({
      kind: "ai",
      title: "AI Synthesis",
      action: "Summarize & Extract Findings",
      desc: "Distill key takeaways, citations, and core arguments",
      instructions: "Extract thesis, key insights, data points, and notable quotes from the sources.",
      inputs: [{ id: "i2", name: "source_content", type: "string" }],
      outputs: [{ id: "o2", name: "distilled_summary", type: "string" }],
    });

    const docTool = findTool(["notion", "drive"]);
    steps.push({
      kind: "website",
      title: docTool?.title || "Knowledge Base",
      action: "Save Document",
      desc: "Store structured research notes and references",
      website: docTool,
      inputs: [{ id: "i3", name: "summary_content", type: "string" }],
      outputs: [{ id: "o3", name: "doc_url", type: "string" }],
    });
  } else if (/linkedin|twitter|social|post|youtube/i.test(lowerPrompt)) {
    if (/youtube|video/i.test(lowerPrompt)) {
      const ytTool = findTool(["youtube"]);
      steps.push({
        kind: "website",
        title: ytTool?.title || "YouTube",
        action: "Extract Video Transcript",
        desc: "Pull subtitles and chapter timestamps",
        website: ytTool,
        inputs: [{ id: "i1", name: "video_url", type: "string" }],
        outputs: [{ id: "o1", name: "raw_transcript", type: "string" }],
      });
    }

    steps.push({
      kind: "ai",
      title: "AI Post Drafting",
      action: "Generate Engaging Draft",
      desc: "Transform insights into a structured technical post with hook and CTA",
      instructions: "Draft an engaging post. Include punchy opening hook, 3 key takeaways, and discussion question.",
      inputs: [{ id: "i2", name: "source_notes", type: "string" }],
      outputs: [{ id: "o2", name: "post_draft", type: "string" }],
    });

    steps.push({
      kind: "action",
      title: "Editorial Review",
      action: "Review & Quality Check",
      desc: "Verify tone, fact-check details, and approve draft",
      inputs: [{ id: "i3", name: "draft_content", type: "string" }],
      outputs: [{ id: "o3", name: "approved_content", type: "string" }],
    });

    const pubTool = findTool(["linkedin", "twitter"]);
    steps.push({
      kind: "website",
      title: pubTool?.title || "Social Platform",
      action: "Publish Post",
      desc: "Post final copy to network",
      website: pubTool,
      inputs: [{ id: "i4", name: "final_text", type: "string" }],
      outputs: [{ id: "o4", name: "published_url", type: "string" }],
    });
  } else if (/github|code|pr|bug|deploy/i.test(lowerPrompt)) {
    const gitTool = findTool(["github"]);
    steps.push({
      kind: "website",
      title: gitTool?.title || "GitHub",
      action: "Fetch Issue or PR",
      desc: "Retrieve repository diff and issue context",
      website: gitTool,
      inputs: [{ id: "i1", name: "issue_url", type: "string" }],
      outputs: [{ id: "o1", name: "diff_payload", type: "string" }],
    });

    steps.push({
      kind: "ai",
      title: "AI Code Analysis",
      action: "Analyze Root Cause",
      desc: "Run diagnosis, summarize changes, and propose test cases",
      instructions: "Inspect the diff. Check for potential regressions, security bugs, and performance impacts.",
      inputs: [{ id: "i2", name: "diff_payload", type: "string" }],
      outputs: [{ id: "o2", name: "triage_report", type: "string" }],
    });

    const notifTool = findTool(["slack", "linear"]);
    steps.push({
      kind: "website",
      title: notifTool?.title || "Team Channel",
      action: "Post Triage Report",
      desc: "Notify engineering team with triage findings",
      website: notifTool,
      inputs: [{ id: "i3", name: "report_content", type: "string" }],
      outputs: [{ id: "o3", name: "ticket_id", type: "string" }],
    });
  } else {
    // General 4-step pipeline: Input -> Tool A -> AI Processing -> Output
    const toolA = findTool(["google", "notion", "github", "drive"]) || KNOWN_TOOLS.google;
    steps.push({
      kind: "website",
      title: toolA.title,
      action: toolA.defaultAction,
      desc: `Gather initial information using ${toolA.title}`,
      website: toolA,
      inputs: [{ id: "i1", name: "input_query", type: "string" }],
      outputs: [{ id: "o1", name: "extracted_data", type: "any" }],
    });

    steps.push({
      kind: "ai",
      title: "AI Processing",
      action: "Process & Transform",
      desc: "Analyze inputs and structure data according to task requirements",
      instructions: prompt,
      inputs: [{ id: "i2", name: "raw_data", type: "any" }],
      outputs: [{ id: "o2", name: "processed_result", type: "any" }],
    });

    const toolB = findTool(["linkedin", "notion", "gmail", "slack"]) || KNOWN_TOOLS.notion;
    steps.push({
      kind: "website",
      title: toolB.title,
      action: toolB.defaultAction,
      desc: `Save or distribute final outcome via ${toolB.title}`,
      website: toolB,
      inputs: [{ id: "i3", name: "final_payload", type: "any" }],
      outputs: [{ id: "o3", name: "completion_status", type: "string" }],
    });
  }

  // End milestone
  steps.push({
    kind: "end",
    title: "Workflow Complete",
    action: "Final Output",
    desc: "Workflow successfully executed",
    inputs: [{ id: "i_end", name: "final_status", type: "string" }],
  });

  // Construct React Flow Nodes with clean coordinates
  const nodes: WebFlowNode[] = steps.map((step, idx) => {
    const nodeId = `node_${timestamp}_${idx}`;
    const x = 80 + idx * 340;
    const y = 140;

    const data: any = {
      label: step.title,
      kind: step.kind,
      description: step.desc,
      action: step.action,
      inputs: step.inputs || [],
      outputs: step.outputs || [],
      status: "ready",
    };

    if (step.instructions) data.instructions = step.instructions;

    if (step.website) {
      data.websiteId = step.website.websiteId;
      data.websiteTitle = step.website.title;
      data.websiteUrl = step.website.url;
      data.websiteDomain = step.website.domain;
      data.websiteFaviconUrl = step.website.faviconUrl;
      data.websiteThumbnailUrl = step.website.thumbnailUrl;
    }

    return {
      id: nodeId,
      type: `${step.kind}Node`,
      position: { x, y },
      data,
    };
  });

  // Construct sequential edges
  const edges: WebFlowEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const sourceNode = nodes[i];
    const targetNode = nodes[i + 1];
    edges.push({
      id: `edge_${timestamp}_${i}`,
      source: sourceNode.id,
      target: targetNode.id,
      type: "labeled",
      label: i === 0 ? "start" : i === nodes.length - 2 ? "finish" : "data flow",
      data: {},
    });
  }

  const variables: WebFlowVariable[] = [
    {
      id: `var_${timestamp}_1`,
      name: "task_topic",
      type: "string",
      defaultValue: prompt.slice(0, 40),
      description: "Primary topic or URL for execution",
      required: true,
    },
  ];

  return {
    name,
    description,
    category,
    nodes,
    edges,
    variables,
    summaryOfChanges: `Created workflow with ${nodes.length} connected steps using saved library tools.`,
  };
}

/**
 * Intelligently refines an existing workflow graph according to user instructions.
 */
function refineExistingWorkflow(
  prompt: string,
  nodes: WebFlowNode[],
  edges: WebFlowEdge[],
  userWebsites: any[],
  timestamp: number
) {
  const updatedNodes = [...nodes];
  const updatedEdges = [...edges];
  const lowerPrompt = prompt.toLowerCase();

  let changeDescription = "Updated workflow";

  // Check if user wants to add a condition / branch
  if (/condition|if|check|validate|branch|filter/i.test(lowerPrompt)) {
    const conditionNodeId = `node_cond_${timestamp}`;
    const maxX = Math.max(...updatedNodes.map((n) => n.position.x || 0));
    const midNode = updatedNodes[Math.floor(updatedNodes.length / 2)] || updatedNodes[0];

    const newCondNode: WebFlowNode = {
      id: conditionNodeId,
      type: "conditionNode",
      position: { x: midNode.position.x + 150, y: midNode.position.y + 120 },
      data: {
        label: "Validation Rule",
        kind: "condition",
        description: "Evaluate conditional criteria before proceeding",
        conditionExpression: "output.valid === true",
        status: "ready",
      },
    };

    updatedNodes.push(newCondNode);

    // Wire to condition node
    updatedEdges.push({
      id: `edge_cond_true_${timestamp}`,
      source: conditionNodeId,
      target: updatedNodes[updatedNodes.length - 2]?.id || conditionNodeId,
      sourceHandle: "true",
      type: "labeled",
      label: "TRUE",
      data: { conditionBranch: "true" },
    });

    changeDescription = "Added validation condition node and branch path.";
  }
  // Check if user wants to add human approval / review step
  else if (/approval|review|human|check manually|verify/i.test(lowerPrompt)) {
    const reviewNodeId = `node_review_${timestamp}`;
    const lastNode = updatedNodes[updatedNodes.length - 1];

    const newReviewNode: WebFlowNode = {
      id: reviewNodeId,
      type: "actionNode",
      position: { x: (lastNode?.position?.x || 300) - 150, y: (lastNode?.position?.y || 150) + 80 },
      data: {
        label: "Human Review",
        kind: "action",
        action: "Approve Output",
        actionDescription: "Review generated output before dispatch",
        status: "ready",
      },
    };

    updatedNodes.push(newReviewNode);
    changeDescription = "Added manual human approval step to workflow.";
  }
  // Default: Add requested tool or AI step
  else {
    const newActionId = `node_step_${timestamp}`;
    const maxX = Math.max(...updatedNodes.map((n) => n.position.x || 0));

    const isAI = /ai|summarize|prompt|gpt|claude|generate/i.test(lowerPrompt);
    const newNode: WebFlowNode = {
      id: newActionId,
      type: isAI ? "aiNode" : "actionNode",
      position: { x: maxX + 280, y: 140 },
      data: {
        label: isAI ? "AI Step" : "Task Step",
        kind: isAI ? "ai" : "action",
        action: prompt.slice(0, 60),
        actionDescription: prompt,
        instructions: isAI ? prompt : undefined,
        status: "ready",
      },
    };

    updatedNodes.push(newNode);

    if (updatedNodes.length > 1) {
      const prevNode = updatedNodes[updatedNodes.length - 2];
      updatedEdges.push({
        id: `edge_${timestamp}`,
        source: prevNode.id,
        target: newNode.id,
        type: "labeled",
        label: "flow",
        data: {},
      });
    }

    changeDescription = `Added ${newNode.data.label} step according to prompt.`;
  }

  return {
    nodes: updatedNodes,
    edges: updatedEdges,
    summaryOfChanges: changeDescription,
  };
}
