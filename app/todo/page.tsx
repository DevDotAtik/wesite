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
  const [form, setForm] = useState({ title: "", notes: "", websiteId: "unassigned", dueAt: "" });

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
    if (websitesRes.ok) setWebsites((await websitesRes.json()).websites ?? []);
    setLoading(false);
  }, [filter, query]);

  useEffect(() => { const timer = window.setTimeout(() => { load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

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
    const response = await fetch(`/api/todos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (response.ok) load();
  }

  async function deleteTodo(id: string) {
    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) return;
    const response = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    if (response.ok) load();
  }

  const groupedTodos = useMemo(() => ({
    open: todos.filter((todo) => !todo.completedAt),
    completed: todos.filter((todo) => Boolean(todo.completedAt)),
  }), [todos]);

  return (
    <div className="min-h-screen" style={{ background: "var(--nb-bg)" }}>
      <Navbar search={query} onSearchChange={setQuery} />
      <main className="px-4 py-5 sm:px-6 sm:py-8">
        <div className="nb-card-static">
          <div className="nb-section-header" style={{ flexWrap: "wrap" }}>
            <span className="nb-section-icon" style={{ background: "var(--nb-secondary)" }}>
              <Clock3 className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>Todo</h1>
              <p className="mt-1 text-sm" style={{ color: "var(--nb-muted)" }}>Assign tasks to websites with timestamps and status tracking.</p>
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              {[
                ["Open", totals.open, "open"],
                ["Completed", totals.completed, "completed"],
                ["All", totals.all, "all"],
              ].map(([label, value, key]) => (
                <button
                  key={String(key)}
                  type="button"
                  onClick={() => setFilter(key as typeof filter)}
                  className={`nb-btn nb-btn-sm ${filter === key ? "nb-btn-primary" : "nb-btn-surface"}`}
                >
                  {label} {value}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Create Form */}
            <form onSubmit={createTodo} className="nb-card-static mb-6 grid gap-3 p-4 lg:grid-cols-[1.2fr_0.9fr_0.8fr_auto]" style={{ background: "var(--nb-surface-alt)" }}>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Write a task" className="nb-input" />
              <select value={form.websiteId} onChange={(event) => setForm((current) => ({ ...current, websiteId: event.target.value }))} className="nb-input">
                <option value="unassigned">No website</option>
                {websites.map((website) => (
                  <option key={website._id} value={website._id}>{website.title || website.domain}</option>
                ))}
              </select>
              <input type="datetime-local" value={form.dueAt} onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))} className="nb-input" />
              <button type="submit" disabled={!form.title.trim()} className="nb-btn nb-btn-primary disabled:opacity-50">
                <Plus className="size-4" />
                Add
              </button>
              <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes or context" className="nb-input lg:col-span-4" style={{ minHeight: "6rem" }} />
            </form>

            {/* Task Lists */}
            <div className="grid gap-5 lg:grid-cols-2">
              {loading ? (
                <div className="nb-card-static grid min-h-72 place-items-center border-dashed lg:col-span-2" style={{ borderStyle: "dashed" }}>
                  <div className="text-sm font-semibold" style={{ color: "var(--nb-muted)" }}>Loading tasks...</div>
                </div>
              ) : (
                <>
                  {(["open", "completed"] as const).map((section) => (
                    <section key={section} className="nb-card-static p-4" style={{ background: "var(--nb-surface)" }}>
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-extrabold capitalize" style={{ color: "var(--nb-fg)" }}>{section} tasks</h2>
                        <span className="nb-tag">{groupedTodos[section].length}</span>
                      </div>
                      <div className="mt-4 space-y-3">
                        {groupedTodos[section].map((todo) => (
                          <article key={todo._id} className="nb-card-sm p-4">
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => updateTodo(todo._id, { completed: !todo.completedAt })}
                                className="mt-0.5"
                                style={{ color: "var(--nb-primary)" }}
                                aria-label={todo.completedAt ? "Mark incomplete" : "Mark complete"}
                              >
                                {todo.completedAt ? <CheckCircle2 className="size-5 fill-[var(--nb-primary)] text-white" /> : <Circle className="size-5" />}
                              </button>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className={`font-bold text-sm ${todo.completedAt ? "line-through" : ""}`} style={{ color: todo.completedAt ? "var(--nb-muted)" : "var(--nb-fg)" }}>{todo.title}</h3>
                                  {todo.websiteId ? (
                                    <a href={todo.websiteId.url} target="_blank" rel="noreferrer" className="nb-btn nb-btn-primary nb-btn-sm">
                                      {todo.websiteId.title || todo.websiteId.domain}
                                    </a>
                                  ) : null}
                                </div>
                                {todo.notes ? <p className="mt-2 text-sm" style={{ color: "var(--nb-muted)" }}>{todo.notes}</p> : null}
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--nb-muted)" }}>
                                  {todo.dueAt ? <span className="nb-tag">Due {new Date(todo.dueAt).toLocaleString()}</span> : null}
                                  {todo.createdAt ? <span>Created {new Date(todo.createdAt).toLocaleString()}</span> : null}
                                  {todo.completedAt ? <span className="nb-tag nb-tag-success">Completed {new Date(todo.completedAt).toLocaleString()}</span> : null}
                                </div>
                              </div>
                              <button type="button" onClick={() => deleteTodo(todo._id)} className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm" style={{ color: "var(--nb-danger)" }} aria-label="Delete task">
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </article>
                        ))}
                        {!groupedTodos[section].length ? (
                          <div className="nb-card-sm border-dashed p-8 text-center text-sm font-semibold" style={{ borderStyle: "dashed", color: "var(--nb-muted)" }}>
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
        </div>
      </main>
    </div>
  );
}
