"use client";

import React, { useState } from "react";
import {
  X,
  Sliders,
  Palette,
  RotateCcw,
  Check,
  Spline,
  Grid,
  Sparkles,
} from "lucide-react";
import {
  CanvasCustomization,
  DEFAULT_CANVAS_STYLE,
  saveCanvasStyle,
} from "@/lib/webflow/canvasStyle";

interface WebFlowCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  styleSettings: CanvasCustomization;
  onUpdateStyle: (newStyle: CanvasCustomization) => void;
}

const LINE_COLOR_PRESETS = [
  { label: "Theme Auto", value: "default", bg: "#1e293b" },
  { label: "Indigo", value: "#6366f1", bg: "#6366f1" },
  { label: "Emerald", value: "#10b981", bg: "#10b981" },
  { label: "Amber", value: "#f59e0b", bg: "#f59e0b" },
  { label: "Rose", value: "#ef4444", bg: "#ef4444" },
  { label: "Purple", value: "#8b5cf6", bg: "#8b5cf6" },
  { label: "Cyan", value: "#06b6d4", bg: "#06b6d4" },
  { label: "Orange", value: "#f97316", bg: "#f97316" },
];

const CARD_THEME_PRESETS = [
  { id: "default", name: "Default Solid", desc: "Clean Neo-Brutalist card" },
  { id: "snow", name: "Chalk Snow", desc: "Pure high-contrast white" },
  { id: "obsidian", name: "Obsidian", desc: "Deep charcoal / dark finish" },
  { id: "amber", name: "Warm Amber", desc: "Soft warm yellow surface" },
  { id: "indigo", name: "Electric Indigo", desc: "Soft tech indigo tint" },
  { id: "emerald", name: "Mint Emerald", desc: "Fresh sage green tint" },
] as const;

