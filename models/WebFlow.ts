import mongoose, { Schema, Types, type InferSchemaType, type Model } from "mongoose";

const portSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, default: "string" },
    description: { type: String, default: "" },
    defaultValue: { type: String, default: "" },
    required: { type: Boolean, default: false },
  },
  { _id: false },
);

const nodeDataSchema = new Schema(
  {
    label: { type: String, required: true },
    kind: { type: String, required: true },
    description: { type: String, default: "" },

    websiteId: { type: Schema.Types.ObjectId, ref: "Website", default: null },
    websiteUrl: { type: String, default: "" },
    websiteTitle: { type: String, default: "" },
    websiteDomain: { type: String, default: "" },
    websiteFaviconUrl: { type: String, default: "" },

    action: { type: String, default: "" },
    actionDescription: { type: String, default: "" },

    inputs: [portSchema],
    outputs: [portSchema],

    instructions: { type: String, default: "" },
    conditionExpression: { type: String, default: "" },
    delaySeconds: { type: Number, default: 0 },
    noteContent: { type: String, default: "" },

    tags: [{ type: String, trim: true }],
    category: { type: String, default: "" },
    status: { type: String, default: "draft" },
  },
  { _id: false },
);

const nodeSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    data: { type: nodeDataSchema, required: true },
  },
  { _id: false },
);

const edgeSchema = new Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: { type: String, default: null },
    targetHandle: { type: String, default: null },
    label: { type: String, default: "" },
    type: { type: String, default: "default" },
    animated: { type: Boolean, default: false },
    data: {
      conditionBranch: { type: String, default: "default" },
      dataType: { type: String, default: "" },
      description: { type: String, default: "" },
    },
  },
  { _id: false },
);

const variableSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, default: "string" },
    defaultValue: { type: String, default: "" },
    description: { type: String, default: "" },
    required: { type: Boolean, default: false },
  },
  { _id: false },
);

const versionSchema = new Schema(
  {
    versionNumber: { type: Number, required: true },
    savedAt: { type: Date, default: Date.now },
    note: { type: String, default: "" },
    snapshot: {
      nodes: [nodeSchema],
      edges: [edgeSchema],
      variables: [variableSchema],
    },
  },
  { _id: false },
);

const webFlowSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    category: {
      type: String,
      enum: [
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
      ],
      default: "Productivity",
      index: true,
    },
    tags: [{ type: String, trim: true }],
    visibility: {
      type: String,
      enum: ["private", "public", "unlisted"],
      default: "private",
      index: true,
    },
    isTemplate: { type: Boolean, default: false, index: true },
    nodes: { type: [nodeSchema], default: [] },
    edges: { type: [edgeSchema], default: [] },
    variables: { type: [variableSchema], default: [] },
    viewport: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      zoom: { type: Number, default: 1 },
    },
    version: { type: Number, default: 1 },
    versions: { type: [versionSchema], default: [] },
    forkedFromId: { type: Schema.Types.ObjectId, ref: "WebFlow", default: null, index: true },
    forkCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    authorName: { type: String, default: "" },
  },
  { timestamps: true },
);

webFlowSchema.index({ userId: 1, createdAt: -1 });
webFlowSchema.index({ visibility: 1, createdAt: -1 });
webFlowSchema.index({ name: "text", description: "text", tags: "text", category: "text" });

export type WebFlowDocument = InferSchemaType<typeof webFlowSchema> & {
  _id: Types.ObjectId;
};

const WebFlow =
  (mongoose.models.WebFlow as Model<WebFlowDocument>) ||
  mongoose.model<WebFlowDocument>("WebFlow", webFlowSchema);

export default WebFlow;
