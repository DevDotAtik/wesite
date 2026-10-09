import mongoose, { Schema, Types, type InferSchemaType, type Model } from "mongoose";

const webFlowInteractionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    webFlowId: { type: Schema.Types.ObjectId, ref: "WebFlow", required: true, index: true },
    type: { type: String, enum: ["like", "bookmark"], required: true },
  },
  { timestamps: true },
);

webFlowInteractionSchema.index({ userId: 1, webFlowId: 1, type: 1 }, { unique: true });

export type WebFlowInteractionDocument = InferSchemaType<typeof webFlowInteractionSchema> & {
  _id: Types.ObjectId;
};

const WebFlowInteraction =
  (mongoose.models.WebFlowInteraction as Model<WebFlowInteractionDocument>) ||
  mongoose.model<WebFlowInteractionDocument>("WebFlowInteraction", webFlowInteractionSchema);

export default WebFlowInteraction;
