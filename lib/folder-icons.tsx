"use client";

import {
  BookOpen,
  BriefcaseBusiness,
  Folder,
  Globe2,
  Layers3,
  Palette,
  Pin,
  Sparkles,
  SquareCheckBig,
  Users,
  type LucideIcon,
} from "lucide-react";

export type FolderIconOption = {
  value: string;
  label: string;
  Icon: LucideIcon;
};

export const folderIconOptions: FolderIconOption[] = [
  { value: "folder", label: "Folder", Icon: Folder },
  { value: "briefcase", label: "Briefcase", Icon: BriefcaseBusiness },
  { value: "book", label: "Learning", Icon: BookOpen },
  { value: "sparkles", label: "Creative", Icon: Sparkles },
  { value: "palette", label: "Design", Icon: Palette },
  { value: "layers", label: "Stacks", Icon: Layers3 },
  { value: "world", label: "World", Icon: Globe2 },
  { value: "team", label: "Team", Icon: Users },
  { value: "check", label: "Tasks", Icon: SquareCheckBig },
  { value: "pin", label: "Pinned", Icon: Pin },
];

export function getFolderIconOption(value?: string | null) {
  return folderIconOptions.find((option) => option.value === value) ?? folderIconOptions[0];
}

type FolderIconProps = {
  value?: string | null;
  className?: string;
  color?: string;
};

export function FolderIcon({ value, className, color }: FolderIconProps) {
  const option = getFolderIconOption(value);
  const Icon = option.Icon;
  return <Icon className={className} style={color ? { color } : undefined} />;
}

export const folderColorOptions = [
  "#2563eb",
  "#0f766e",
  "#9333ea",
  "#ea580c",
  "#be123c",
  "#16a34a",
  "#0ea5e9",
  "#475569",
  "#f59e0b",
  "#7c3aed",
];
