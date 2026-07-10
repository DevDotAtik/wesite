"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, Clock3, Plus, Trash2 } from "lucide-react";
import Navbar from "@/components/navbar";

type TodoWebsite = {
  _id: string;
  title: string;
  domain: string;
  url: string;
};

type TodoItem = {
  _id: string;
  title: string;
  notes?: string;
  dueAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  websiteId?: TodoWebsite | null;
};

type Totals = {
  all: number;
  open: number;
  completed: number;
};

export default function TodoPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [websites, setWebsites] = useState<TodoWebsite[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "completed">("open");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<Totals>({ all: 0, open: 0, completed: 0 });
  const [form, setForm] = useState({
    title: "",
    notes: "",
    websiteId: "unassigned",
    dueAt: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [todosRes, websitesRes] = await Promise.all([
      fetch(`/api/todos?status=${filter}&search=${encodeURIComponent(query)}`),
      fetch("/api/websites?limit=200&sort=smart"),
    ]);

    if (todosRes.ok) {
      const payload = await todosRes.json();
      setTodos(payload.todos ?? []);
      setTotals(payload.totals ?? { all: 0, open: 0, completed: 0 });
    }

    if (websitesRes.ok) {
      setWebsites((await websitesRes.json()).websites ?? []);
    }

    setLoading(false);
  }, [filter, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [filter, load, query]);

  async function createTodo(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        notes: form.notes.trim(),
        websiteId: form.websiteId === "unassigned" ? null : form.websiteId,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
      }),
    });

    if (!response.ok) return;

    setForm({ title: "", notes: "", websiteId: "unassigned", dueAt: "" });
    load();
  }

  async function updateTodo(id: string, patch: Record<string, unknown>) {
    const response = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (response.ok) load();
  }

  async function deleteTodo(id: string) {
    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) return;
    const response = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    if (response.ok) load();
  }

  const groupedTodos = useMemo(
    () => ({
      open: todos.filter((todo) => !todo.completedAt),
      completed: todos.filter((todo) => Boolean(todo.completedAt)),
    }),
    [todos],
  );

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar search={query} onSearchChange={setQuery} />
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_18px_50px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="border-b border-[color:var(--border)] px-6 py-6 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                  <Clock3 className="size-5" />
                </span>
                <div>
                  <h1 className="text-2xl font-semibold">Todo</h1>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">Assign tasks to websites with timestamps and status tracking.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ["Open", totals.open, "open"],
                  ["Completed", totals.completed, "completed"],
                  ["All", totals.all, "all"],
                ].map(([label, value, key]) => (
                  <button
                    key={String(key)}
                    type="button"
                    onClick={() => setFilter(key as typeof filter)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium ${
                      filter === key
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
                        : "border-[color:var(--border)] bg-[color:var(--surface-strong)] hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                  >
                    {label} {value}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={createTodo} className="mt-5 grid gap-3 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 lg:grid-cols-[1.2fr_0.9fr_0.8fr_auto]">
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Write a task"
                className="h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 outline-none focus:border-blue-500"
              />
              <select
                value={form.websiteId}
                onChange={(event) => setForm((current) => ({ ...current, websiteId: event.target.value }))}
                className="h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 outline-none focus:border-blue-500"
              >
                <option value="unassigned">No website</option>
                {websites.map((website) => (
                  <option key={website._id} value={website._id}>
                    {website.title || website.domain}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={form.dueAt}
                onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))}
                className="h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 outline-none focus:border-blue-500"
              />
              <button type="submit" disabled={!form.title.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                <Plus className="size-4" />
                Add
              </button>
              <textarea
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Notes or context"
                className="min-h-24 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 outline-none focus:border-blue-500 lg:col-span-4"
              />
            </form>
          </div>

          <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-2">
            {loading ? (
              <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] lg:col-span-2">
                <div className="text-sm text-[color:var(--muted)]">Loading tasks...</div>
              </div>
            ) : (
              <>
                {(["open", "completed"] as const).map((section) => (
                  <section key={section} className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-semibold capitalize">{section} tasks</h2>
                      <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)]">{groupedTodos[section].length}</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {groupedTodos[section].map((todo) => (
                        <article key={todo._id} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => updateTodo(todo._id, { completed: !todo.completedAt })}
                              className="mt-0.5 text-blue-600"
                              aria-label={todo.completedAt ? "Mark incomplete" : "Mark complete"}
                            >
                              {todo.completedAt ? <CheckCircle2 className="size-5 fill-blue-600 text-white" /> : <Circle className="size-5" />}
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className={`font-medium ${todo.completedAt ? "line-through text-[color:var(--muted)]" : ""}`}>{todo.title}</h3>
                                {todo.websiteId ? (
                                  <a href={todo.websiteId.url} target="_blank" rel="noreferrer" className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                                    {todo.websiteId.title || todo.websiteId.domain}
                                  </a>
                                ) : null}
                              </div>
                              {todo.notes ? <p className="mt-2 text-sm text-[color:var(--muted)]">{todo.notes}</p> : null}
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted)]">
                                {todo.dueAt ? <span>Due {new Date(todo.dueAt).toLocaleString()}</span> : null}
                                {todo.createdAt ? <span>Created {new Date(todo.createdAt).toLocaleString()}</span> : null}
                                {todo.completedAt ? <span>Completed {new Date(todo.completedAt).toLocaleString()}</span> : null}
                              </div>
                            </div>
                            <button type="button" onClick={() => deleteTodo(todo._id)} className="text-red-500 hover:text-red-600" aria-label="Delete task">
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </article>
                      ))}
                      {!groupedTodos[section].length ? (
                        <div className="rounded-2xl border border-dashed border-[color:var(--border)] px-4 py-8 text-center text-sm text-[color:var(--muted)]">
                          No {section} tasks yet.
                        </div>
                      ) : null}
                    </div>
                  </section>
                ))}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
