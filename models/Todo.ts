import mongoose, { Schema, Types, type InferSchemaType, type Model } from "mongoose";

const todoSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    websiteId: { type: Schema.Types.ObjectId, ref: "Website", default: null, index: true },
    title: { type: String, required: true, trim: true },
    notes: { type: String, default: "" },
    dueAt: { type: Date, default: null, index: true },
    completedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

todoSchema.index({ userId: 1, completedAt: 1, dueAt: 1, createdAt: -1 });

export type TodoDocument = InferSchemaType<typeof todoSchema> & {
  _id: Types.ObjectId;
};

const Todo = (mongoose.models.Todo as Model<TodoDocument>) || mongoose.model<TodoDocument>("Todo", todoSchema);

export default Todo;
