import mongoose, { Schema, Types, type InferSchemaType, type Model } from "mongoose";

const websiteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    folderId: { type: Schema.Types.ObjectId, ref: "Folder", default: null },
    url: { type: String, required: true },
    normalizedUrl: { type: String, required: true },
    domain: { type: String, default: "" },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    faviconUrl: { type: String, default: "" },
    ogImageUrl: { type: String, default: "" },
    tags: [{ type: String, trim: true }],
    notes: { type: String, default: "" },
    customIconUrl: { type: String, default: "" },
    isFavorite: { type: Boolean, default: false },
    isTrashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
    visitCount: { type: Number, default: 0 },
    firstVisitedAt: { type: Date, default: null },
    lastVisitedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

websiteSchema.index({ userId: 1, folderId: 1 });
websiteSchema.index({ userId: 1, isTrashed: 1 });
websiteSchema.index({ userId: 1, createdAt: -1 });
websiteSchema.index({ userId: 1, lastVisitedAt: -1 });
websiteSchema.index(
  { userId: 1, normalizedUrl: 1 },
  {
    unique: true,
    partialFilterExpression: { isTrashed: false },
  },
);
websiteSchema.index({ title: "text", description: "text", domain: "text", tags: "text" });

export type WebsiteDocument = InferSchemaType<typeof websiteSchema> & {
  _id: Types.ObjectId;
};

const Website =
  (mongoose.models.Website as Model<WebsiteDocument>) ||
  mongoose.model<WebsiteDocument>("Website", websiteSchema);

export default Website;
