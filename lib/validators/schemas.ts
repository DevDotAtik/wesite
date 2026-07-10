import { z } from "zod";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(160),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
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
  isTrashed: z.boolean().optional(),
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

export const profilePatchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().max(160).optional(),
  avatarUrl: z.string().url().or(z.literal("")).optional(),
  themePreference: z.enum(["light", "dark", "system"]).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(128).optional(),
});
