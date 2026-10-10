"use client";

import React, { useState } from "react";
import {
  X,
  Trash2,
  Plus,
  Sparkles,
  Globe,
  ExternalLink,
  Variable,
  Layers,
} from "lucide-react";
import type {
  WebFlowNode,
  WebFlowNodeData,
  WebFlowPort,
  WebFlowVariable,
  WebFlowCategory,
} from "@/lib/webflow/types";

interface NodeInspectorProps {
  selectedNode: WebFlowNode | null;
  onUpdateNodeData: (nodeId: string, partialData: Partial<WebFlowNodeData>) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
  // Workflow-level props when no node selected
  workflowName: string;
  workflowDescription: string;
  workflowCategory: WebFlowCategory;
  workflowVariables: WebFlowVariable[];
  onUpdateWorkflowMeta: (updates: {
    name?: string;
    description?: string;
    category?: WebFlowCategory;
  }) => void;
  onUpdateVariables: (variables: WebFlowVariable[]) => void;
}

const CATEGORIES: WebFlowCategory[] = [
  "Productivity",
  "Development",
  "AI",
  "Marketing",
  "Research",
  "Education",
  "Job Search",
  "Design",
  "Business",
  "Social Media",
  "Automation",
  "Personal",
  "Other",
];

export function NodeInspector({
  selectedNode,
  onUpdateNodeData,
  onDeleteNode,
  onClose,
  workflowName,
  workflowDescription,
  workflowCategory,
  workflowVariables,
  onUpdateWorkflowMeta,
  onUpdateVariables,
}: NodeInspectorProps) {
  const [activeTab, setActiveTab] = useState<"general" | "action" | "ports" | "instructions" | "style">("general");

  // New variable form state for workflow variables
  const [newVarName, setNewVarName] = useState("");
  const [newVarType, setNewVarType] = useState<"string" | "number" | "boolean" | "file" | "json">("string");
  const [newVarDefault, setNewVarDefault] = useState("");
  const [newVarDesc, setNewVarDesc] = useState("");

  // New port states
  const [newPortName, setNewPortName] = useState("");
  const [newPortType, setNewPortType] = useState<"string" | "number" | "boolean" | "file" | "json" | "any">("string");
  const [portTarget, setPortTarget] = useState<"input" | "output">("input");

  // --- No node selected: Canvas / Workflow Inspector ---
  if (!selectedNode) {
    const handleAddVariable = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newVarName.trim()) return;
      const cleanName = newVarName.trim().replace(/[^a-zA-Z0-9_]/g, "");
      const newVar: WebFlowVariable = {
        id: `var_${Date.now()}`,
        name: cleanName,
        type: newVarType,
        defaultValue: newVarDefault,
        description: newVarDesc,
      };
      onUpdateVariables([...workflowVariables, newVar]);
      setNewVarName("");
      setNewVarDefault("");
      setNewVarDesc("");
    };

    const handleRemoveVariable = (varId: string) => {
      onUpdateVariables(workflowVariables.filter((v) => v.id !== varId));
    };

    return (
      <aside className="w-80 md:w-96 flex flex-col border-l-3 border-nb-border bg-nb-card shadow-nb-lg h-full overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-nb-border p-4 bg-nb-surface-alt">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-nb-sm">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-black tracking-tight text-nb-fg uppercase">
                Workflow Properties
              </h3>
              <p className="text-[10px] text-nb-muted">Canvas settings & global variables</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-nb-muted hover:text-nb-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* General Metadata */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-nb-muted uppercase tracking-wider mb-1">
                Workflow Title
              </label>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => onUpdateWorkflowMeta({ name: e.target.value })}
                className="w-full rounded-lg border-2 border-nb-border bg-nb-card px-3 py-1.5 text-xs font-bold text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-nb-muted uppercase tracking-wider mb-1">
                Description & Purpose
              </label>
              <textarea
                rows={3}
                value={workflowDescription}
                onChange={(e) => onUpdateWorkflowMeta({ description: e.target.value })}
                placeholder="What does this workflow achieve?"
                className="w-full rounded-lg border-2 border-nb-border bg-nb-card px-3 py-1.5 text-xs text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-nb-muted uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={workflowCategory}
                onChange={(e) => onUpdateWorkflowMeta({ category: e.target.value as WebFlowCategory })}
                className="w-full rounded-lg border-2 border-nb-border bg-nb-card dark:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-nb-fg dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-nb-border/30" />

          {/* Workflow Global Variables */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-nb-fg uppercase tracking-wider">
                <Variable className="h-3.5 w-3.5 text-indigo-500" />
                <span>Workflow Variables ({workflowVariables.length})</span>
              </div>
            </div>
            <p className="text-[11px] text-nb-muted">
              Reference variables across nodes using mustache syntax: <code className="font-mono text-indigo-600 dark:text-indigo-400">{"{{varName}}"}</code>
            </p>

            {/* Existing Variables List */}
            <div className="space-y-1.5">
              {workflowVariables.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-lg border border-nb-border/40 bg-nb-surface-alt p-2 text-xs"
                >
                  <div className="overflow-hidden">
                    <div className="font-mono font-bold text-nb-fg truncate">
                      {"{{"}{v.name}{"}}"}
                    </div>
                    <div className="text-[10px] text-nb-muted">
                      type: <span className="font-mono">{v.type}</span> {v.defaultValue && `• default: "${v.defaultValue}"`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariable(v.id)}
                    className="p-1 text-nb-muted hover:text-rose-500"
                    title="Remove variable"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Variable Form */}
            <form onSubmit={handleAddVariable} className="rounded-xl border-2 border-nb-border bg-nb-surface-alt p-3 space-y-2">
              <span className="text-[11px] font-bold text-nb-fg block">Add Variable</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="variableName"
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  className="rounded-lg border border-nb-border bg-nb-card px-2 py-1 text-xs font-mono font-bold"
                />
                <select
                  value={newVarType}
                  onChange={(e) => setNewVarType(e.target.value as WebFlowVariable["type"])}
                  className="rounded-lg border border-nb-border bg-nb-card dark:bg-zinc-900 px-2 py-1 text-xs text-nb-fg dark:text-zinc-100 cursor-pointer"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="file">file</option>
                  <option value="json">json</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Default value (optional)"
                value={newVarDefault}
                onChange={(e) => setNewVarDefault(e.target.value)}
                className="w-full rounded-lg border border-nb-border bg-nb-card px-2 py-1 text-xs"
              />
              <button
                type="submit"
                disabled={!newVarName.trim()}
                className="w-full flex items-center justify-center gap-1 rounded-lg border-2 border-nb-border bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-nb-sm disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Variable
              </button>
            </form>
          </div>
        </div>
      </aside>
    );
  }

  // --- Node Selected: Node Inspector ---
  const nodeData = selectedNode.data;
  const isWebsite = nodeData.kind === "website";
  const isCondition = nodeData.kind === "condition";
  const isDelay = nodeData.kind === "delay";
  const isNote = nodeData.kind === "note";

  const handleUpdate = (partial: Partial<WebFlowNodeData>) => {
    onUpdateNodeData(selectedNode.id, partial);
  };

  const handleAddPort = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortName.trim()) return;

    const newPort: WebFlowPort = {
      id: `port_${Date.now()}`,
      name: newPortName.trim().replace(/[^a-zA-Z0-9_]/g, ""),
      type: newPortType,
    };

    if (portTarget === "input") {
      const current = nodeData.inputs || [];
      handleUpdate({ inputs: [...current, newPort] });
    } else {
      const current = nodeData.outputs || [];
      handleUpdate({ outputs: [...current, newPort] });
    }
    setNewPortName("");
  };

  const handleRemovePort = (portId: string, target: "input" | "output") => {
    if (target === "input") {
      handleUpdate({ inputs: (nodeData.inputs || []).filter((p) => p.id !== portId) });
    } else {
      handleUpdate({ outputs: (nodeData.outputs || []).filter((p) => p.id !== portId) });
    }
  };

  return (
    <aside className="w-80 md:w-96 flex flex-col border-l-3 border-nb-border bg-nb-card shadow-nb-lg h-full overflow-y-auto scrollbar-thin">
      {/* Inspector Header */}
      <div className="flex items-center justify-between border-b-2 border-nb-border p-4 bg-nb-surface-alt">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-white border border-nb-border shrink-0">
            {nodeData.kind}
          </span>
          <span className="truncate text-xs font-black text-nb-fg" title={nodeData.label}>
            {nodeData.label || "Selected Node"}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onDeleteNode(selectedNode.id)}
            className="rounded p-1.5 text-nb-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
            title="Delete node"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-nb-muted hover:text-nb-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-nb-border bg-nb-card text-xs font-bold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex-1 min-w-[60px] py-2 text-center border-b-2 ${
            activeTab === "general"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-nb-surface-alt font-black"
              : "border-transparent text-nb-muted hover:text-nb-fg"
          }`}
        >
          General
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("action")}
          className={`flex-1 min-w-[60px] py-2 text-center border-b-2 ${
            activeTab === "action"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-nb-surface-alt font-black"
              : "border-transparent text-nb-muted hover:text-nb-fg"
          }`}
        >
          Action
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ports")}
          className={`flex-1 min-w-[60px] py-2 text-center border-b-2 ${
            activeTab === "ports"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-nb-surface-alt font-black"
              : "border-transparent text-nb-muted hover:text-nb-fg"
          }`}
        >
          Ports
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("instructions")}
          className={`flex-1 min-w-[60px] py-2 text-center border-b-2 ${
            activeTab === "instructions"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-nb-surface-alt font-black"
              : "border-transparent text-nb-muted hover:text-nb-fg"
          }`}
        >
          AI Guide
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("style")}
          className={`flex-1 min-w-[60px] py-2 text-center border-b-2 ${
            activeTab === "style"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-nb-surface-alt font-black"
              : "border-transparent text-nb-muted hover:text-nb-fg"
          }`}
        >
          Style
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* --- TAB: GENERAL --- */}
        {activeTab === "general" && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-nb-muted uppercase tracking-wider mb-1">
                Node Name / Label
              </label>
              <input
                type="text"
                value={nodeData.label || ""}
                onChange={(e) => handleUpdate({ label: e.target.value })}
                className="w-full rounded-lg border-2 border-nb-border bg-nb-card px-3 py-1.5 text-xs font-bold text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-nb-muted uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={nodeData.description || ""}
                onChange={(e) => handleUpdate({ description: e.target.value })}
                placeholder="What is the role of this step?"
                className="w-full rounded-lg border-2 border-nb-border bg-nb-card px-3 py-1.5 text-xs text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Website-specific inputs */}
            {isWebsite && (
              <div className="rounded-xl border-2 border-nb-border bg-nb-surface-alt p-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-nb-fg">
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-indigo-600" /> Attached Website
                  </span>
                  {nodeData.websiteUrl && (
                    <a
                      href={nodeData.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      Visit <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-nb-muted uppercase mb-0.5">
                    Website Title
                  </label>
                  <input
                    type="text"
                    value={nodeData.websiteTitle || ""}
                    onChange={(e) => handleUpdate({ websiteTitle: e.target.value })}
                    className="w-full rounded-lg border border-nb-border bg-nb-card px-2.5 py-1 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-nb-muted uppercase mb-0.5">
                    URL
                  </label>
                  <input
                    type="url"
                    value={nodeData.websiteUrl || ""}
                    onChange={(e) => handleUpdate({ websiteUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-nb-border bg-nb-card px-2.5 py-1 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* Condition expression */}
            {isCondition && (
              <div className="rounded-xl border-2 border-nb-border bg-nb-surface-alt p-3 space-y-2">
                <label className="block text-[11px] font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">
                  IF Condition Expression
                </label>
                <input
                  type="text"
                  value={nodeData.conditionExpression || ""}
                  onChange={(e) => handleUpdate({ conditionExpression: e.target.value })}
                  placeholder="e.g. response.status === 200"
                  className="w-full rounded-lg border-2 border-nb-border bg-nb-card px-3 py-1.5 text-xs font-mono font-bold"
                />
                <p className="text-[10px] text-nb-muted">
                  Routes execution to TRUE or FALSE outputs according to evaluation.
                </p>
              </div>
            )}

            {/* Delay seconds */}
            {isDelay && (
              <div className="rounded-xl border-2 border-nb-border bg-nb-surface-alt p-3 space-y-2">
                <label className="block text-[11px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                  Delay Duration (Seconds)
                </label>
                <input
                  type="number"
                  min={1}
                  max={3600}
                  value={nodeData.delaySeconds || 5}
                  onChange={(e) => handleUpdate({ delaySeconds: Number(e.target.value) || 1 })}
                  className="w-full rounded-lg border-2 border-nb-border bg-nb-card px-3 py-1.5 text-xs font-mono font-bold"
                />
              </div>
            )}

            {/* Canvas Note Content */}
            {isNote && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Note Content (Markdown)
                </label>
                <textarea
                  rows={6}
                  value={nodeData.noteContent || ""}
                  onChange={(e) => handleUpdate({ noteContent: e.target.value })}
                  placeholder="Document reminders, credentials policy, or prerequisites..."
                  className="w-full rounded-lg border-2 border-nb-border bg-amber-100 dark:bg-amber-950 p-2.5 text-xs text-nb-fg focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                />
              </div>
            )}
          </div>
        )}

        {/* --- TAB: ACTION --- */}
        {activeTab === "action" && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-nb-muted uppercase tracking-wider mb-1">
                Action Name / Verb
              </label>
              <input
                type="text"
                value={nodeData.action || ""}
                onChange={(e) => handleUpdate({ action: e.target.value })}
                placeholder="e.g. Create Repository, Download File, Extract Content"
                className="w-full rounded-lg border-2 border-nb-border bg-nb-card px-3 py-1.5 text-xs font-bold text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-nb-muted uppercase tracking-wider mb-1">
                Action Description & Goals
              </label>
              <textarea
                rows={4}
                value={nodeData.actionDescription || ""}
                onChange={(e) => handleUpdate({ actionDescription: e.target.value })}
                placeholder="What exact parameters and outcomes are achieved by this action?"
                className="w-full rounded-lg border-2 border-nb-border bg-nb-card px-3 py-1.5 text-xs text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* --- TAB: PORTS (INPUTS & OUTPUTS) --- */}
        {activeTab === "ports" && (
          <div className="space-y-4">
            {/* Inputs List */}
            <div className="space-y-2">
              <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                Inputs Received ({nodeData.inputs?.length || 0})
              </span>
              <div className="space-y-1">
                {(nodeData.inputs || []).map((port) => (
                  <div
                    key={port.id}
                    className="flex items-center justify-between rounded-lg border border-nb-border/30 bg-nb-surface-alt px-2 py-1 text-xs font-mono"
                  >
                    <span className="font-bold text-nb-fg">{port.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-nb-muted">{port.type}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePort(port.id, "input")}
                        className="text-nb-muted hover:text-rose-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Outputs List */}
            <div className="space-y-2">
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Outputs Produced ({nodeData.outputs?.length || 0})
              </span>
              <div className="space-y-1">
                {(nodeData.outputs || []).map((port) => (
                  <div
                    key={port.id}
                    className="flex items-center justify-between rounded-lg border border-nb-border/30 bg-nb-surface-alt px-2 py-1 text-xs font-mono"
                  >
                    <span className="font-bold text-nb-fg">{port.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-nb-muted">{port.type}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePort(port.id, "output")}
                        className="text-nb-muted hover:text-rose-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Port Form */}
            <form onSubmit={handleAddPort} className="rounded-xl border-2 border-nb-border bg-nb-surface-alt p-3 space-y-2">
              <span className="text-[11px] font-bold text-nb-fg block">Add Port Variable</span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={portTarget}
                  onChange={(e) => setPortTarget(e.target.value as "input" | "output")}
                  className="rounded-lg border border-nb-border bg-nb-card dark:bg-zinc-900 px-2 py-1 text-xs font-bold text-nb-fg dark:text-zinc-100 cursor-pointer"
                >
                  <option value="input">Input Port</option>
                  <option value="output">Output Port</option>
                </select>
                <select
                  value={newPortType}
                  onChange={(e) => setNewPortType(e.target.value as "string" | "number" | "boolean" | "file" | "json" | "any")}
                  className="rounded-lg border border-nb-border bg-nb-card dark:bg-zinc-900 px-2 py-1 text-xs text-nb-fg dark:text-zinc-100 cursor-pointer"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="file">file</option>
                  <option value="json">json</option>
                  <option value="any">any</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="port_name"
                value={newPortName}
                onChange={(e) => setNewPortName(e.target.value)}
                className="w-full rounded-lg border border-nb-border bg-nb-card px-2 py-1 text-xs font-mono font-bold"
              />
              <button
                type="submit"
                disabled={!newPortName.trim()}
                className="w-full flex items-center justify-center gap-1 rounded-lg border-2 border-nb-border bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-nb-sm disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Port
              </button>
            </form>
          </div>
        )}

        {/* --- TAB: INSTRUCTIONS --- */}
        {activeTab === "instructions" && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Agent Instructions & Prompt</span>
              </div>
              <p className="text-[10px] text-nb-muted mb-2">
                Explicit instructions passed to autonomous browser agents and LLMs when executing this step.
              </p>
              <textarea
                rows={8}
                value={nodeData.instructions || ""}
                onChange={(e) => handleUpdate({ instructions: e.target.value })}
                placeholder="e.g. 1. Click on the 'New' button in the upper right. 2. Enter repository name as {{repo_name}}. 3. Set visibility to Public."
                className="w-full rounded-lg border-2 border-nb-border bg-nb-card p-2.5 text-xs text-nb-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* --- TAB: STYLE & CARD APPEARANCE --- */}
        {activeTab === "style" && (
          <div className="space-y-4">
            {/* Custom Card Background */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-nb-fg">
                  Card Background Color
                </label>
                {Boolean(nodeData.customBg) && (
                  <button
                    type="button"
                    onClick={() => handleUpdate({ customBg: undefined })}
                    className="text-[10px] font-bold text-rose-600 hover:underline"
                  >
                    Reset BG
                  </button>
                )}
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { name: "Default", color: "" },
                  { name: "White", color: "#ffffff" },
                  { name: "Ivory", color: "#fef3c7" },
                  { name: "Mint", color: "#d1fae5" },
                  { name: "Ice Blue", color: "#e0f2fe" },
                  { name: "Lavender", color: "#ede9fe" },
                  { name: "Rose", color: "#ffe4e6" },
                  { name: "Charcoal", color: "#18181b" },
                  { name: "Indigo", color: "#1e1b4b" },
                  { name: "Forest", color: "#064e3b" },
                ].map((c) => {
                  const isCurrent =
                    (!nodeData.customBg && !c.color) ||
                    nodeData.customBg === c.color;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      title={c.name}
                      onClick={() =>
                        handleUpdate({
                          customBg: c.color ? c.color : undefined,
                        })
                      }
                      style={c.color ? { backgroundColor: c.color } : undefined}
                      className={`h-7 rounded-lg border-2 border-nb-border shadow-nb-xs transition-transform ${
                        !c.color ? "bg-nb-card" : ""
                      } ${
                        isCurrent
                          ? "ring-2 ring-indigo-500 scale-110"
                          : "hover:scale-105"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Custom Color Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="color"
                  value={typeof nodeData.customBg === "string" ? nodeData.customBg : "#ffffff"}
                  onChange={(e) => handleUpdate({ customBg: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded-lg border-2 border-nb-border p-0.5 bg-nb-card"
                />
                <input
                  type="text"
                  placeholder="#hex background"
                  value={typeof nodeData.customBg === "string" ? nodeData.customBg : ""}
                  onChange={(e) => handleUpdate({ customBg: e.target.value })}
                  className="flex-1 rounded-lg border-2 border-nb-border bg-nb-card px-2.5 py-1 text-xs font-mono font-bold text-nb-fg"
                />
              </div>
            </div>

            {/* Custom Card Border Color */}
            <div className="space-y-2 pt-2 border-t-2 border-nb-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-nb-fg">
                  Card Border Color
                </label>
                {Boolean(nodeData.customBorderColor) && (
                  <button
                    type="button"
                    onClick={() => handleUpdate({ customBorderColor: undefined })}
                    className="text-[10px] font-bold text-rose-600 hover:underline"
                  >
                    Reset Border
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { name: "Default", color: "" },
                  { name: "Dark", color: "#0f172a" },
                  { name: "Indigo", color: "#6366f1" },
                  { name: "Emerald", color: "#10b981" },
                  { name: "Amber", color: "#f59e0b" },
                  { name: "Rose", color: "#ef4444" },
                  { name: "Purple", color: "#8b5cf6" },
                  { name: "Cyan", color: "#06b6d4" },
                ].map((c) => {
                  const isCurrent =
                    (!nodeData.customBorderColor && !c.color) ||
                    nodeData.customBorderColor === c.color;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      title={c.name}
                      onClick={() =>
                        handleUpdate({
                          customBorderColor: c.color ? c.color : undefined,
                        })
                      }
                      className={`h-7 rounded-lg border-3 transition-transform ${
                        isCurrent
                          ? "ring-2 ring-indigo-500 scale-105"
                          : "hover:scale-102"
                      } bg-nb-card`}
                      style={{
                        borderColor: c.color || "var(--nb-border)",
                      }}
                    />
                  );
                })}
              </div>

              {/* Custom Border Color Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="color"
                  value={typeof nodeData.customBorderColor === "string" ? nodeData.customBorderColor : "#6366f1"}
                  onChange={(e) => handleUpdate({ customBorderColor: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded-lg border-2 border-nb-border p-0.5 bg-nb-card"
                />
                <input
                  type="text"
                  placeholder="#hex border"
                  value={typeof nodeData.customBorderColor === "string" ? nodeData.customBorderColor : ""}
                  onChange={(e) => handleUpdate({ customBorderColor: e.target.value })}
                  className="flex-1 rounded-lg border-2 border-nb-border bg-nb-card px-2.5 py-1 text-xs font-mono font-bold text-nb-fg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
