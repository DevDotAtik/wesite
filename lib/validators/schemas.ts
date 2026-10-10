import { z } from "zod";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const registerSetup2faSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(128),
});

export const registerConfirm2faSchema = z.object({
  setupToken: z.string().min(10),
  code: z.string().min(6).max(20).optional(),
  skip: z.boolean().optional(),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().max(160).optional(),
  password: z.string().min(8).max(128).optional(),
  setupToken: z.string().optional(),
  code: z.string().optional(),
  skip: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  twoFactorCode: z.string().optional(),
});

export const login2faSchema = z.object({
  tempToken: z.string().min(10),
  code: z.string().min(4).max(30),
  isRecoveryCode: z.boolean().optional(),
});

export const enable2faSchema = z.object({
  secret: z.string().min(16),
  code: z.string().min(6).max(10),
  recoveryCodes: z.array(z.string()).min(1),
});

export const disable2faSchema = z.object({
  password: z.string().optional(),
  code: z.string().optional(),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(10),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16),
  password: z.string().min(8).max(128),
});

export const folderCreateSchema = z.object({
  name: z.string().min(1).max(120),
  parentFolderId: objectIdSchema.nullish(),
  color: z.string().max(32).optional(),
  icon: z.string().max(64).optional(),
});

export const folderPatchSchema = folderCreateSchema.partial().extend({
  order: z.number().optional(),
});

export const websiteCreateSchema = z.object({
  url: z.string().min(1).max(2048),
  folderId: objectIdSchema.nullish(),
  title: z.string().trim().min(1).max(240).optional(),
  description: z.string().trim().max(1000).optional(),
  customIconUrl: z.string().url().or(z.literal("")).optional(),
  tags: z.array(z.string().min(1).max(40)).max(30).optional(),
  isFavorite: z.boolean().optional(),
  notes: z.string().max(5000).optional(),
});

export const websitePatchSchema = z.object({
  url: z.string().min(1).max(2048).optional(),
  folderId: objectIdSchema.nullish(),
  title: z.string().min(1).max(240).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().min(1).max(40)).max(30).optional(),
  notes: z.string().max(5000).optional(),
  customIconUrl: z.string().url().or(z.literal("")).optional(),
  isFavorite: z.boolean().optional(),
  // NOTE: isTrashed is intentionally absent — use the
  // trash / restore / permanent-delete routes instead so
  // trashedAt and duplicate checks stay consistent.
});

export const todoCreateSchema = z.object({
  title: z.string().min(1).max(240),
  notes: z.string().max(3000).optional(),
  websiteId: objectIdSchema.nullish(),
  dueAt: z.string().datetime().nullish(),
});

export const todoPatchSchema = todoCreateSchema.partial().extend({
  completed: z.boolean().optional(),
});

export const metadataFetchSchema = z.object({
  url: z.string().min(1).max(2048),
});

export const profileAvatarSchema = z.string().refine(
  (value) => {
    if (!value) return true;
    if (/^data:image\/(?:png|jpe?g|webp|gif);base64,/.test(value)) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  { message: "Invalid avatar URL" },
);

export const profilePatchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().max(160).optional(),
  avatarUrl: profileAvatarSchema.optional(),
  themePreference: z.enum(["light", "dark", "system"]).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(128).optional(),
});
