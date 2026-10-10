"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

export type PaletteCommand = {
  id: string;
  title: string;
  subtitle?: string;
  category: "Actions" | "Insert Nodes" | "View";
  icon: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
};

interface WebFlowCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: PaletteCommand[];
}

export function WebFlowCommandPalette({
  isOpen,
  onClose,
  commands,
}: WebFlowCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = commands.filter((cmd) => {
    const text = `${cmd.title} ${cmd.subtitle || ""} ${cmd.category}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setQuery("");
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          selected.onSelect();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/80 p-4 animate-in fade-in duration-100">
      <div className="relative w-full max-w-xl rounded-2xl border-3 border-nb-border bg-nb-card shadow-nb-xl overflow-hidden flex flex-col">
        {/* Input Bar */}
        <div className="flex items-center gap-3 border-b-2 border-nb-border px-4 py-3 bg-nb-surface">
          <Search className="h-5 w-5 text-nb-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search actions... (⌘K)"
            className="flex-1 bg-transparent text-sm font-bold text-nb-fg focus:outline-none placeholder:text-nb-muted placeholder:font-medium"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-nb-border bg-nb-card px-2 py-0.5 text-[10px] font-mono font-bold text-nb-muted shadow-nb-xs">
            ESC
          </kbd>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-nb-border/20">
          {filteredCommands.length === 0 ? (
            <div className="py-10 text-center text-xs font-bold text-nb-muted">
              No matching commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => {
                    cmd.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-nb-sm"
                      : "text-nb-fg hover:bg-nb-surface-alt"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                        isSelected
                          ? "border-white/30 bg-white/20 text-white"
                          : "border-nb-border/40 bg-nb-card text-nb-fg"
                      }`}
                    >
                      {cmd.icon}
                    </div>
                    <div>
                      <div className="text-xs font-black">{cmd.title}</div>
                      {cmd.subtitle && (
                        <div
                          className={`text-[10px] font-medium ${
                            isSelected ? "text-indigo-200" : "text-nb-muted"
                          }`}
                        >
                          {cmd.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {cmd.shortcut && (
                    <kbd
                      className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                        isSelected
                          ? "bg-white/20 text-white border border-white/30"
                          : "border border-nb-border bg-nb-surface text-nb-muted"
                      }`}
                    >
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-nb-border/40 bg-nb-surface px-4 py-2 text-[10px] text-nb-muted font-mono">
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span className="font-bold text-indigo-500">WebFlow Command Palette</span>
        </div>
      </div>
    </div>
  );
}
