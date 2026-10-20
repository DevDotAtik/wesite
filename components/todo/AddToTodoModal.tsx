"use client";

import React, { useState, useEffect, useSyncExternalStore, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  SquareCheckBig,
  Plus,
  X,
  Globe,
  ArrowRight,
  Loader2,
  Calendar,
  CheckCircle2,
  Circle,
  Trash2,
  ListTodo,
  FileText,
  Folder,
  ChevronDown,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/auth-client";
import { buildGoogleCalendarUrl } from "@/lib/googleCalendar";
import type { WebsiteItem } from "@/components/grid/WebsiteCard";

interface ExistingTodo {
  _id: string;
  title: string;
  notes?: string;
  dueAt?: string | null;
  completedAt?: string | null;
}

interface AddToTodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  website: WebsiteItem | null;
}

const subscribe = () => () => {};

export function AddToTodoModal({
  isOpen,
  onClose,
  website,
}: AddToTodoModalProps) {
  const router = useRouter();
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [folderId, setFolderId] = useState<string>("unassigned");
  const [folders, setFolders] = useState<Array<{ _id: string; name: string; color?: string; icon?: string }>>([]);
  const [dueDateOption, setDueDateOption] = useState<"none" | "today" | "tomorrow" | "3days" | "week">("today");
  const [customDueDate, setCustomDueDate] = useState("");
  const [syncGoogleCalendar, setSyncGoogleCalendar] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Existing todos for this website
  const [existingTodos, setExistingTodos] = useState<ExistingTodo[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Reset & initialize state when modal opens
  useEffect(() => {
    if (isOpen && website) {
      const siteName = website.title?.trim() || website.domain || "website";
      setTitle(`Review ${siteName}`);
      setNotes("");
      setFolderId(website.folderId ? String(website.folderId) : "unassigned");
      setDueDateOption("today");
      setCustomDueDate("");
      setSyncGoogleCalendar(false);
      setShowNotes(false);

      // Focus input after modal mount
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);

      // Fetch existing todos and folders in parallel
      let ignore = false;
      const loadData = async () => {
        setLoadingExisting(true);
        try {
          const [todosRes, foldersRes] = await Promise.all([
            fetchWithAuth(`/api/todos?websiteId=${website._id}&status=all`),
            fetchWithAuth("/api/folders"),
          ]);

          if (todosRes.ok) {
            const data = await todosRes.json();
            if (!ignore) {
              setExistingTodos(data.todos || []);
            }
          }

          if (foldersRes.ok) {
            const data = await foldersRes.json();
            if (!ignore) {
              setFolders(data.flatFolders || data.folders || []);
            }
          }
        } catch {
          if (!ignore) setExistingTodos([]);
        } finally {
          if (!ignore) setLoadingExisting(false);
        }
      };

      loadData();

      return () => {
        ignore = true;
      };
    }
  }, [isOpen, website]);

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isClient || !isOpen || !website) return null;

  // Calculate due date timestamp
  const calculateDueAt = (): string | null => {
    if (customDueDate) {
      return new Date(customDueDate).toISOString();
    }
    const now = new Date();
    switch (dueDateOption) {
      case "today": {
        const d = new Date(now);
        d.setHours(18, 0, 0, 0);
        return d.toISOString();
      }
      case "tomorrow": {
        const d = new Date(now);
        d.setDate(d.getDate() + 1);
        d.setHours(18, 0, 0, 0);
        return d.toISOString();
      }
      case "3days": {
        const d = new Date(now);
        d.setDate(d.getDate() + 3);
        d.setHours(18, 0, 0, 0);
        return d.toISOString();
      }
      case "week": {
        const d = new Date(now);
        d.setDate(d.getDate() + 7);
        d.setHours(18, 0, 0, 0);
        return d.toISOString();
      }
      default:
        return null;
    }
  };

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      const dueAt = calculateDueAt();
      const res = await fetchWithAuth("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          notes: notes.trim(),
          websiteId: website._id,
          folderId: folderId === "unassigned" ? null : folderId,
          dueAt,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create task");
      }

      // If user enabled Google Calendar sync and there's a due date, open Google Calendar with 2-hour alert
      if (syncGoogleCalendar && dueAt) {
        const gcalUrl = buildGoogleCalendarUrl({
          title: title.trim(),
          dueAt,
          notes: notes.trim(),
          website: {
            title: website.title,
            domain: website.domain,
            url: website.url,
          },
          folder: folders.find((f) => f._id === folderId),
        });
        window.open(gcalUrl, "_blank", "noopener,noreferrer");
      }

      toast.success("Task added to Todo!", {
        description: `"${title.trim()}" linked to ${website.title || website.domain}${
          syncGoogleCalendar && dueAt ? " & synced to Google Calendar with 2h alert" : ""
        }`,
        action: {
          label: "Open Todo",
          onClick: () => router.push("/todo"),
        },
      });

      onClose();
    } catch (err) {
      toast.error((err as Error).message || "Could not add task");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExistingTodo = async (todoId: string, currentCompleted: boolean) => {
    try {
      const res = await fetchWithAuth(`/api/todos/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !currentCompleted }),
      });
      if (res.ok) {
        setExistingTodos((prev) =>
          prev.map((t) =>
            t._id === todoId
              ? { ...t, completedAt: !currentCompleted ? new Date().toISOString() : null }
              : t
          )
        );
        toast.success(!currentCompleted ? "Task marked completed!" : "Task reopened!");
      }
    } catch {
      toast.error("Could not update task");
    }
  };

  const deleteExistingTodo = async (todoId: string) => {
    try {
      const res = await fetchWithAuth(`/api/todos/${todoId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setExistingTodos((prev) => prev.filter((t) => t._id !== todoId));
        toast.success("Task deleted");
      }
    } catch {
      toast.error("Could not delete task");
    }
  };

  const quickChips = [
    { label: "📌 Review", prefix: "Review" },
    { label: "📖 Read / Study", prefix: "Read & study" },
    { label: "🛠️ Test & Integrate", prefix: "Test & integrate" },
    { label: "🚀 Follow Up", prefix: "Follow up on" },
    { label: "📝 Take Notes", prefix: "Take notes on" },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "var(--nb-card)",
          borderColor: "var(--nb-border)",
          color: "var(--nb-fg)",
          boxShadow: "10px 10px 0 0 var(--nb-shadow)",
        }}
        className="relative w-full max-w-lg rounded-2xl border-3 border-nb-border bg-nb-card p-5 sm:p-6 shadow-nb-xl animate-in fade-in zoom-in-95 duration-150 text-nb-fg"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-nb-border pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-nb-sm border border-nb-border">
              <SquareCheckBig className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-nb-fg">Add to Todo</h3>
              <p className="text-[11px] text-nb-muted">Create a quick task linked to this website</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selected Website Badge */}
        <div className="flex items-center gap-3 rounded-xl border-2 border-nb-border bg-nb-surface-alt p-2.5 mb-4 shadow-nb-xs">
          {website.faviconUrl ? (
            <img
              src={website.faviconUrl}
              alt=""
              className="h-7 w-7 rounded-lg border border-nb-border object-contain shrink-0 bg-white p-0.5"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 shrink-0">
              <Globe className="h-3.5 w-3.5" />
            </div>
          )}
          <div className="overflow-hidden min-w-0 flex-1">
            <h4 className="text-xs font-black text-nb-fg truncate">
              {website.title || website.domain}
            </h4>
            <p className="text-[10px] font-mono text-nb-muted truncate">{website.url}</p>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="mb-3 space-y-1.5">
          <label className="text-[10px] font-bold text-nb-muted uppercase tracking-wider block">
            Quick Actions:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {quickChips.map((chip) => {
              const siteName = website.title?.trim() || website.domain || "website";
              const suggestion = `${chip.prefix} ${siteName}`;
              const isSelected = title === suggestion;
              return (
                <button
                  key={chip.prefix}
                  type="button"
                  onClick={() => {
                    setTitle(suggestion);
                    inputRef.current?.focus();
                  }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-nb-xs"
                      : "border-nb-border/40 bg-nb-surface text-nb-muted hover:border-nb-border hover:text-nb-fg"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Create Todo Form */}
        <form onSubmit={handleCreateTodo} className="space-y-3">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-black text-nb-fg mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Review GitHub documentation"
              className="w-full rounded-xl border-2 border-nb-border bg-nb-surface px-3 py-2 text-xs font-bold text-nb-fg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-nb-xs"
            />
          </div>

          {/* Folder Selector */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-black text-nb-fg mb-1">
              <Folder className="h-3.5 w-3.5 text-indigo-500" />
              <span>Folder (optional):</span>
            </label>
            <div className="relative">
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full appearance-none rounded-xl border-2 border-nb-border bg-nb-surface px-3 py-2 text-xs font-bold text-nb-fg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-nb-xs pr-8"
              >
                <option value="unassigned">📁 No Folder (Unassigned)</option>
                {folders.map((f) => (
                  <option key={f._id} value={f._id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-nb-muted">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Due Date Shortcut Options */}
          <div>
            <label className="flex items-center justify-between text-[11px] font-black text-nb-fg mb-1.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                Due Date:
              </span>
              {customDueDate ? (
                <button
                  type="button"
                  onClick={() => setCustomDueDate("")}
                  className="text-[10px] text-nb-muted underline"
                >
                  Reset custom date
                </button>
              ) : null}
            </label>

            {!customDueDate ? (
              <div className="grid grid-cols-5 gap-1.5 text-center">
                {[
                  { id: "today", label: "Today" },
                  { id: "tomorrow", label: "Tomorrow" },
                  { id: "3days", label: "3 Days" },
                  { id: "week", label: "1 Week" },
                  { id: "none", label: "No Date" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDueDateOption(item.id as typeof dueDateOption)}
                    className={`rounded-lg py-1.5 text-[11px] font-bold border transition-all ${
                      dueDateOption === item.id
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-nb-xs"
                        : "border-nb-border/40 bg-nb-surface text-nb-muted hover:border-nb-border hover:text-nb-fg"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customDueDate}
                  onChange={(e) => setCustomDueDate(e.target.value)}
                  className="flex-1 rounded-xl border-2 border-nb-border bg-nb-surface px-3 py-1.5 text-xs font-bold text-nb-fg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {!customDueDate && (
              <div className="mt-1.5 text-right">
                <button
                  type="button"
                  onClick={() => setCustomDueDate(new Date().toISOString().split("T")[0])}
                  className="text-[10px] font-bold text-nb-muted hover:text-emerald-600 transition-colors"
                >
                  Pick specific date...
                </button>
              </div>
            )}

            {/* Google Calendar 2-Hour Alert Sync Option */}
            {(dueDateOption !== "none" || customDueDate) && (
              <div className="mt-2 flex items-center justify-between rounded-xl border border-nb-border/40 bg-indigo-500/10 p-2">
                <label
                  htmlFor="sync-gcal"
                  className="flex items-center gap-2 text-[11px] font-bold text-nb-fg cursor-pointer select-none"
                >
                  <input
                    id="sync-gcal"
                    type="checkbox"
                    checked={syncGoogleCalendar}
                    onChange={(e) => setSyncGoogleCalendar(e.target.checked)}
                    className="rounded border-nb-border text-indigo-600 focus:ring-indigo-500 size-3.5 cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <span>📅 Sync to Google Calendar</span>
                    <span className="rounded bg-indigo-500/20 px-1 py-0.2 text-[9px] font-black text-indigo-600 dark:text-indigo-400">
                      2h alert
                    </span>
                  </span>
                </label>
                <Bell className="size-3.5 text-indigo-500" />
              </div>
            )}
          </div>

          {/* Multiline Notes (Newlines Preserved) */}
          <div>
            {!showNotes && !notes ? (
              <button
                type="button"
                onClick={() => setShowNotes(true)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-nb-muted hover:text-nb-fg transition-colors"
              >
                <Plus className="h-3 w-3" />
                <span>Add notes / multi-line checklist (optional)</span>
              </button>
            ) : (
              <div>
                <label className="flex items-center justify-between text-xs font-black text-nb-fg mb-1">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3 text-nb-muted" />
                    Notes / Description:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotes(false);
                      setNotes("");
                    }}
                    className="text-[10px] text-nb-muted hover:text-rose-500"
                  >
                    Remove notes
                  </button>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={"Type notes or details here...\n• Step 1\n• Step 2\nLine breaks will be preserved."}
                  className="w-full rounded-xl border-2 border-nb-border bg-nb-surface px-3 py-2 text-xs font-medium text-nb-fg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y shadow-nb-xs leading-relaxed"
                />
                <p className="mt-1 text-[10px] text-nb-muted">
                  ✨ Line breaks and formatting are preserved exactly as typed.
                </p>
              </div>
            )}
          </div>

          {/* Action Submit Button */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t-2 border-nb-border/30">
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/todo");
              }}
              className="text-xs font-bold text-nb-muted hover:text-nb-fg transition-colors flex items-center gap-1"
            >
              <ListTodo className="h-3.5 w-3.5" />
              <span>Go to Todo board</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border-2 border-nb-border bg-nb-surface px-3 py-2 text-xs font-bold text-nb-fg hover:bg-nb-surface-alt transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="flex items-center gap-1.5 rounded-xl border-2 border-nb-border bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-nb-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                <span>Add Task</span>
              </button>
            </div>
          </div>
        </form>

        {/* Existing Tasks for this Website (if any) */}
        {existingTodos.length > 0 && (
          <div className="mt-4 pt-3 border-t-2 border-nb-border/40">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black text-nb-fg flex items-center gap-1.5">
                <ListTodo className="h-3.5 w-3.5 text-emerald-600" />
                <span>Existing tasks for this website ({existingTodos.length})</span>
              </h4>
              <span className="text-[10px] text-nb-muted font-mono">
                {existingTodos.filter((t) => t.completedAt).length}/{existingTodos.length} done
              </span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
              {existingTodos.map((todo) => {
                const isCompleted = Boolean(todo.completedAt);
                return (
                  <div
                    key={todo._id}
                    className={`rounded-lg border p-2 text-xs transition-colors ${
                      isCompleted
                        ? "border-emerald-500/20 bg-emerald-500/5 text-nb-muted"
                        : "border-nb-border/40 bg-nb-surface text-nb-fg"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleExistingTodo(todo._id, isCompleted)}
                        className="flex items-center gap-2 text-left flex-1 min-w-0"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-nb-muted shrink-0" />
                        )}
                        <span className={`truncate font-bold ${isCompleted ? "line-through opacity-70" : ""}`}>
                          {todo.title}
                        </span>
                      </button>

                      <div className="flex items-center gap-1 shrink-0 ml-1.5">
                        {todo.dueAt && (
                          <button
                            type="button"
                            onClick={() => {
                              const gcalUrl = buildGoogleCalendarUrl({
                                title: todo.title,
                                dueAt: todo.dueAt!,
                                notes: todo.notes,
                                website: {
                                  title: website.title,
                                  domain: website.domain,
                                  url: website.url,
                                },
                              });
                              window.open(gcalUrl, "_blank", "noopener,noreferrer");
                            }}
                            className="p-1 text-nb-muted hover:text-indigo-500 transition-colors"
                            title="Add to Google Calendar (2-hour alert)"
                          >
                            <Calendar className="h-3 w-3" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteExistingTodo(todo._id)}
                          className="p-1 text-nb-muted hover:text-rose-500 transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {todo.notes && (
                      <p className="mt-1 pl-5.5 text-[11px] font-normal text-nb-muted whitespace-pre-wrap break-words leading-relaxed border-l-2 border-nb-border/20 ml-1">
                        {todo.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
