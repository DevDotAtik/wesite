import mongoose, { Schema, Types, type InferSchemaType, type Model } from "mongoose";

const visitSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    websiteId: { type: Schema.Types.ObjectId, ref: "Website", required: true, index: true },
    visitedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false },
);

visitSchema.index({ websiteId: 1, visitedAt: -1 });
visitSchema.index({ userId: 1, visitedAt: -1 });

export type VisitDocument = InferSchemaType<typeof visitSchema> & {
  _id: Types.ObjectId;
};

const Visit =
  (mongoose.models.Visit as Model<VisitDocument>) ||
  mongoose.model<VisitDocument>("Visit", visitSchema);

export default Visit;
