"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, CheckCircle2, Clock3, ExternalLink, Loader2, Plus, RefreshCcw, Trash2, X } from "lucide-react";
import Navbar from "@/components/navbar";

type MonitorWebsite = {
  _id: string;
  title: string;
  domain: string;
  url: string;
  faviconUrl?: string;
};

type ChangeEntry = {
  detectedAt: string;
  title: string;
  description: string;
  httpStatus: number;
  contentHash: string;
};

type Monitor = {
  _id: string;
  websiteId: MonitorWebsite | string;
  url: string;
  title: string;
  interval: "hourly" | "daily" | "weekly";
  enabled: boolean;
  lastCheckedAt: string | null;
  lastTitle: string;
  lastDescription: string;
  changeCount: number;
  changes: ChangeEntry[];
  createdAt: string;
};

type WebsiteOption = {
  _id: string;
  title: string;
  domain: string;
};

export default function MonitoringPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [websites, setWebsites] = useState<WebsiteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState("");
  const [selectedInterval, setSelectedInterval] = useState<"hourly" | "daily" | "weekly">("daily");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [monRes, webRes] = await Promise.all([
      fetch("/api/monitors"),
      fetch("/api/websites?limit=200&sort=smart"),
    ]);
    if (monRes.ok) setMonitors((await monRes.json()).monitors ?? []);
    if (webRes.ok) setWebsites((await webRes.json()).websites ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => { load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function addMonitor() {
    if (!selectedWebsite) return;
    const response = await fetch("/api/monitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ websiteId: selectedWebsite, interval: selectedInterval }),
    });
    if (response.ok) {
      setAddOpen(false);
      setSelectedWebsite("");
      load();
    }
  }

  async function deleteMonitor(id: string) {
    if (!window.confirm("Stop monitoring this website?")) return;
    await fetch(`/api/monitors/${id}`, { method: "DELETE" });
    load();
  }

  async function toggleMonitor(id: string, enabled: boolean) {
    await fetch(`/api/monitors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    load();
  }

  async function runCheck() {
    setChecking(true);
    await fetch("/api/monitors/check", { method: "POST" });
    setChecking(false);
    load();
  }

  const monitoredIds = new Set(monitors.map((m) => typeof m.websiteId === "string" ? m.websiteId : m.websiteId._id));

  return (
    <div className="min-h-screen" style={{ background: "var(--nb-bg)" }}>
      <Navbar />
      <main className="px-4 py-5 sm:px-6 sm:py-8">
        <div className="nb-card-static">
          <div className="nb-section-header">
            <span className="nb-section-icon" style={{ background: "var(--nb-secondary)" }}>
              <Bell className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>Monitoring</h1>
              <p className="mt-1 text-sm" style={{ color: "var(--nb-muted)" }}>Track changes on your saved websites and get notified.</p>
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              <button type="button" onClick={runCheck} disabled={checking} className="nb-btn nb-btn-surface nb-btn-sm">
                {checking ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
                Check now
              </button>
              <button type="button" onClick={() => setAddOpen(true)} className="nb-btn nb-btn-primary nb-btn-sm">
                <Plus className="size-4" />
                Monitor
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="grid min-h-72 place-items-center">
                <Loader2 className="size-8 animate-spin" style={{ color: "var(--nb-primary)" }} />
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="mb-6 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Monitoring", monitors.length, "var(--nb-bruto-blue)"],
                    ["Active", monitors.filter((m) => m.enabled).length, "var(--nb-bruto-mint)"],
                    ["Changes detected", monitors.reduce((sum, m) => sum + m.changeCount, 0), "var(--nb-bruto-orange)"],
                  ].map(([label, value, color]) => (
                    <div key={String(label)} className="nb-card-static p-4" style={{ background: String(color) }}>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--nb-fg)", opacity: 0.6 }}>{String(label)}</p>
                      <p className="mt-2 text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Add Monitor Panel */}
                {addOpen ? (
                  <div className="nb-card-static mb-6 p-4" style={{ background: "var(--nb-surface-alt)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-extrabold" style={{ color: "var(--nb-fg)" }}>Add Website to Monitor</h2>
                      <button type="button" onClick={() => setAddOpen(false)} className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm"><X className="size-4" /></button>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                      <label className="block text-xs font-bold flex-1 min-w-48" style={{ color: "var(--nb-fg)" }}>
                        Website
                        <select value={selectedWebsite} onChange={(e) => setSelectedWebsite(e.target.value)} className="nb-input mt-1">
                          <option value="">Select a website...</option>
                          {websites.filter((w) => !monitoredIds.has(w._id)).map((w) => (
                            <option key={w._id} value={w._id}>{w.title || w.domain}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                        Interval
                        <select value={selectedInterval} onChange={(e) => setSelectedInterval(e.target.value as typeof selectedInterval)} className="nb-input mt-1">
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </label>
                      <button type="button" onClick={addMonitor} disabled={!selectedWebsite} className="nb-btn nb-btn-primary nb-btn-sm disabled:opacity-50">
                        <Plus className="size-4" /> Add
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Monitor List */}
                {monitors.length ? (
                  <div className="space-y-3">
                    {monitors.map((monitor) => {
                      const site = typeof monitor.websiteId === "object" ? monitor.websiteId : null;
                      const isExpanded = expandedId === monitor._id;
                      return (
                        <div key={monitor._id} className="nb-card-static overflow-hidden">
                          <div className="flex items-center gap-3 p-4" style={{ background: "var(--nb-surface)" }}>
                            <button
                              type="button"
                              onClick={() => toggleMonitor(monitor._id, !monitor.enabled)}
                              className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm shrink-0"
                              style={{ color: monitor.enabled ? "var(--nb-success)" : "var(--nb-muted)" }}
                              title={monitor.enabled ? "Disable" : "Enable"}
                            >
                              {monitor.enabled ? <Bell className="size-4" /> : <BellOff className="size-4" />}
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-bold" style={{ color: "var(--nb-fg)" }}>{monitor.title || site?.title || monitor.url}</span>
                                {monitor.changeCount > 0 ? (
                                  <span className="nb-tag text-[9px]" style={{ background: "var(--nb-bruto-orange)", color: "var(--nb-fg)" }}>
                                    {monitor.changeCount} change{monitor.changeCount !== 1 ? "s" : ""}
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "var(--nb-muted)" }}>
                                <span>{monitor.interval}</span>
                                {monitor.lastCheckedAt ? (
                                  <span>Checked {new Date(monitor.lastCheckedAt).toLocaleDateString()}</span>
                                ) : (
                                  <span>Never checked</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <a href={monitor.url} target="_blank" rel="noreferrer" className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm">
                                <ExternalLink className="size-4" />
                              </a>
                              <button
                                type="button"
                                onClick={() => setExpandedId(isExpanded ? null : monitor._id)}
                                className="nb-btn nb-btn-ghost nb-btn-sm text-xs"
                              >
                                {monitor.changes?.length ? `${monitor.changes.length} logs` : "No changes"}
                              </button>
                              <button type="button" onClick={() => deleteMonitor(monitor._id)} className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm" style={{ color: "var(--nb-danger)" }}>
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </div>

                          {isExpanded && monitor.changes?.length ? (
                            <div className="border-t-3 p-4 space-y-2" style={{ borderColor: "var(--nb-border)", background: "var(--nb-card)" }}>
                              <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--nb-muted)" }}>Change Log</h3>
                              {monitor.changes.slice().reverse().map((change, i) => (
                                <div key={i} className="nb-card-sm flex items-start gap-3 p-3">
                                  <CheckCircle2 className="size-4 mt-0.5 shrink-0" style={{ color: "var(--nb-primary)" }} />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold" style={{ color: "var(--nb-fg)" }}>{change.title || "Title changed"}</p>
                                    {change.description ? <p className="text-xs mt-1" style={{ color: "var(--nb-muted)" }}>{change.description}</p> : null}
                                    <div className="flex items-center gap-2 mt-1 text-[10px] font-semibold" style={{ color: "var(--nb-muted)" }}>
                                      <Clock3 className="size-3" />
                                      {new Date(change.detectedAt).toLocaleString()}
                                      <span className="nb-tag text-[9px]">HTTP {change.httpStatus}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : isExpanded ? (
                            <div className="border-t-3 p-4 text-center" style={{ borderColor: "var(--nb-border)" }}>
                              <p className="text-xs font-semibold" style={{ color: "var(--nb-muted)" }}>No changes detected yet.</p>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="nb-card-static grid min-h-72 place-items-center border-dashed text-center" style={{ borderStyle: "dashed" }}>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "var(--nb-fg)" }}>No websites being monitored</p>
                      <p className="mt-1 text-sm" style={{ color: "var(--nb-muted)" }}>Add a website to start tracking changes.</p>
                      <button type="button" onClick={() => setAddOpen(true)} className="nb-btn nb-btn-primary nb-btn-sm mt-4">
                        <Plus className="size-4" /> Start Monitoring
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
