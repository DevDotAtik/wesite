"use client";

import React from "react";

interface AIIconProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

/**
 * Custom Futuristic AI Logo Component for WebFlow.
 * Replaces generic Sparkles/Bot icons with a distinctive, high-tech cybernetic neural insignia.
 */
export function AIIcon({ className = "h-4 w-4", size, glow = false }: AIIconProps) {
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 relative ${glow ? "filter drop-shadow-[0_0_8px_rgba(129,140,248,0.6)]" : ""}`}
      style={style}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="wf-ai-gradient-1" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="wf-ai-gradient-core" x1="8" y1="8" x2="16" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Outer Isometric Hexagonal Diamond Frame */}
        <path
          d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          className="opacity-90"
        />

        {/* Neural Vector Interconnects */}
        <path
          d="M12 2V7.5M12 22V16.5M3.34 7L8 10M20.66 7L16 10M3.34 17L8 14M20.66 17L16 14"
          stroke="url(#wf-ai-gradient-1)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Inner Quantum Processing Core (Faceted Rhombus) */}
        <polygon
          points="12,7.5 16,12 12,16.5 8,12"
          fill="url(#wf-ai-gradient-core)"
          stroke="currentColor"
          strokeWidth="1.2"
        />

        {/* Radiant Central Synapse Nexus */}
        <circle cx="12" cy="12" r="1.75" fill="#ffffff" />
      </svg>
    </span>
  );
}

export default AIIcon;
