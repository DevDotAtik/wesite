export interface CanvasCustomization {
  // Edge / Connection Line
  lineWidth: number; // 1.5, 2.5, 4, 6
  lineColor: string; // "default" | hex
  lineRouting: "smoothstep" | "bezier" | "step" | "straight";
  lineDashed: boolean;
  animatedLines: boolean;

  // Global Node Card Theme
  cardTheme: "default" | "snow" | "obsidian" | "amber" | "indigo" | "emerald";
  nodeBorderWidth: number; // 2, 3, 4
  nodeBorderRadius: "rounded-lg" | "rounded-xl" | "rounded-2xl" | "rounded-none";

  // Canvas Grid
  gridVariant: "dots" | "lines" | "cross" | "none";
  gridGap: number; // 16, 20, 24, 32
  gridColor: string; // "default" | hex
  snapToGrid: boolean;
}

export const DEFAULT_CANVAS_STYLE: CanvasCustomization = {
  lineWidth: 2.5,
  lineColor: "default",
  lineRouting: "smoothstep",
  lineDashed: false,
  animatedLines: false,

  cardTheme: "default",
  nodeBorderWidth: 2,
  nodeBorderRadius: "rounded-xl",

  gridVariant: "dots",
  gridGap: 20,
  gridColor: "default",
  snapToGrid: true,
};

const STORAGE_KEY = "wf_canvas_custom_settings";

export function loadCanvasStyle(): CanvasCustomization {
  if (typeof window === "undefined") return DEFAULT_CANVAS_STYLE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CANVAS_STYLE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CANVAS_STYLE, ...parsed };
  } catch {
    return DEFAULT_CANVAS_STYLE;
  }
}

export function saveCanvasStyle(style: CanvasCustomization): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(style));
  } catch {
    // Ignore storage errors
  }
}
