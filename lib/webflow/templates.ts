import type { WebFlowCategory, WebFlowEdge, WebFlowNode, WebFlowVariable } from "./types";

export type WebFlowTemplate = {
  id: string;
  name: string;
  description: string;
  category: WebFlowCategory;
  tags: string[];
  nodes: WebFlowNode[];
  edges: WebFlowEdge[];
  variables: WebFlowVariable[];
};

export const BUILT_IN_TEMPLATES: WebFlowTemplate[] = [
  {
    id: "github-to-linkedin",
    name: "Create LinkedIn Post From GitHub Project",
    description: "Inspect a GitHub repository, extract project README information, generate an engaging technical post with AI, review, and publish.",
    category: "Social Media",
    tags: ["GitHub", "LinkedIn", "AI", "Marketing", "OpenSource"],
    variables: [
      {
        id: "var_repo_url",
        name: "repo_url",
        type: "string",
        defaultValue: "https://github.com/my-org/my-project",
        description: "Target GitHub repository URL",
        required: true,
      },
      {
        id: "var_tone",
        name: "post_tone",
        type: "string",
        defaultValue: "Insightful & Professional",
        description: "Tone for the social post",
      },
    ],
    nodes: [
      {
        id: "node_1",
        type: "websiteNode",
        position: { x: 50, y: 150 },
        data: {
          label: "GitHub",
          kind: "website",
          websiteUrl: "https://github.com",
          websiteTitle: "GitHub",
          websiteDomain: "github.com",
          action: "Open Repository",
          actionDescription: "Navigate to the project repository using {{repo_url}}.",
          inputs: [{ id: "p1", name: "repo_url", type: "string" }],
          outputs: [{ id: "p2", name: "repo_readme", type: "string" }],
          instructions: "Open repository, read README.md and release notes. Copy key features and problem statement.",
        },
      },
      {
        id: "node_2",
        type: "actionNode",
        position: { x: 340, y: 150 },
        data: {
          label: "Extract Highlights",
          kind: "action",
          action: "Summarize Architecture",
          actionDescription: "Extract bullet points of key technical breakthroughs and benchmarks.",
          inputs: [{ id: "p3", name: "repo_readme", type: "string" }],
          outputs: [{ id: "p4", name: "feature_bullet_points", type: "string" }],
          instructions: "Distill the README down to 3 main problem-solution bullets suitable for a LinkedIn audience.",
        },
      },
      {
        id: "node_3",
        type: "aiNode",
        position: { x: 630, y: 150 },
        data: {
          label: "ChatGPT / Claude",
          kind: "ai",
          websiteUrl: "https://chatgpt.com",
          websiteTitle: "ChatGPT",
          websiteDomain: "chatgpt.com",
          action: "Draft LinkedIn Post",
          actionDescription: "Draft engaging hook, story arc, key findings, and repo link.",
          inputs: [
            { id: "p5", name: "feature_bullet_points", type: "string" },
            { id: "p6", name: "post_tone", type: "string" },
          ],
          outputs: [{ id: "p7", name: "draft_post", type: "string" }],
          instructions: "Write a high-signal developer post. Avoid corporate fluff. Highlight technical architecture and link.",
        },
      },
      {
        id: "node_4",
        type: "conditionNode",
        position: { x: 920, y: 150 },
        data: {
          label: "Human Review",
          kind: "condition",
          action: "Review Quality & Accuracy",
          conditionExpression: "length < 2500 && facts_verified == true",
          instructions: "Check if the technical claims accurately reflect the repository.",
        },
      },
      {
        id: "node_5",
        type: "websiteNode",
        position: { x: 1220, y: 150 },
        data: {
          label: "LinkedIn",
          kind: "website",
          websiteUrl: "https://linkedin.com",
          websiteTitle: "LinkedIn",
          websiteDomain: "linkedin.com",
          action: "Publish Post",
          actionDescription: "Post the approved technical update to LinkedIn feed.",
          inputs: [{ id: "p8", name: "draft_post", type: "string" }],
          instructions: "Paste post into creator box, attach project screenshot or thumbnail, and publish.",
        },
      },
      {
        id: "node_note",
        type: "noteNode",
        position: { x: 630, y: 350 },
        data: {
          label: "Best Practice Note",
          kind: "note",
          noteContent: "Include a demo video or code snippet image to get 3x higher engagement on LinkedIn.",
        },
      },
    ],
    edges: [
      { id: "e1", source: "node_1", target: "node_2", label: "README text" },
      { id: "e2", source: "node_2", target: "node_3", label: "Highlights" },
      { id: "e3", source: "node_3", target: "node_4", label: "Draft Post" },
      {
        id: "e4",
        source: "node_4",
        target: "node_5",
        label: "Approved",
        data: { conditionBranch: "true" },
      },
    ],
  },
  {
    id: "job-application-flow",
    name: "Job Application & Outreach Workflow",
    description: "Search targeted openings on LinkedIn, tailor your resume with AI, upload and track application, then follow up with recruiter.",
    category: "Job Search",
    tags: ["LinkedIn", "Resume", "Jobs", "Career", "Productivity"],
    variables: [
      {
        id: "var_job_title",
        name: "target_title",
        type: "string",
        defaultValue: "Senior Full Stack Engineer",
        description: "Position to apply for",
      },
      {
        id: "var_applicant_name",
        name: "candidate_name",
        type: "string",
        defaultValue: "Developer",
        description: "Your full name",
      },
    ],
    nodes: [
      {
        id: "node_start",
        type: "startNode",
        position: { x: 40, y: 150 },
        data: {
          label: "Start Search",
          kind: "start",
          action: "Initiate Job Hunting Session",
          instructions: "Prepare profile and set up daily application tracker.",
        },
      },
      {
        id: "node_linkedin",
        type: "websiteNode",
        position: { x: 300, y: 150 },
        data: {
          label: "LinkedIn Jobs",
          kind: "website",
          websiteUrl: "https://linkedin.com/jobs",
          websiteTitle: "LinkedIn Jobs",
          websiteDomain: "linkedin.com",
          action: "Find Matching Roles",
          inputs: [{ id: "p1", name: "target_title", type: "string" }],
          outputs: [{ id: "p2", name: "job_description", type: "string" }],
          instructions: "Filter by past 24 hours and Easy Apply / Direct Company. Copy job description.",
        },
      },
      {
        id: "node_ai",
        type: "aiNode",
        position: { x: 600, y: 150 },
        data: {
          label: "AI Resume Tailorer",
          kind: "ai",
          websiteUrl: "https://claude.ai",
          websiteTitle: "Claude AI",
          websiteDomain: "claude.ai",
          action: "Tailor Experience & Cover Letter",
          inputs: [{ id: "p3", name: "job_description", type: "string" }],
          outputs: [{ id: "p4", name: "tailored_resume_pdf", type: "file" }],
          instructions: "Align experience bullet points with target requirements without exaggerating.",
        },
      },
      {
        id: "node_apply",
        type: "actionNode",
        position: { x: 900, y: 150 },
        data: {
          label: "Submit Application",
          kind: "action",
          action: "Upload Resume & Submit",
          inputs: [{ id: "p5", name: "tailored_resume_pdf", type: "file" }],
          instructions: "Fill application forms, upload PDF resume, double check contact info, and submit.",
        },
      },
      {
        id: "node_track",
        type: "websiteNode",
        position: { x: 1200, y: 150 },
        data: {
          label: "Notion / Spreadsheet",
          kind: "website",
          websiteUrl: "https://notion.so",
          websiteTitle: "Notion",
          websiteDomain: "notion.so",
          action: "Log Application",
          instructions: "Record date, company, role, recruiter link, and status in job tracking board.",
        },
      },
    ],
    edges: [
      { id: "e1", source: "node_start", target: "node_linkedin" },
      { id: "e2", source: "node_linkedin", target: "node_ai", label: "Job specs" },
      { id: "e3", source: "node_ai", target: "node_apply", label: "Tailored PDF" },
      { id: "e4", source: "node_apply", target: "node_track", label: "Confirmation" },
    ],
  },
  {
    id: "deep-research-workflow",
    name: "Deep Research & Synthesis Workflow",
    description: "Search literature and web resources, collect authoritative references, summarize findings with AI, and compile a structured report.",
    category: "Research",
    tags: ["Research", "Synthesis", "Documentation", "AI"],
    variables: [
      {
        id: "var_topic",
        name: "research_topic",
        type: "string",
        defaultValue: "Next.js 16 Server Actions Architecture",
        description: "Primary research question",
      },
    ],
    nodes: [
      {
        id: "node_1",
        type: "websiteNode",
        position: { x: 50, y: 150 },
        data: {
          label: "Google Search",
          kind: "website",
          websiteUrl: "https://google.com",
          websiteTitle: "Google",
          websiteDomain: "google.com",
          action: "Find Authoritative Sources",
          inputs: [{ id: "p1", name: "research_topic", type: "string" }],
          outputs: [{ id: "p2", name: "source_links", type: "string" }],
          instructions: "Search official documentation, GitHub discussions, and engineering blogs.",
        },
      },
      {
        id: "node_2",
        type: "actionNode",
        position: { x: 350, y: 150 },
        data: {
          label: "Source Verification",
          kind: "action",
          action: "Validate Credentials & Recency",
          instructions: "Check that articles are published within the last 6 months and written by domain experts.",
        },
      },
      {
        id: "node_3",
        type: "aiNode",
        position: { x: 650, y: 150 },
        data: {
          label: "AI Synthesis Engine",
          kind: "ai",
          websiteUrl: "https://chatgpt.com",
          websiteTitle: "AI Synthesizer",
          websiteDomain: "chatgpt.com",
          action: "Synthesize Findings",
          outputs: [{ id: "p3", name: "executive_summary", type: "string" }],
          instructions: "Synthesize tradeoffs, architectural diagrams, benchmarks, and real-world considerations.",
        },
      },
      {
        id: "node_4",
        type: "websiteNode",
        position: { x: 950, y: 150 },
        data: {
          label: "Google Docs",
          kind: "website",
          websiteUrl: "https://docs.google.com",
          websiteTitle: "Google Docs",
          websiteDomain: "docs.google.com",
          action: "Compile Final Report",
          inputs: [{ id: "p4", name: "executive_summary", type: "string" }],
          instructions: "Format headings, add code snippets, cite all primary sources, and share with team.",
        },
      },
    ],
    edges: [
      { id: "e1", source: "node_1", target: "node_2", label: "Search results" },
      { id: "e2", source: "node_2", target: "node_3", label: "Verified links" },
      { id: "e3", source: "node_3", target: "node_4", label: "Synthesis" },
    ],
  },
];
