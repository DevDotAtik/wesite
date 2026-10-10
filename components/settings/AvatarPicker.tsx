"use client";

import { useId, useRef } from "react";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "./types";

type AvatarPickerProps = {
  name: string;
  avatarUrl: string;
  googleAvatarUrl?: string;
  onChange: (dataUrl: string) => void;
  disabled?: boolean;
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

async function compressToDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

  const img = await loadImage(dataUrl);
  const maxSize = 320;
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not supported");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  let output = canvas.toDataURL("image/webp", 0.82);
  if (!output.startsWith("data:image/webp")) {
    output = canvas.toDataURL("image/jpeg", 0.85);
  }
  return output;
}

function AvatarBubble({ src, name, size = "lg" }: { src: string | null; name: string; size?: "sm" | "lg" }) {
  const classes =
    size === "lg" ? "size-24 text-xl rounded-2xl" : "size-10 text-sm rounded-xl";

  return (
    <span
      className={`${classes} grid shrink-0 place-items-center overflow-hidden border-3 font-extrabold`}
      style={{ borderColor: "var(--nb-border)", background: "var(--nb-accent)", color: "var(--nb-accent-fg)", boxShadow: "var(--nb-shadow-sm)" }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}

export default function AvatarPicker({ name, avatarUrl, googleAvatarUrl, onChange, disabled }: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();
  const displaySrc = avatarUrl || googleAvatarUrl || "";

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large (max 5 MB)");
      return;
    }

    try {
      const dataUrl = await compressToDataUrl(file);
      onChange(dataUrl);
      toast.success("Profile photo updated — save your changes to keep it");
    } catch {
      toast.error("Could not process this image");
    }
  }

  const sourceLabel = googleAvatarUrl
    ? avatarUrl
      ? "Custom photo"
      : "Google photo"
    : avatarUrl
      ? "Custom photo"
      : "No photo yet";

  return (
    <div className="flex flex-wrap items-center gap-4">
      <AvatarBubble src={displaySrc} name={name} />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="nb-btn nb-btn-primary nb-btn-sm"
          >
            <ImagePlus className="size-3.5" />
            Upload photo
          </button>
          {googleAvatarUrl ? (
            <button
              type="button"
              disabled={disabled || !avatarUrl}
              onClick={() => onChange("")}
              className="nb-btn nb-btn-surface nb-btn-sm"
              title="Fall back to the photo attached to your Google account"
            >
              <Camera className="size-3.5" />
              Use Google photo
            </button>
          ) : null}
          {avatarUrl ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange("")}
              className="nb-btn nb-btn-surface nb-btn-sm"
            >
              <Trash2 className="size-3.5" />
              Remove
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--nb-muted)" }}>
          {sourceLabel} · square images crop best · max 320px · stored in your account
        </p>
      </div>

      <input
        ref={inputRef}
        id={fileInputId}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </div>
  );
}