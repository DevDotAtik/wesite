import mongoose, { Schema, Types, type InferSchemaType, type Model } from "mongoose";

const changeLogSchema = new Schema(
  {
    detectedAt: { type: Date, default: Date.now },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    httpStatus: { type: Number, default: 200 },
    contentHash: { type: String, default: "" },
  },
  { _id: false },
);

const monitorSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    websiteId: { type: Schema.Types.ObjectId, ref: "Website", required: true, index: true },
    url: { type: String, required: true },
    title: { type: String, default: "" },
    interval: { type: String, enum: ["hourly", "daily", "weekly"], default: "daily" },
    enabled: { type: Boolean, default: true },
    lastCheckedAt: { type: Date, default: null },
    lastContentHash: { type: String, default: "" },
    lastTitle: { type: String, default: "" },
    lastDescription: { type: String, default: "" },
    changeCount: { type: Number, default: 0 },
    changes: [changeLogSchema],
  },
  { timestamps: true },
);

monitorSchema.index({ userId: 1, websiteId: 1 }, { unique: true });
monitorSchema.index({ userId: 1, enabled: 1, lastCheckedAt: 1 });

export type MonitorDocument = InferSchemaType<typeof monitorSchema> & {
  _id: Types.ObjectId;
};

const Monitor =
  (mongoose.models.Monitor as Model<MonitorDocument>) ||
  mongoose.model<MonitorDocument>("Monitor", monitorSchema);

export default Monitor;
