"use client";

import React, { useState } from "react";
import { X, Keyboard, Search } from "lucide-react";

interface WebFlowShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  label: string;
  category: "Canvas Navigation" | "Edit & History" | "Execution & Tools";
}

const SHORTCUTS: ShortcutItem[] = [
  // Edit & History
  { keys: ["⌘", "Z"], label: "Undo last change", category: "Edit & History" },
  { keys: ["⌘", "⇧", "Z"], label: "Redo change (or ⌘Y)", category: "Edit & History" },
  { keys: ["⌘", "C"], label: "Copy selected node", category: "Edit & History" },
  { keys: ["⌘", "V"], label: "Paste node onto canvas", category: "Edit & History" },
  { keys: ["⌘", "D"], label: "Duplicate selected node", category: "Edit & History" },
  { keys: ["⌫", "Del"], label: "Delete selected node or edge", category: "Edit & History" },
  { keys: ["⌘", "S"], label: "Save workflow snapshot to cloud", category: "Edit & History" },
  { keys: ["Esc"], label: "Deselect node / close popups", category: "Edit & History" },

  // Canvas Navigation
  { keys: ["Space", "Drag"], label: "Pan canvas smoothly", category: "Canvas Navigation" },
  { keys: ["Scroll"], label: "Zoom in / out", category: "Canvas Navigation" },
  { keys: ["⌘", "1"], label: "Fit view to all nodes", category: "Canvas Navigation" },
  { keys: ["⌘", "L"], label: "Auto-layout graph topologically", category: "Canvas Navigation" },
  { keys: ["Right Click"], label: "Open contextual action menu", category: "Canvas Navigation" },

  // Execution & Tools
  { keys: ["⌘", "K"], label: "Open command palette", category: "Execution & Tools" },
  { keys: ["⌘", "J"], label: "Trigger AI Copilot assistant", category: "Execution & Tools" },
  { keys: ["⌘", "/"], label: "Open keyboard shortcuts guide", category: "Execution & Tools" },
];

export function WebFlowShortcutsModal({ isOpen, onClose }: WebFlowShortcutsModalProps) {
  const [query, setQuery] = useState("");

  if (!isOpen) return null;

  const filtered = SHORTCUTS.filter(
    (s) =>
      s.label.toLowerCase().includes(query.toLowerCase()) ||
      s.keys.join(" ").toLowerCase().includes(query.toLowerCase()) ||
      s.category.toLowerCase().includes(query.toLowerCase())
  );

  const categories = ["Edit & History", "Canvas Navigation", "Execution & Tools"] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto animate-in fade-in duration-100">
      <div className="relative flex flex-col w-full max-w-xl rounded-2xl border-3 border-nb-border bg-nb-card shadow-nb-xl overflow-hidden text-nb-fg">
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-nb-border bg-indigo-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-700 font-black shadow-nb-sm border border-nb-border">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-indigo-200">
                Supercharge your workflow creation with instant keyboard hotkeys.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/20 p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b-2 border-nb-border/30 bg-nb-surface-alt">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-nb-muted" />
            <input
              type="text"
              placeholder="Search shortcut by name or key..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border-2 border-nb-border bg-nb-card pl-9 pr-3 py-1.5 text-xs font-bold text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-5 scrollbar-thin">
          {categories.map((cat) => {
            const items = filtered.filter((s) => s.category === cat);
            if (items.length === 0) return null;

            return (
              <div key={cat} className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-nb-muted px-1">
                  {cat}
                </span>
                <div className="rounded-xl border-2 border-nb-border/40 bg-nb-surface divide-y divide-nb-border/20 overflow-hidden">
                  {items.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-2.5 text-xs hover:bg-nb-surface-alt/60 transition-colors"
                    >
                      <span className="font-bold text-nb-fg">{item.label}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((k) => (
                          <kbd
                            key={k}
                            className="rounded-lg border-2 border-nb-border bg-nb-card px-2 py-0.5 text-[11px] font-mono font-black text-nb-fg shadow-nb-xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 border-nb-border bg-nb-surface px-6 py-3 text-xs text-nb-muted">
          <span>Windows / Linux: Use <code className="font-mono font-bold">Ctrl</code> instead of <code className="font-mono font-bold">⌘</code></span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-nb-border bg-nb-card px-4 py-1.5 font-bold text-nb-fg hover:bg-nb-surface-alt transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
