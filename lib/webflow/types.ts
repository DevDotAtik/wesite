export type WebFlowNodeKind =
  | "website"
  | "action"
  | "start"
  | "end"
  | "input"
  | "output"
  | "condition"
  | "delay"
  | "note"
  | "ai"
  | "transform";

export type WebFlowPort = {
  id: string;
  name: string;
  type?: "string" | "number" | "boolean" | "file" | "json" | "any";
  description?: string;
  defaultValue?: string;
  required?: boolean;
};

export type WebFlowNodeData = {
  label: string;
  kind: WebFlowNodeKind;
  description?: string;
  
  // Website specific properties
  websiteId?: string | null;
  websiteUrl?: string;
  websiteTitle?: string;
  websiteDomain?: string;
  websiteFaviconUrl?: string;
  websiteThumbnailUrl?: string;
  executionState?: "idle" | "running" | "success" | "error";

  // Action definition
  action?: string;
  actionDescription?: string;

  // Inputs, Outputs, Variables
  inputs?: WebFlowPort[];
  outputs?: WebFlowPort[];

  // Natural language instructions for Human / AI Agent
  instructions?: string;
  
  // Logic & branch
  conditionExpression?: string;
  delaySeconds?: number;

  // Canvas Note
  noteContent?: string;

  // Metadata
  tags?: string[];
  category?: string;
  author?: string;
  status?: "draft" | "configured" | "ready";
  [key: string]: unknown;
};

export type WebFlowNode = {
  id: string;
  type: string; // ReactFlow node type: "websiteNode" | "actionNode" | "conditionNode" etc.
  position: { x: number; y: number };
  data: WebFlowNodeData;
};

export type WebFlowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
  type?: string;
  animated?: boolean;
  data?: {
    conditionBranch?: "true" | "false" | "default" | string;
    dataType?: string;
    description?: string;
  };
};

export type WebFlowVariable = {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "file" | "json";
  defaultValue?: string;
  description?: string;
  required?: boolean;
};

export type WebFlowVersion = {
  versionNumber: number;
  savedAt: string;
  note?: string;
  snapshot: {
    nodes: WebFlowNode[];
    edges: WebFlowEdge[];
    variables: WebFlowVariable[];
  };
};

export type WebFlowCategory =
  | "Productivity"
  | "Development"
  | "AI"
  | "Marketing"
  | "Research"
  | "Education"
  | "Job Search"
  | "Design"
  | "Business"
  | "Social Media"
  | "Automation"
  | "Personal"
  | "Other";

export type WebFlowVisibility = "private" | "public" | "unlisted";

export type WebFlowItem = {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  category: WebFlowCategory;
  tags?: string[];
  visibility: WebFlowVisibility;
  isTemplate?: boolean;
  nodes: WebFlowNode[];
  edges: WebFlowEdge[];
  variables?: WebFlowVariable[];
  viewport?: { x: number; y: number; zoom: number };
  version: number;
  versions?: WebFlowVersion[];
  forkedFromId?: string | null;
  forkCount?: number;
  likeCount?: number;
  viewCount?: number;
  authorName?: string;
  createdAt?: string;
  updatedAt?: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
};
