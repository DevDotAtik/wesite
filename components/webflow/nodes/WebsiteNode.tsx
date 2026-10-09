"use client";

import React, { memo, useState, useMemo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { ExternalLink, Globe, Play, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { WebFlowNodeData } from "@/lib/webflow/types";

export const WebsiteNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WebFlowNodeData;
  const {
    label,
    websiteTitle,
    websiteUrl,
    websiteDomain,
    websiteFaviconUrl,
    websiteThumbnailUrl,
    action,
    actionDescription,
    inputs = [],
    outputs = [],
    instructions,
    status = "ready",
  } = nodeData;

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const displayTitle = websiteTitle || label || websiteDomain || "Website Tool";

  // Derive high-resolution preview screenshot with reliable fallback
  const previewImageUrl = useMemo(() => {
    if (websiteThumbnailUrl && websiteThumbnailUrl.startsWith("http")) {
      return websiteThumbnailUrl;
    }
    if (websiteUrl) {
      const cleanUrl = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
      return `https://s0.wp.com/mshots/v1/${encodeURIComponent(cleanUrl)}?w=800`;
    }
    return null;
  }, [websiteThumbnailUrl, websiteUrl]);

  return (
    <div
      className={`group relative min-w-[280px] max-w-[340px] rounded-2xl border-3 border-nb-border bg-nb-card p-3 shadow-nb-md transition-all duration-200 ${
        selected
          ? "ring-4 ring-indigo-500 shadow-nb-xl -translate-y-1"
          : "hover:border-indigo-500 hover:shadow-nb-lg"
      }`}
    >
      {/* Target input handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!w-3.5 !h-3.5 !border-2 !border-nb-border !bg-indigo-600 !-left-2 transition-transform hover:scale-130 shadow-nb-xs"
      />

      {/* Website Thumbnail Banner (16:9 Aspect Ratio like in Wesite Library) */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-nb-border bg-zinc-950 mb-2.5 shadow-nb-xs">
        {/* Loading skeleton */}
        {!imgLoaded && !imgError && previewImageUrl && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-indigo-950/40 to-zinc-900" />
        )}

        {previewImageUrl && !imgError ? (
          <img
            src={previewImageUrl}
            alt={displayTitle}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-900 p-4 text-center">
            <Globe className="h-8 w-8 text-indigo-400 mb-1 opacity-70" />
            <span className="text-[11px] font-mono font-bold text-indigo-200 truncate max-w-[90%]">
              {websiteDomain || "Web Tool"}
            </span>
          </div>
        )}

        {/* Floating Favicon Badge on Thumbnail */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-lg border-2 border-nb-border bg-nb-card/95 backdrop-blur-md px-2 py-1 shadow-nb-xs">
          {websiteFaviconUrl ? (
            <img
              src={websiteFaviconUrl}
              alt=""
              className="h-4 w-4 rounded object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <Globe className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
          )}
          <span className="text-[10px] font-mono font-bold text-nb-fg truncate max-w-[120px]">
            {websiteDomain || "website"}
          </span>
        </div>

        {/* External Link Quick Button on Thumbnail */}
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg border-2 border-nb-border bg-nb-card/95 backdrop-blur-md text-nb-fg shadow-nb-xs hover:bg-indigo-600 hover:text-white transition-all"
            title={`Open ${websiteUrl}`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Header Info */}
      <div className="flex items-start justify-between gap-2 border-b-2 border-nb-border/30 pb-2">
        <div className="overflow-hidden">
          <h4 className="text-xs font-black tracking-tight text-nb-fg truncate" title={displayTitle}>
            {displayTitle}
          </h4>
          {nodeData.description && (
            <p className="text-[10px] text-nb-muted line-clamp-1 font-medium mt-0.5">
              {nodeData.description}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-md border border-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 text-[9px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
          WEB
        </span>
      </div>

      {/* Action Section */}
      <div className="mt-2.5 rounded-xl border-2 border-nb-border/40 bg-nb-surface-alt/80 p-2.5 shadow-nb-xs">
        <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          <Play className="h-2.5 w-2.5 fill-current" />
          <span>Action</span>
        </div>
        <div className="mt-1 text-xs font-bold text-nb-fg line-clamp-1">
          {action || "Navigate & Interact"}
        </div>
        {actionDescription && (
          <div className="mt-0.5 text-[11px] text-nb-muted line-clamp-2 leading-relaxed">
            {actionDescription}
          </div>
        )}
      </div>

      {/* Inputs / Outputs Badges */}
      {(inputs.length > 0 || outputs.length > 0 || instructions) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px]">
          {inputs.length > 0 && (
            <span className="rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 px-2 py-0.5 font-mono font-bold">
              in: {inputs.length}
            </span>
          )}
          {outputs.length > 0 && (
            <span className="rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 px-2 py-0.5 font-mono font-bold">
              out: {outputs.length}
            </span>
          )}
          {instructions && (
            <span className="rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40 px-2 py-0.5 font-mono font-bold flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> AI Ready
            </span>
          )}
        </div>
      )}

      {/* Node Status Footer */}
      <div className="mt-2.5 flex items-center justify-between text-[10px] text-nb-muted pt-1 border-t border-nb-border/20">
        <span className="font-mono text-[9px] uppercase tracking-wider text-nb-muted">
          Node • {label}
        </span>
        <div className="flex items-center gap-1 font-bold">
          <span
            className={`h-2 w-2 rounded-full ${
              status === "ready"
                ? "bg-emerald-500 animate-pulse"
                : status === "configured"
                ? "bg-amber-500"
                : "bg-slate-400"
            }`}
          />
          <span className="capitalize">{status}</span>
        </div>
      </div>

      {/* Source output handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!w-3.5 !h-3.5 !border-2 !border-nb-border !bg-indigo-600 !-right-2 transition-transform hover:scale-130 shadow-nb-xs"
      />
    </div>
  );
});

WebsiteNode.displayName = "WebsiteNode";
