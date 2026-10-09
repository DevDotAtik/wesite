import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: false, default: null },
    googleId: { type: String, required: false, unique: true, sparse: true },
    authProvider: {
      type: String,
      enum: ["email", "google"],
      default: "email",
    },
    emailVerified: { type: Boolean, default: false },
    avatarUrl: { type: String, default: "" },
    resetTokenHash: { type: String, default: null },
    resetTokenExpiresAt: { type: Date, default: null },
    themePreference: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: null },
    twoFactorRecoveryCodes: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema>;

const User =
  (mongoose.models.User as Model<UserDocument>) ||
  mongoose.model<UserDocument>("User", userSchema);

export default User;
