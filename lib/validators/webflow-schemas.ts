import { z } from "zod";
import { objectIdSchema } from "@/lib/validators/schemas";

export const webflowPortSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  type: z.enum(["string", "number", "boolean", "file", "json", "any"]).optional(),
  description: z.string().max(300).optional(),
  defaultValue: z.string().max(500).optional(),
  required: z.boolean().optional(),
});

export const webflowNodeDataSchema = z.object({
  label: z.string().min(1).max(120),
  kind: z.enum([
    "website",
    "action",
    "start",
    "end",
    "input",
    "output",
    "condition",
    "delay",
    "note",
    "ai",
    "transform",
  ]),
  description: z.string().max(1000).optional(),
  websiteId: objectIdSchema.nullish(),
  websiteUrl: z.string().max(2048).optional(),
  websiteTitle: z.string().max(250).optional(),
  websiteDomain: z.string().max(150).optional(),
  websiteFaviconUrl: z.string().max(2048).optional(),
  websiteThumbnailUrl: z.string().max(2048).optional(),
  action: z.string().max(200).optional(),
  actionDescription: z.string().max(1000).optional(),
  inputs: z.array(webflowPortSchema).optional(),
  outputs: z.array(webflowPortSchema).optional(),
  instructions: z.string().max(5000).optional(),
  conditionExpression: z.string().max(1000).optional(),
  delaySeconds: z.number().min(0).max(86400).optional(),
  noteContent: z.string().max(5000).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  category: z.string().max(60).optional(),
  status: z.enum(["draft", "configured", "ready"]).optional(),
});

export const webflowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: webflowNodeDataSchema,
});

export const webflowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().nullish(),
  targetHandle: z.string().nullish(),
  label: z.string().max(100).optional(),
  type: z.string().optional(),
  animated: z.boolean().optional(),
  data: z
    .object({
      conditionBranch: z.string().optional(),
      dataType: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
});

export const webflowVariableSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  type: z.enum(["string", "number", "boolean", "file", "json"]),
  defaultValue: z.string().max(500).optional(),
  description: z.string().max(300).optional(),
  required: z.boolean().optional(),
});

export const webflowCategorySchema = z.enum([
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
]);

export const webflowCreateSchema = z.object({
  name: z.string().min(1).max(140),
  description: z.string().max(1500).optional(),
  category: webflowCategorySchema.optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  visibility: z.enum(["private", "public", "unlisted"]).optional(),
  isTemplate: z.boolean().optional(),
  nodes: z.array(webflowNodeSchema).optional(),
  edges: z.array(webflowEdgeSchema).optional(),
  variables: z.array(webflowVariableSchema).optional(),
  initialWebsiteId: objectIdSchema.optional(),
});

export const webflowUpdateSchema = z.object({
  name: z.string().min(1).max(140).optional(),
  description: z.string().max(1500).optional(),
  category: webflowCategorySchema.optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  visibility: z.enum(["private", "public", "unlisted"]).optional(),
  isTemplate: z.boolean().optional(),
  nodes: z.array(webflowNodeSchema).optional(),
  edges: z.array(webflowEdgeSchema).optional(),
  variables: z.array(webflowVariableSchema).optional(),
  viewport: z
    .object({
      x: z.number(),
      y: z.number(),
      zoom: z.number(),
    })
    .optional(),
  saveVersionNote: z.string().max(200).optional(),
});

export const webflowAddWebsiteSchema = z.object({
  websiteId: objectIdSchema,
  action: z.string().max(200).optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});
