import mongoose, { Schema, Types, type InferSchemaType, type Model } from "mongoose";

const folderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    parentFolderId: { type: Schema.Types.ObjectId, ref: "Folder", default: null },
    color: { type: String, default: "#3b82f6" },
    icon: { type: String, default: "folder" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

folderSchema.index({ userId: 1, parentFolderId: 1 });

export type FolderDocument = InferSchemaType<typeof folderSchema> & {
  _id: Types.ObjectId;
};

const Folder =
  (mongoose.models.Folder as Model<FolderDocument>) ||
  mongoose.model<FolderDocument>("Folder", folderSchema);

export default Folder;