export function WebFlowCustomizerModal({
  isOpen,
  onClose,
  styleSettings,
  onUpdateStyle,
}: WebFlowCustomizerModalProps) {
  const [localStyle, setLocalStyle] = useState<CanvasCustomization>(styleSettings);

  if (!isOpen) return null;

  const handleChange = (partial: Partial<CanvasCustomization>) => {
    const updated = { ...localStyle, ...partial };
    setLocalStyle(updated);
    onUpdateStyle(updated);
    saveCanvasStyle(updated);
  };

  const handleReset = () => {
    setLocalStyle(DEFAULT_CANVAS_STYLE);
    onUpdateStyle(DEFAULT_CANVAS_STYLE);
    saveCanvasStyle(DEFAULT_CANVAS_STYLE);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto animate-in fade-in duration-100">
      <div className="relative flex flex-col w-full max-w-2xl rounded-2xl border-3 border-nb-border bg-nb-card shadow-nb-xl overflow-hidden my-6">
        {/* Header - Solid Opaque */}
        <div className="flex items-center justify-between border-b-3 border-nb-border bg-amber-400 px-6 py-4 text-black">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-amber-400 font-black shadow-nb-sm border-2 border-black">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-black flex items-center gap-2">
                Canvas & UI Customization
              </h2>
              <p className="text-xs text-black/80 font-bold">
                Tailor connection lines, card backgrounds, and canvas grid density
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 rounded-xl border-2 border-black bg-white px-2.5 py-1.5 text-xs font-black text-black shadow-nb-xs hover:bg-neutral-100 transition-colors"
              title="Reset all settings to default"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-black bg-white p-1.5 text-black hover:bg-neutral-100 shadow-nb-xs transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-nb-card divide-y-2 divide-nb-border/30">
          {/* SECTION 1: Connection Line Customization */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-nb-fg">
              <Spline className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Connection Line Appearance</span>
            </div>

            {/* Line Width */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-nb-fg flex items-center justify-between">
                <span>Line Width</span>
                <span className="font-mono text-[11px] text-nb-muted">{localStyle.lineWidth}px</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Thin (1.5px)", val: 1.5 },
                  { label: "Normal (2.5px)", val: 2.5 },
                  { label: "Thick (4px)", val: 4 },
                  { label: "Ultra (6px)", val: 6 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => handleChange({ lineWidth: item.val })}
                    className={`rounded-xl border-2 p-2 text-xs font-black transition-all ${
                      localStyle.lineWidth === item.val
                        ? "border-nb-border bg-indigo-600 text-white shadow-nb-xs"
                        : "border-nb-border/40 bg-nb-surface text-nb-fg hover:border-nb-border"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Color */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-nb-fg flex items-center justify-between">
                <span>Line Color</span>
                <span className="font-mono text-[11px] text-nb-muted">
                  {localStyle.lineColor === "default" ? "Theme Contrast" : localStyle.lineColor}
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {LINE_COLOR_PRESETS.map((color) => {
                  const isSelected = localStyle.lineColor === color.value;
                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleChange({ lineColor: color.value })}
                      className={`flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 text-xs font-black transition-all ${
                        isSelected
                          ? "border-nb-border bg-nb-surface-strong shadow-nb-xs ring-2 ring-indigo-500"
                          : "border-nb-border/40 bg-nb-surface text-nb-fg hover:border-nb-border"
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-black/30 shrink-0"
                        style={{ backgroundColor: color.bg }}
                      />
                      <span>{color.label}</span>
                      {isSelected && <Check className="h-3 w-3 text-indigo-500" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Line Routing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-nb-fg">Routing Geometry</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "smoothstep", label: "Smooth Step" },
                    { id: "bezier", label: "Curved Bezier" },
                    { id: "step", label: "Crisp Step" },
                    { id: "straight", label: "Straight Line" },
                  ].map((route) => (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() =>
                        handleChange({
                          lineRouting: route.id as CanvasCustomization["lineRouting"],
                        })
                      }
                      className={`rounded-xl border-2 p-2 text-xs font-black text-center transition-all ${
                        localStyle.lineRouting === route.id
                          ? "border-nb-border bg-indigo-600 text-white shadow-nb-xs"
                          : "border-nb-border/40 bg-nb-surface text-nb-fg hover:border-nb-border"
                      }`}
                    >
                      {route.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stroke Pattern & Flow */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-nb-fg">Stroke Style & Motion</label>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange({ lineDashed: !localStyle.lineDashed })}
                    className={`flex items-center justify-between rounded-xl border-2 p-2 text-xs font-bold transition-all ${
                      localStyle.lineDashed
                        ? "border-nb-border bg-amber-400 text-black shadow-nb-xs"
                        : "border-nb-border/40 bg-nb-surface text-nb-fg"
                    }`}
                  >
                    <span>Dashed Line Pattern</span>
                    <span className="font-mono text-[10px]">
                      {localStyle.lineDashed ? "DASHED" : "SOLID"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange({ animatedLines: !localStyle.animatedLines })}
                    className={`flex items-center justify-between rounded-xl border-2 p-2 text-xs font-bold transition-all ${
                      localStyle.animatedLines
                        ? "border-nb-border bg-emerald-500 text-white shadow-nb-xs"
                        : "border-nb-border/40 bg-nb-surface text-nb-fg"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Animated Flow Lines</span>
                    </span>
                    <span className="font-mono text-[10px]">
                      {localStyle.animatedLines ? "ACTIVE" : "OFF"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Global Card & Node Theming */}
          <div className="space-y-4 pt-5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-nb-fg">
              <Palette className="h-4 w-4 text-amber-500" />
              <span>Node Card Theme & Structure</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {CARD_THEME_PRESETS.map((theme) => {
                const isSelected = localStyle.cardTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() =>
                      handleChange({
                        cardTheme: theme.id as CanvasCustomization["cardTheme"],
                      })
                    }
                    className={`flex flex-col text-left p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-black shadow-nb-xs"
                        : "border-nb-border/40 bg-nb-surface text-nb-fg hover:border-nb-border"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-black">
                      <span>{theme.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                    </div>
                    <span className="text-[10px] text-nb-muted font-normal mt-0.5">
                      {theme.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Corner Radius & Border Width */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-nb-fg">Card Corner Radius</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "rounded-none", label: "Square" },
                    { id: "rounded-lg", label: "Subtle" },
                    { id: "rounded-xl", label: "Modern" },
                    { id: "rounded-2xl", label: "Pill" },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() =>
                        handleChange({
                          nodeBorderRadius: r.id as CanvasCustomization["nodeBorderRadius"],
                        })
                      }
                      className={`rounded-xl border-2 py-1.5 text-[11px] font-black text-center transition-all ${
                        localStyle.nodeBorderRadius === r.id
                          ? "border-nb-border bg-indigo-600 text-white shadow-nb-xs"
                          : "border-nb-border/40 bg-nb-surface text-nb-fg"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-nb-fg">Card Border Stroke</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: 2, label: "2px Clean" },
                    { val: 3, label: "3px Bold" },
                    { val: 4, label: "4px Heavy" },
                  ].map((b) => (
                    <button
                      key={b.val}
                      type="button"
                      onClick={() => handleChange({ nodeBorderWidth: b.val })}
                      className={`rounded-xl border-2 py-1.5 text-[11px] font-black text-center transition-all ${
                        localStyle.nodeBorderWidth === b.val
                          ? "border-nb-border bg-indigo-600 text-white shadow-nb-xs"
                          : "border-nb-border/40 bg-nb-surface text-nb-fg"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Canvas Grid & Snapping */}
          <div className="space-y-4 pt-5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-nb-fg">
              <Grid className="h-4 w-4 text-emerald-500" />
              <span>Canvas Grid & Navigation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-nb-fg">Grid Background Style</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "dots", label: "Dots" },
                    { id: "lines", label: "Lines" },
                    { id: "cross", label: "Cross" },
                    { id: "none", label: "None" },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() =>
                        handleChange({
                          gridVariant: g.id as CanvasCustomization["gridVariant"],
                        })
                      }
                      className={`rounded-xl border-2 py-1.5 text-xs font-black text-center transition-all ${
                        localStyle.gridVariant === g.id
                          ? "border-nb-border bg-indigo-600 text-white shadow-nb-xs"
                          : "border-nb-border/40 bg-nb-surface text-nb-fg"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-nb-fg">Grid Spacing</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { val: 16, label: "16px" },
                    { val: 20, label: "20px" },
                    { val: 28, label: "28px" },
                    { val: 36, label: "36px" },
                  ].map((gap) => (
                    <button
                      key={gap.val}
                      type="button"
                      onClick={() => handleChange({ gridGap: gap.val })}
                      className={`rounded-xl border-2 py-1.5 text-xs font-black text-center transition-all ${
                        localStyle.gridGap === gap.val
                          ? "border-nb-border bg-indigo-600 text-white shadow-nb-xs"
                          : "border-nb-border/40 bg-nb-surface text-nb-fg"
                      }`}
                    >
                      {gap.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t-3 border-nb-border bg-nb-surface px-6 py-4">
          <div className="text-[11px] font-mono text-nb-muted">
            Preferences auto-saved to browser
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-nb-border bg-indigo-600 px-5 py-2 text-xs font-black text-white shadow-nb-sm hover:bg-indigo-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
