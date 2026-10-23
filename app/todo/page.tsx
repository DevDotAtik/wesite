"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  BellRing,
  Calendar,
  CalendarDays,
  CalendarHeart,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Filter,
  Folder,
  Globe,
  ListTodo,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/navbar";
import { fetchWithAuth, getAuthToken } from "@/lib/auth-client";
import {
  buildGoogleCalendarUrl,
  downloadTaskIcs,
  generateCalendarFeed,
} from "@/lib/googleCalendar";

type TodoWebsite = {
  _id: string;
  title: string;
  domain: string;
  url: string;
  faviconUrl?: string;
  folderId?: string | null;
};

type TodoFolder = {
  _id: string;
  name: string;
  color?: string;
  icon?: string;
  parentFolderId?: string | null;
};

type TodoItem = {
  _id: string;
  title: string;
  notes?: string;
  dueAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  websiteId?: TodoWebsite | null;
  folderId?: TodoFolder | null;
};

type Totals = {
  all: number;
  open: number;
  completed: number;
  overdue: number;
  dueSoon2Hours: number;
  today: number;
};

type DuePreset = "none" | "today" | "tomorrow" | "3days" | "week" | "custom";

function formatDueDate(dueAt: string | null | undefined): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  isSoon: boolean;
  isWithin2Hours: boolean;
  minutesLeft: number;
} {
  if (!dueAt)
    return {
      label: "",
      isOverdue: false,
      isToday: false,
      isSoon: false,
      isWithin2Hours: false,
      minutesLeft: 0,
    };

  const due = new Date(dueAt);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const isToday = due.toDateString() === now.toDateString();
  const isOverdue = diffMs < 0 && !isToday;
  const isSoon = !isOverdue && !isToday && diffDays <= 3;
  const isWithin2Hours = diffMs > 0 && diffMs <= 2 * 60 * 60 * 1000;
  const minutesLeft = Math.max(1, Math.round(diffMs / (1000 * 60)));

  const timeStr = due.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const dateStr = due.toLocaleDateString([], { month: "short", day: "numeric" });

  if (isWithin2Hours) {
    const mins = minutesLeft % 60;
    const hrs = Math.floor(minutesLeft / 60);
    const leftText = hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`;
    return {
      label: `⚡ Due in ${leftText} (${timeStr})`,
      isOverdue: false,
      isToday: true,
      isSoon: true,
      isWithin2Hours: true,
      minutesLeft,
    };
  }

  if (isToday) {
    return {
      label: `Due Today at ${timeStr}`,
      isOverdue: false,
      isToday: true,
      isSoon: false,
      isWithin2Hours: false,
      minutesLeft,
    };
  }

  if (isOverdue) {
    const daysAgo = Math.max(1, Math.abs(diffDays));
    return {
      label: `Overdue by ${daysAgo}d (${dateStr})`,
      isOverdue: true,
      isToday: false,
      isSoon: false,
      isWithin2Hours: false,
      minutesLeft,
    };
  }

  if (diffDays === 1) {
    return {
      label: `Tomorrow at ${timeStr}`,
      isOverdue: false,
      isToday: false,
      isSoon: true,
      isWithin2Hours: false,
      minutesLeft,
    };
  }

  if (diffDays > 1 && diffDays <= 7) {
    return {
      label: `In ${diffDays} days (${dateStr})`,
      isOverdue: false,
      isToday: false,
      isSoon,
      isWithin2Hours: false,
      minutesLeft,
    };
  }

  return {
    label: `${dateStr} at ${timeStr}`,
    isOverdue: false,
    isToday: false,
    isSoon: false,
    isWithin2Hours: false,
    minutesLeft,
  };
}

function calculatePresetDate(preset: DuePreset): string | null {
  const now = new Date();
  switch (preset) {
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
}

export default function TodoPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [websites, setWebsites] = useState<TodoWebsite[]>([]);
  const [folders, setFolders] = useState<TodoFolder[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "completed" | "overdue" | "dueSoon" | "today">("open");
  const [mobileTab, setMobileTab] = useState<"tasks" | "create" | "stats">("tasks");
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollSlider = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = direction === "left" ? -200 : 200;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };
  const [selectedFolderId, setSelectedFolderId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<"due" | "created" | "title">("due");

  // Google Calendar Integration states
  const [syncToGcalOnCreate, setSyncToGcalOnCreate] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  // Create form state
  const [form, setForm] = useState({
    title: "",
    notes: "",
    websiteId: "unassigned",
    folderId: "unassigned",
    duePreset: "today" as DuePreset,
    customDueAt: "",
  });

  // Inline editing state
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    notes: "",
    websiteId: "unassigned",
    folderId: "unassigned",
    dueAt: "",
  });

  // Expanded notes state (for collapsible long notes)
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  // Batch selection states and 3-dots action menu state
  const [selectedTodoIds, setSelectedTodoIds] = useState<Set<string>>(new Set());
  const [openMenuTodoId, setOpenMenuTodoId] = useState<string | null>(null);
  const [isBatchOperating, setIsBatchOperating] = useState(false);

  // Close menus on outside click or Escape
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest("[data-todo-menu]")) {
        setOpenMenuTodoId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenuTodoId(null);
      }
    };
    document.addEventListener("mousedown", handleGlobalClick);
    document.addEventListener("touchstart", handleGlobalClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
      document.removeEventListener("touchstart", handleGlobalClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const notifiedTaskIdsRef = useRef<Set<string>>(new Set());

  // Load all data
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [todosRes, websitesRes, foldersRes] = await Promise.all([
        fetchWithAuth("/api/todos?status=all&limit=300"),
        fetchWithAuth("/api/websites?limit=500&sort=smart"),
        fetchWithAuth("/api/folders"),
      ]);

      if (todosRes.ok) {
        const payload = await todosRes.json();
        setTodos(payload.todos ?? []);
      }
      if (websitesRes.ok) {
        const siteData = await websitesRes.json();
        setWebsites(siteData.websites ?? []);
      }
      if (foldersRes.ok) {
        const folderData = await foldersRes.json();
        setFolders(folderData.flatFolders || folderData.folders || []);
      }
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [load]);

  // Request browser desktop notification permission for 2-hour deadline alert
  const requestNotificationAccess = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Browser notifications are not supported by this browser.");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      toast.success("Desktop alerts enabled! You will be alerted 2 hours before any deadline.");
      new Notification("WeSite Deadline Alerts Enabled", {
        body: "You will receive desktop alerts 2 hours before any task deadline.",
      });
    } else {
      toast.error("Notification permission was denied in browser settings.");
    }
  };

  // Periodic checker for 2-Hour Deadline Alerts
  useEffect(() => {
    const checkDeadlines = () => {
      const now = Date.now();
      const twoHoursMs = 2 * 60 * 60 * 1000;

      for (const t of todos) {
        if (t.completedAt || !t.dueAt) continue;
        const due = new Date(t.dueAt).getTime();
        const diff = due - now;

        // If deadline is within the next 2 hours and hasn't alerted yet
        if (diff > 0 && diff <= twoHoursMs && !notifiedTaskIdsRef.current.has(t._id)) {
          notifiedTaskIdsRef.current.add(t._id);

          const minsLeft = Math.round(diff / (1000 * 60));
          const timeText = minsLeft > 60 ? `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m` : `${minsLeft} minutes`;

          // In-app toast
          toast.warning(`🚨 Deadline Warning: 2 Hours Left!`, {
            description: `"${t.title}" is due in ${timeText}!`,
            duration: 10000,
            action: {
              label: "Open Calendar",
              onClick: () => {
                const url = buildGoogleCalendarUrl({
                  title: t.title,
                  dueAt: t.dueAt!,
                  notes: t.notes,
                  website: t.websiteId,
                  folder: t.folderId,
                });
                window.open(url, "_blank", "noopener,noreferrer");
              },
            },
          });

          // Desktop Web Notification
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(`⏰ Deadline in 2 Hours: ${t.title}`, {
                body: `Your task "${t.title}" is due in ${timeText}. Click to view or complete it.`,
                tag: `todo-${t._id}`,
              });
            } catch {}
          }
        }
      }
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [todos]);

  // Tasks due within 2 hours
  const tasksDueWithin2Hours = useMemo(() => {
    const now = Date.now();
    const twoHoursMs = 2 * 60 * 60 * 1000;
    return todos.filter((t) => {
      if (t.completedAt || !t.dueAt) return false;
      const due = new Date(t.dueAt).getTime();
      const diff = due - now;
      return diff > 0 && diff <= twoHoursMs;
    });
  }, [todos]);

  // Totals calculations
  const totals: Totals = useMemo(() => {
    const now = new Date();
    let open = 0;
    let completed = 0;
    let overdue = 0;
    let dueSoon2Hours = 0;
    let today = 0;

    for (const t of todos) {
      if (t.completedAt) {
        completed++;
      } else {
        open++;
        if (t.dueAt) {
          const due = new Date(t.dueAt);
          const diff = due.getTime() - now.getTime();
          if (due.toDateString() === now.toDateString()) {
            today++;
          }
          if (diff < 0 && due.toDateString() !== now.toDateString()) {
            overdue++;
          } else if (diff > 0 && diff <= 2 * 60 * 60 * 1000) {
            dueSoon2Hours++;
          }
        }
      }
    }

    return {
      all: todos.length,
      open,
      completed,
      overdue,
      dueSoon2Hours,
      today,
    };
  }, [todos]);

  // Completion percentage
  const completionRate = useMemo(() => {
    if (totals.all === 0) return 0;
    return Math.round((totals.completed / totals.all) * 100);
  }, [totals]);

  // Folder task counts for folder filter bar
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = { all: todos.length, unassigned: 0 };
    for (const folder of folders) {
      counts[folder._id] = 0;
    }
    for (const t of todos) {
      const fId = t.folderId?._id;
      if (fId && counts[fId] !== undefined) {
        counts[fId]++;
      } else {
        counts.unassigned++;
      }
    }
    return counts;
  }, [todos, folders]);

  // Filtered & sorted todos
  const filteredTodos = useMemo(() => {
    const now = new Date();
    let result = todos;

    // Status filter
    if (filter === "open") {
      result = result.filter((t) => !t.completedAt);
    } else if (filter === "completed") {
      result = result.filter((t) => Boolean(t.completedAt));
    } else if (filter === "overdue") {
      result = result.filter((t) => {
        if (t.completedAt || !t.dueAt) return false;
        const due = new Date(t.dueAt);
        return due.getTime() < now.getTime() && due.toDateString() !== now.toDateString();
      });
    } else if (filter === "dueSoon") {
      result = result.filter((t) => {
        if (t.completedAt || !t.dueAt) return false;
        const due = new Date(t.dueAt);
        const diff = due.getTime() - now.getTime();
        return diff > 0 && diff <= 2 * 60 * 60 * 1000;
      });
    } else if (filter === "today") {
      result = result.filter((t) => {
        if (t.completedAt || !t.dueAt) return false;
        const due = new Date(t.dueAt);
        return due.toDateString() === now.toDateString();
      });
    }

    // Folder filter
    if (selectedFolderId === "unassigned") {
      result = result.filter((t) => !t.folderId?._id);
    } else if (selectedFolderId !== "all") {
      result = result.filter((t) => t.folderId?._id === selectedFolderId);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.websiteId?.title && t.websiteId.title.toLowerCase().includes(q)) ||
          (t.websiteId?.domain && t.websiteId.domain.toLowerCase().includes(q)) ||
          (t.folderId?.name && t.folderId.name.toLowerCase().includes(q)),
      );
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === "due") {
        if (!a.dueAt && !b.dueAt) return 0;
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      }
      if (sortBy === "created") {
        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bCreated - aCreated;
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [todos, filter, selectedFolderId, searchQuery, sortBy]);

  // Top folder filter selection: syncs filter view and pre-sets create form folder
  const handleFolderFilterSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
    if (folderId !== "all") {
      setForm((cur) => {
        const nextFolderId = folderId;
        const currentSite = websites.find((w) => w._id === cur.websiteId);
        const matches =
          nextFolderId === "unassigned"
            ? !currentSite?.folderId
            : currentSite && String(currentSite.folderId || "") === String(nextFolderId);

        return {
          ...cur,
          folderId: nextFolderId,
          websiteId: matches ? cur.websiteId : "unassigned",
        };
      });
    }
  };

  // Filter websites available for create form based strictly on chosen folder
  const availableWebsitesForCreate = useMemo(() => {
    if (form.folderId && form.folderId !== "unassigned") {
      return websites.filter((w) => String(w.folderId || "") === String(form.folderId));
    }
    // "unassigned" -> only show websites that don't belong to any folder
    return websites.filter((w) => !w.folderId);
  }, [websites, form.folderId]);

  // Handle changing folder in create form
  const handleFormFolderChange = (newFolderId: string) => {
    setForm((cur) => {
      const currentSite = websites.find((w) => w._id === cur.websiteId);
      const matches =
        newFolderId === "unassigned"
          ? !currentSite?.folderId
          : currentSite && String(currentSite.folderId || "") === String(newFolderId);

      return {
        ...cur,
        folderId: newFolderId,
        websiteId: matches ? cur.websiteId : "unassigned",
      };
    });
  };

  // Filter websites available for inline edit form based strictly on chosen edit folder
  const availableWebsitesForEdit = useMemo(() => {
    let list: TodoWebsite[] = [];
    if (editForm.folderId && editForm.folderId !== "unassigned") {
      list = websites.filter((w) => String(w.folderId || "") === String(editForm.folderId));
    } else {
      list = websites.filter((w) => !w.folderId);
    }
    // Keep currently assigned website if already set so it's not lost
    if (editForm.websiteId && editForm.websiteId !== "unassigned") {
      const existing = websites.find((w) => w._id === editForm.websiteId);
      if (existing && !list.some((w) => w._id === existing._id)) {
        list = [existing, ...list];
      }
    }
    return list;
  }, [websites, editForm.folderId, editForm.websiteId]);

  // Handle changing folder in inline edit form
  const handleEditFolderChange = (newFolderId: string) => {
    setEditForm((cur) => {
      const currentSite = websites.find((w) => w._id === cur.websiteId);
      const matches =
        newFolderId === "unassigned"
          ? !currentSite?.folderId
          : currentSite && String(currentSite.folderId || "") === String(newFolderId);

      return {
        ...cur,
        folderId: newFolderId,
        websiteId: matches ? cur.websiteId : "unassigned",
      };
    });
  };

  // Handle website selection change in create form:
  // Automatically inherit the website's folder if available
  const handleWebsiteChange = (siteId: string) => {
    if (siteId === "unassigned") {
      setForm((cur) => ({ ...cur, websiteId: siteId }));
      return;
    }
    const foundSite = websites.find((w) => w._id === siteId);
    setForm((cur) => ({
      ...cur,
      websiteId: siteId,
      folderId: foundSite?.folderId ? String(foundSite.folderId) : cur.folderId,
    }));
  };

  // Quick action title suggestions
  const quickActions = [
    { label: "📌 Review", prefix: "Review" },
    { label: "🛠️ Implement", prefix: "Implement" },
    { label: "📖 Study & Read", prefix: "Read & study" },
    { label: "🚀 Follow Up", prefix: "Follow up on" },
    { label: "📝 Take Notes", prefix: "Take notes on" },
    { label: "🔍 Research", prefix: "Research" },
  ];

  const applyQuickAction = (prefix: string) => {
    let suffix = "";
    if (form.websiteId !== "unassigned") {
      const site = websites.find((w) => w._id === form.websiteId);
      if (site) {
        suffix = ` ${site.title || site.domain}`;
      }
    }
    setForm((cur) => ({
      ...cur,
      title: `${prefix}${suffix}`,
    }));
    titleInputRef.current?.focus();
  };

  // Open task in Google Calendar
  const openInGoogleCalendar = (todo: TodoItem) => {
    if (!todo.dueAt) {
      toast.error("Please set a deadline before syncing to Google Calendar.");
      return;
    }
    const url = buildGoogleCalendarUrl({
      id: todo._id,
      title: todo.title,
      dueAt: todo.dueAt,
      notes: todo.notes,
      website: todo.websiteId,
      folder: todo.folderId,
    });
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Opening Google Calendar!", {
      description: "Event ready with 2-hour pre-deadline alert configured.",
    });
  };

  // Download task .ics with 2-hour alert
  const downloadIcs = (todo: TodoItem) => {
    if (!todo.dueAt) {
      toast.error("Task does not have a deadline.");
      return;
    }
    downloadTaskIcs({
      id: todo._id,
      title: todo.title,
      dueAt: todo.dueAt,
      notes: todo.notes,
      website: todo.websiteId,
      folder: todo.folderId,
    });
    toast.success("Calendar reminder (.ics) downloaded!", {
      description: "Opens in Google Calendar, Apple Calendar, or Outlook with a 2-hour alert.",
    });
  };

  // Download all active tasks as .ics
  const downloadAllIcs = () => {
    const tasksWithDue = todos.filter((t) => !t.completedAt && t.dueAt);
    if (!tasksWithDue.length) {
      toast.error("No active tasks with deadlines to export.");
      return;
    }
    const icsContent = generateCalendarFeed(
      tasksWithDue.map((t) => ({
        id: t._id,
        title: t.title,
        dueAt: t.dueAt!,
        notes: t.notes,
        website: t.websiteId,
        folder: t.folderId,
      })),
    );
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "wesite-all-todos.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${tasksWithDue.length} tasks with 2-hour alerts!`);
  };

  // Create task
  async function createTodo(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || submitting) return;

    setSubmitting(true);
    let dueAt: string | null = null;
    if (form.duePreset === "custom") {
      dueAt = form.customDueAt ? new Date(form.customDueAt).toISOString() : null;
    } else {
      dueAt = calculatePresetDate(form.duePreset);
    }

    try {
      const response = await fetchWithAuth("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          notes: form.notes.trim(),
          websiteId: form.websiteId === "unassigned" ? null : form.websiteId,
          folderId: form.folderId === "unassigned" ? null : form.folderId,
          dueAt,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create task");
      }

      const data = await response.json();
      const newTodo = data.todo;
      if (newTodo) {
        setTodos((prev) => [newTodo, ...prev]);
      } else {
        load();
      }

      // If user enabled Google Calendar sync on create and there's a deadline, open Google Calendar with 2h alert
      if (syncToGcalOnCreate && dueAt) {
        const gcalUrl = buildGoogleCalendarUrl({
          title: form.title.trim(),
          dueAt,
          notes: form.notes.trim(),
          website: websites.find((w) => w._id === form.websiteId),
          folder: folders.find((f) => f._id === form.folderId),
        });
        window.open(gcalUrl, "_blank", "noopener,noreferrer");
      }

      toast.success("Task created!", {
        description: `"${form.title.trim()}" added to your todo list.${
          syncToGcalOnCreate && dueAt ? " Opening Google Calendar with 2-hour alert..." : ""
        }`,
      });

      setForm({
        title: "",
        notes: "",
        websiteId: "unassigned",
        folderId: "unassigned",
        duePreset: "today",
        customDueAt: "",
      });
      setSyncToGcalOnCreate(false);
      setMobileTab("tasks");
    } catch (err) {
      toast.error((err as Error).message || "Could not add task");
    } finally {
      setSubmitting(false);
    }
  }

  // Toggle complete
  async function toggleComplete(id: string, currentCompleted: boolean) {
    const nextCompleted = !currentCompleted;
    // Optimistic update
    setTodos((prev) =>
      prev.map((t) =>
        t._id === id
          ? { ...t, completedAt: nextCompleted ? new Date().toISOString() : null }
          : t,
      ),
    );

    try {
      const response = await fetchWithAuth(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: nextCompleted }),
      });
      if (response.ok) {
        toast.success(nextCompleted ? "Task completed! 🎉" : "Task reopened");
      } else {
        // Rollback
        load();
      }
    } catch {
      load();
    }
  }

  // Delete task
  async function deleteTodo(id: string, title: string) {
    const deletedTodo = todos.find((t) => t._id === id);
    // Optimistic remove
    setTodos((prev) => prev.filter((t) => t._id !== id));

    try {
      const response = await fetchWithAuth(`/api/todos/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Task deleted", {
          description: `"${title}" has been removed.`,
          action: deletedTodo
            ? {
                label: "Undo",
                onClick: async () => {
                  try {
                    await fetchWithAuth("/api/todos", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: deletedTodo.title,
                        notes: deletedTodo.notes,
                        websiteId: deletedTodo.websiteId?._id || null,
                        folderId: deletedTodo.folderId?._id || null,
                        dueAt: deletedTodo.dueAt || null,
                      }),
                    });
                    load();
                    toast.success("Task restored");
                  } catch {
                    toast.error("Could not restore task");
                  }
                },
              }
            : undefined,
        });
      } else {
        load();
      }
    } catch {
      load();
    }
  }

  // Batch Selection & Bulk Operations
  const toggleTodoSelect = (id: string) => {
    setSelectedTodoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    if (selectedTodoIds.size === filteredTodos.length) {
      setSelectedTodoIds(new Set());
    } else {
      setSelectedTodoIds(new Set(filteredTodos.map((t) => t._id)));
    }
  };

  const handleBatchStatus = async (complete: boolean) => {
    if (selectedTodoIds.size === 0) return;
    setIsBatchOperating(true);
    const ids = Array.from(selectedTodoIds);
    try {
      const res = await fetchWithAuth("/api/todos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, complete }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(
        complete
          ? `Marked ${data.modifiedCount || ids.length} tasks completed`
          : `Marked ${data.modifiedCount || ids.length} tasks open`
      );
      setSelectedTodoIds(new Set());
      load();
    } catch {
      toast.error("Failed to update tasks");
    } finally {
      setIsBatchOperating(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedTodoIds.size === 0) return;
    setIsBatchOperating(true);
    const ids = Array.from(selectedTodoIds);
    try {
      const res = await fetchWithAuth("/api/todos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`Deleted ${data.deletedCount || ids.length} tasks`);
      setSelectedTodoIds(new Set());
      load();
    } catch {
      toast.error("Failed to delete tasks");
    } finally {
      setIsBatchOperating(false);
    }
  };

  // Start inline editing
  function startEditing(todo: TodoItem) {
    setEditingTodoId(todo._id);
    let dueAtLocal = "";
    if (todo.dueAt) {
      const d = new Date(todo.dueAt);
      const pad = (n: number) => String(n).padStart(2, "0");
      dueAtLocal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    setEditForm({
      title: todo.title,
      notes: todo.notes || "",
      websiteId: todo.websiteId?._id || "unassigned",
      folderId: todo.folderId?._id || "unassigned",
      dueAt: dueAtLocal,
    });
  }

  // Save inline edit
  async function saveEdit(id: string) {
    if (!editForm.title.trim()) {
      toast.error("Task title cannot be empty");
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title.trim(),
          notes: editForm.notes.trim(),
          websiteId: editForm.websiteId === "unassigned" ? null : editForm.websiteId,
          folderId: editForm.folderId === "unassigned" ? null : editForm.folderId,
          dueAt: editForm.dueAt ? new Date(editForm.dueAt).toISOString() : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.todo) {
          setTodos((prev) => prev.map((t) => (t._id === id ? data.todo : t)));
        } else {
          load();
        }
        setEditingTodoId(null);
        toast.success("Task updated!");
      } else {
        toast.error("Failed to update task");
      }
    } catch {
      toast.error("Failed to update task");
    }
  }

  // Copy task details to clipboard
  const copyTaskDetails = (todo: TodoItem) => {
    const text = [
      `Task: ${todo.title}`,
      todo.folderId ? `Folder: ${todo.folderId.name}` : null,
      todo.websiteId ? `Website: ${todo.websiteId.url}` : null,
      todo.dueAt ? `Due: ${new Date(todo.dueAt).toLocaleString()}` : null,
      todo.notes ? `\nNotes:\n${todo.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(text);
    toast.success("Task details copied to clipboard!");
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--nb-bg)" }}>
      <Navbar search={searchQuery} onSearchChange={setSearchQuery} />

      {/* Mobile sliding view switcher (visible on < lg only) */}
      <div className="lg:hidden shrink-0 border-b-2 border-nb-border bg-nb-card px-3 py-2 z-10">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-nb-surface p-1 border-2 border-nb-border shadow-nb-xs">
          <button
            type="button"
            onClick={() => setMobileTab("tasks")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-black transition-all cursor-pointer ${
              mobileTab === "tasks"
                ? "bg-indigo-600 text-white shadow-nb-xs"
                : "text-nb-muted hover:text-nb-fg"
            }`}
          >
            <ListTodo className="size-3.5" />
            <span>Tasks ({filteredTodos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("create")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-black transition-all cursor-pointer ${
              mobileTab === "create"
                ? "bg-indigo-600 text-white shadow-nb-xs"
                : "text-nb-muted hover:text-nb-fg"
            }`}
          >
            <Plus className="size-3.5" />
            <span>New Task</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("stats")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-black transition-all cursor-pointer ${
              mobileTab === "stats"
                ? "bg-indigo-600 text-white shadow-nb-xs"
                : "text-nb-muted hover:text-nb-fg"
            }`}
          >
            <Sparkles className="size-3.5" />
            <span>Progress</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left & Right Columns, No Page-Level Window Scroll */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden w-full mx-auto nb-page-enter">
        {/* LEFT COLUMN: Sidebar with Progress, Create Form & Folders */}
        <aside
          className={`lg:flex flex-col h-full lg:w-[380px] xl:w-[420px] 2xl:w-[450px] shrink-0 border-r-2 border-nb-border bg-nb-card overflow-hidden ${
            mobileTab !== "tasks" ? "flex flex-1" : "hidden"
          }`}
        >
          {/* Left Column Header (Fixed) */}
          <div className="shrink-0 flex items-center justify-between p-3.5 sm:p-4 border-b-2 border-nb-border bg-nb-card/90">
            <div className="flex items-center gap-2.5">
              <span
                className="flex size-9 items-center justify-center rounded-xl border-2 border-nb-border shadow-nb-xs"
                style={{ background: "var(--nb-primary)", color: "var(--nb-primary-fg)" }}
              >
                <CalendarHeart className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-black tracking-tight" style={{ color: "var(--nb-fg)" }}>
                    Tasks & Todos
                  </h1>
                  <span className="nb-tag font-mono font-bold text-[10px]">
                    {totals.completed}/{totals.all}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-nb-muted truncate max-w-[190px]">
                  2h alerts • G-Cal synced
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowCalendarModal(true)}
                className="nb-btn nb-btn-surface nb-btn-sm text-xs font-bold gap-1 px-2 border-2 border-nb-border cursor-pointer"
                title="Google Calendar Integration & Sync"
                aria-label="Google Calendar Integration"
              >
                <CalendarDays className="size-3.5 text-indigo-500" />
                <span className="hidden sm:inline">G-Cal</span>
              </button>

              <button
                type="button"
                onClick={() => load()}
                className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm size-8 cursor-pointer"
                title="Refresh tasks"
                aria-label="Refresh tasks"
              >
                <RotateCcw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Left Column Scroll Container (Internal Scroll Only) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 scrollbar-thin">
            {/* 1. Progress & Momentum Widget */}
            <section
              className={`rounded-2xl border-2 border-nb-border p-3.5 shadow-nb-xs bg-nb-surface ${
                mobileTab === "stats" || mobileTab === "tasks" ? "block" : "hidden lg:block"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-black flex items-center gap-1.5 text-nb-fg">
                  <Sparkles className="size-3.5 text-amber-500 animate-pulse" />
                  <span>Daily Momentum</span>
                </span>
                <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
                  {completionRate}% completed
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2.5 w-full overflow-hidden rounded-full border border-nb-border bg-nb-surface-alt">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${completionRate}%`,
                    backgroundColor:
                      completionRate === 100
                        ? "var(--nb-success)"
                        : completionRate > 50
                          ? "var(--nb-primary)"
                          : "var(--nb-accent)",
                  }}
                />
              </div>

              {/* Status Chips */}
              <div className="grid grid-cols-2 gap-1.5 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setFilter("open");
                    if (window.innerWidth < 1024) setMobileTab("tasks");
                  }}
                  className={`flex items-center justify-between rounded-xl border p-2 text-left transition-all cursor-pointer ${
                    filter === "open"
                      ? "bg-indigo-500/15 border-indigo-600 dark:border-indigo-400 font-black shadow-nb-xs"
                      : "border-nb-border/40 bg-nb-surface-alt/70 hover:bg-nb-surface-alt text-nb-fg"
                  }`}
                >
                  <span className="text-[11px] font-bold flex items-center gap-1.5">
                    <Circle className="size-3 text-indigo-500" />
                    Open
                  </span>
                  <span className="nb-tag font-mono text-[10px]">{totals.open}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFilter("dueSoon");
                    if (window.innerWidth < 1024) setMobileTab("tasks");
                  }}
                  className={`flex items-center justify-between rounded-xl border p-2 text-left transition-all cursor-pointer ${
                    filter === "dueSoon"
                      ? "bg-amber-500/20 border-amber-500 font-black shadow-nb-xs"
                      : "border-nb-border/40 bg-nb-surface-alt/70 hover:bg-nb-surface-alt text-nb-fg"
                  } ${totals.dueSoon2Hours > 0 ? "border-amber-500 animate-pulse" : ""}`}
                >
                  <span className="text-[11px] font-bold flex items-center gap-1.5">
                    <BellRing className={`size-3 ${totals.dueSoon2Hours > 0 ? "text-amber-500" : "text-nb-muted"}`} />
                    2h Alert
                  </span>
                  <span className={`nb-tag font-mono text-[10px] ${totals.dueSoon2Hours > 0 ? "bg-amber-500 text-black font-black" : ""}`}>
                    {totals.dueSoon2Hours}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFilter("overdue");
                    if (window.innerWidth < 1024) setMobileTab("tasks");
                  }}
                  className={`flex items-center justify-between rounded-xl border p-2 text-left transition-all cursor-pointer ${
                    filter === "overdue"
                      ? "bg-rose-500/15 border-rose-600 font-black shadow-nb-xs"
                      : "border-nb-border/40 bg-nb-surface-alt/70 hover:bg-nb-surface-alt text-nb-fg"
                  }`}
                >
                  <span className="text-[11px] font-bold flex items-center gap-1.5">
                    <AlertTriangle className={`size-3 ${totals.overdue > 0 ? "text-rose-500" : "text-nb-muted"}`} />
                    Overdue
                  </span>
                  <span className={`nb-tag font-mono text-[10px] ${totals.overdue > 0 ? "bg-rose-500 text-white font-black" : ""}`}>
                    {totals.overdue}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFilter("completed");
                    if (window.innerWidth < 1024) setMobileTab("tasks");
                  }}
                  className={`flex items-center justify-between rounded-xl border p-2 text-left transition-all cursor-pointer ${
                    filter === "completed"
                      ? "bg-emerald-500/15 border-emerald-600 font-black shadow-nb-xs"
                      : "border-nb-border/40 bg-nb-surface-alt/70 hover:bg-nb-surface-alt text-nb-fg"
                  }`}
                >
                  <span className="text-[11px] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Completed
                  </span>
                  <span className="nb-tag nb-tag-success font-mono text-[10px]">{totals.completed}</span>
                </button>
              </div>
            </section>

            {/* 2. Create Task Card */}
            <section
              className={`rounded-2xl border-2 border-nb-border p-3.5 sm:p-4 shadow-nb-xs bg-nb-surface ${
                mobileTab === "create" || mobileTab === "tasks" ? "block" : "hidden lg:block"
              }`}
            >
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-nb-border/30">
                <h2 className="text-xs font-black tracking-tight text-nb-fg flex items-center gap-1.5">
                  <Plus className="size-4 text-emerald-500" />
                  <span>Create New Task</span>
                </h2>
              </div>

              {/* Quick Action Prefixes */}
              <div className="flex flex-wrap gap-1 mb-2.5">
                {quickActions.map((qa) => (
                  <button
                    key={qa.label}
                    type="button"
                    onClick={() => applyQuickAction(qa.prefix)}
                    className="rounded-md border border-nb-border/40 bg-nb-surface-alt px-1.5 py-0.5 text-[10px] font-bold hover:border-nb-border text-nb-fg transition-colors cursor-pointer"
                  >
                    {qa.label}
                  </button>
                ))}
              </div>

              <form onSubmit={createTodo} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-black mb-1 text-nb-fg">
                    Task Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={titleInputRef}
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm((cur) => ({ ...cur, title: e.target.value }))}
                    placeholder="e.g. Deploy feature or review PR"
                    className="nb-input w-full text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="flex items-center gap-1 text-[11px] font-black mb-1 text-nb-fg">
                      <Folder className="size-3 text-indigo-500" />
                      <span>Folder</span>
                    </label>
                    <div className="relative">
                      <select
                        value={form.folderId}
                        onChange={(e) => handleFormFolderChange(e.target.value)}
                        className="nb-input w-full pr-6 text-xs font-bold appearance-none py-1.5"
                      >
                        <option value="unassigned">📂 None</option>
                        {folders.map((f) => (
                          <option key={f._id} value={f._id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3 text-nb-muted" />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-[11px] font-black mb-1 text-nb-fg">
                      <Globe className="size-3 text-emerald-500" />
                      <span>Website</span>
                    </label>
                    <div className="relative">
                      <select
                        value={form.websiteId}
                        onChange={(e) => handleWebsiteChange(e.target.value)}
                        className="nb-input w-full pr-6 text-xs font-bold appearance-none py-1.5"
                      >
                        <option value="unassigned">🌐 None</option>
                        {availableWebsitesForCreate.map((w) => (
                          <option key={w._id} value={w._id}>
                            {w.title || w.domain}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3 text-nb-muted" />
                    </div>
                  </div>
                </div>

                {/* Due Date Shortcut Pills */}
                <div>
                  <label className="flex items-center gap-1 text-[11px] font-black mb-1 text-nb-fg">
                    <Calendar className="size-3 text-indigo-500" />
                    <span>Due Date</span>
                  </label>

                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: "today", label: "Today" },
                      { id: "tomorrow", label: "Tomorrow" },
                      { id: "3days", label: "In 3d" },
                      { id: "week", label: "In 1w" },
                      { id: "none", label: "None" },
                      { id: "custom", label: "Custom..." },
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          setForm((cur) => ({
                            ...cur,
                            duePreset: preset.id as DuePreset,
                            customDueAt:
                              preset.id === "custom" && !cur.customDueAt
                                ? new Date().toISOString().slice(0, 16)
                                : cur.customDueAt,
                          }))
                        }
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-bold border transition-all cursor-pointer ${
                          form.duePreset === preset.id
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-nb-xs font-black"
                            : "border-nb-border/40 bg-nb-surface text-nb-muted hover:text-nb-fg"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {form.duePreset === "custom" && (
                    <div className="mt-1.5">
                      <input
                        type="datetime-local"
                        value={form.customDueAt}
                        onChange={(e) => setForm((cur) => ({ ...cur, customDueAt: e.target.value }))}
                        className="nb-input w-full py-1 text-xs font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* Notes Textarea */}
                <div>
                  <label className="block text-[11px] font-black mb-1 text-nb-fg">
                    Description & Notes
                  </label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((cur) => ({ ...cur, notes: e.target.value }))}
                    placeholder="Type details, steps, or checklist (newlines preserved)..."
                    className="nb-input w-full text-xs font-medium resize-y"
                  />
                </div>

                {/* Google Calendar Checkbox & Submit */}
                <div className="space-y-2 pt-1 border-t border-nb-border/30">
                  {form.duePreset !== "none" && (
                    <label className="flex items-center gap-2 cursor-pointer select-none rounded-lg border border-nb-border/40 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-bold text-nb-fg">
                      <input
                        type="checkbox"
                        checked={syncToGcalOnCreate}
                        onChange={(e) => setSyncToGcalOnCreate(e.target.checked)}
                        className="size-3.5 rounded border-nb-border text-indigo-600 cursor-pointer"
                      />
                      <span>Sync with Google Cal (2h alert)</span>
                    </label>
                  )}

                  <button
                    type="submit"
                    disabled={!form.title.trim() || submitting}
                    className="nb-btn nb-btn-primary w-full py-2 text-xs font-black justify-center shadow-nb-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Plus className="size-4" />
                    <span>{submitting ? "Adding..." : "Add Task to Todo"}</span>
                  </button>
                </div>
              </form>
            </section>

            {/* 3. Folder Filter Navigator */}
            <section
              className={`rounded-2xl border-2 border-nb-border p-3.5 shadow-nb-xs bg-nb-surface ${
                mobileTab === "stats" || mobileTab === "tasks" ? "block" : "hidden lg:block"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-1.5 text-xs font-black text-nb-fg">
                  <Folder className="size-3.5 text-indigo-500" />
                  <span>Folders & Projects</span>
                </label>
                {selectedFolderId !== "all" && (
                  <button
                    type="button"
                    onClick={() => handleFolderFilterSelect("all")}
                    className="text-[11px] font-bold text-indigo-500 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    handleFolderFilterSelect("all");
                    if (window.innerWidth < 1024) setMobileTab("tasks");
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all border cursor-pointer ${
                    selectedFolderId === "all"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-nb-xs font-black"
                      : "border-transparent hover:bg-nb-surface-alt text-nb-fg"
                  }`}
                >
                  <span>All Folders</span>
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    selectedFolderId === "all" ? "bg-white/20 text-white" : "bg-nb-surface-alt text-nb-muted"
                  }`}>
                    {folderCounts.all || 0}
                  </span>
                </button>

                {folders.map((folder) => {
                  const isSelected = selectedFolderId === folder._id;
                  const count = folderCounts[folder._id] || 0;
                  return (
                    <button
                      key={folder._id}
                      type="button"
                      onClick={() => {
                        handleFolderFilterSelect(folder._id);
                        if (window.innerWidth < 1024) setMobileTab("tasks");
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all border cursor-pointer ${
                        isSelected
                          ? "shadow-nb-xs font-black border-nb-border"
                          : "border-transparent hover:bg-nb-surface-alt text-nb-fg"
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: folder.color || "var(--nb-primary)", color: "#ffffff" }
                          : {}
                      }
                    >
                      <div className="flex items-center gap-2 truncate mr-2">
                        <span
                          className="size-2 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: folder.color || "#6366f1" }}
                        />
                        <span className="truncate">{folder.name}</span>
                      </div>
                      <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono shrink-0 ${
                        isSelected ? "bg-white/25 text-white" : "bg-nb-surface-alt text-nb-muted"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    handleFolderFilterSelect("unassigned");
                    if (window.innerWidth < 1024) setMobileTab("tasks");
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all border cursor-pointer ${
                    selectedFolderId === "unassigned"
                      ? "bg-zinc-700 text-white border-zinc-700 shadow-nb-xs font-black"
                      : "border-transparent hover:bg-nb-surface-alt text-nb-fg"
                  }`}
                >
                  <span>📂 Unassigned</span>
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    selectedFolderId === "unassigned" ? "bg-white/20 text-white" : "bg-nb-surface-alt text-nb-muted"
                  }`}>
                    {folderCounts.unassigned || 0}
                  </span>
                </button>
              </div>
            </section>
          </div>
        </aside>

        {/* RIGHT COLUMN: Stream of Tasks with Filter Slider */}
        <section
          className={`flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-nb-bg ${
            mobileTab === "tasks" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Right Column Top Bar: Search, Sort & Interactive Filter Slider */}
          <div className="shrink-0 border-b-2 border-nb-border bg-nb-card p-3 sm:p-4 space-y-2.5">
            {/* Search & Sort row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-nb-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks, notes, folders, or websites..."
                  className="nb-input w-full pl-9 pr-8 text-xs font-bold"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nb-muted hover:text-nb-fg cursor-pointer"
                    aria-label="Clear search query"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                <span className="text-xs font-mono font-bold text-nb-muted">
                  {filteredTodos.length} {filteredTodos.length === 1 ? "task" : "tasks"}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-nb-muted hidden md:inline">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="nb-input py-1 text-xs font-bold"
                    aria-label="Sort tasks by"
                  >
                    <option value="due">Urgent (Due First)</option>
                    <option value="created">Recently Created</option>
                    <option value="title">Alphabetical (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Interactive Filter Slider */}
            <div className="relative flex items-center gap-1 pt-0.5">
              <button
                type="button"
                onClick={() => scrollSlider("left")}
                className="hidden sm:flex size-7 shrink-0 items-center justify-center rounded-lg border-2 border-nb-border bg-nb-surface text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt transition-colors shadow-nb-xs cursor-pointer"
                aria-label="Slide filters left"
                title="Slide left"
              >
                <ChevronLeft className="size-4" />
              </button>

              <div
                ref={sliderRef}
                className="flex items-center gap-1.5 overflow-x-auto py-1 scroll-smooth flex-1 scrollbar-none"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {[
                  { id: "all", label: "All Tasks", count: totals.all, icon: ListTodo },
                  { id: "open", label: "Open", count: totals.open, icon: Circle, color: "text-indigo-500" },
                  { id: "dueSoon", label: "2h Alert", count: totals.dueSoon2Hours, icon: BellRing, color: totals.dueSoon2Hours > 0 ? "text-amber-500 animate-bounce" : "text-nb-muted" },
                  { id: "today", label: "Due Today", count: totals.today, icon: Clock3, color: "text-amber-500" },
                  { id: "overdue", label: "Overdue", count: totals.overdue, icon: AlertTriangle, color: totals.overdue > 0 ? "text-rose-500" : "text-nb-muted" },
                  { id: "completed", label: "Completed", count: totals.completed, icon: CheckCircle2, color: "text-emerald-500" },
                ].map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = filter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFilter(tab.id as typeof filter)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "border-nb-border bg-indigo-600 text-white font-black shadow-nb-xs"
                          : "border-nb-border/40 bg-nb-surface text-nb-fg hover:border-nb-border hover:bg-nb-surface-alt"
                      }`}
                    >
                      <TabIcon className={`size-3.5 ${isActive ? "text-white" : tab.color || ""}`} />
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                          isActive ? "bg-white/20 text-white font-black" : "bg-nb-surface-alt text-nb-muted"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollSlider("right")}
                className="hidden sm:flex size-7 shrink-0 items-center justify-center rounded-lg border-2 border-nb-border bg-nb-surface text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt transition-colors shadow-nb-xs cursor-pointer"
                aria-label="Slide filters right"
                title="Slide right"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {/* Pinned 2-Hour Alert Banner (if any) */}
          {tasksDueWithin2Hours.length > 0 && (
            <div className="shrink-0 border-b-2 border-amber-500 bg-amber-500/15 p-3 sm:px-5 flex flex-wrap items-center justify-between gap-2.5 animate-pulse">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500 text-black font-black">
                  <BellRing className="size-4" />
                </span>
                <span className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-100">
                  Urgent: {tasksDueWithin2Hours.length} task(s) due within 2 hours!
                </span>
              </div>
              <div className="flex items-center gap-2">
                {notificationPermission !== "granted" && (
                  <button
                    type="button"
                    onClick={requestNotificationAccess}
                    className="rounded-lg border-2 border-nb-border bg-amber-400 text-black px-2.5 py-1 text-[11px] font-black hover:bg-amber-300 cursor-pointer"
                  >
                    🔔 Alerts On
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFilter("dueSoon")}
                  className="rounded-lg border-2 border-nb-border bg-nb-surface text-nb-fg px-2.5 py-1 text-[11px] font-black hover:bg-nb-surface-alt cursor-pointer"
                >
                  Filter 2h Alert
                </button>
              </div>
            </div>
          )}

          {/* Main Task Stream (Internal Scroll Container) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 lg:p-6 space-y-3 scrollbar-thin">
            {/* Task List Grid / Display */}
          {loading ? (
            <div className="nb-card-static grid min-h-64 place-items-center border-dashed" style={{ borderStyle: "dashed" }}>
              <div className="text-center space-y-2">
                <div className="size-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="text-sm font-bold" style={{ color: "var(--nb-muted)" }}>
                  Loading your tasks...
                </div>
              </div>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div
              className="nb-card-static rounded-2xl border-dashed p-10 text-center space-y-3"
              style={{ borderStyle: "dashed", background: "var(--nb-surface-alt)" }}
            >
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 border-2 border-nb-border">
                {filter === "completed" ? (
                  <CheckCircle2 className="size-6 text-emerald-500" />
                ) : filter === "overdue" ? (
                  <AlertTriangle className="size-6 text-amber-500" />
                ) : filter === "dueSoon" ? (
                  <BellRing className="size-6 text-amber-500" />
                ) : (
                  <Sparkles className="size-6" />
                )}
              </div>
              <h3 className="text-base font-black" style={{ color: "var(--nb-fg)" }}>
                {filter === "completed"
                  ? "No completed tasks yet"
                  : filter === "overdue"
                    ? "Great news! No overdue tasks! 🎉"
                    : filter === "dueSoon"
                      ? "No tasks due within the next 2 hours."
                      : searchQuery
                        ? "No tasks match your search query"
                        : "No tasks found in this view"}
              </h3>
              <p className="text-xs max-w-sm mx-auto" style={{ color: "var(--nb-muted)" }}>
                {searchQuery
                  ? "Try clearing your search or selecting a different folder filter."
                  : filter === "completed"
                    ? "Check off tasks as you finish them to see your accomplishments here."
                    : "Add your first task above with notes, a linked website, and folder to stay organized!"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTodos.map((todo) => {
                const isCompleted = Boolean(todo.completedAt);
                const isEditing = editingTodoId === todo._id;
                const dueInfo = formatDueDate(todo.dueAt);
                const isNotesLong = (todo.notes?.length || 0) > 300 || (todo.notes?.split("\n").length || 0) > 5;
                const isNotesExpanded = expandedNotes[todo._id];

                if (isEditing) {
                  return (
                    <article
                      key={todo._id}
                      className="nb-card-static rounded-2xl p-4 sm:p-5 border-3 border-indigo-500 shadow-nb-md bg-nb-surface space-y-3"
                    >
                      <div className="flex items-center justify-between border-b pb-2 border-nb-border/30">
                        <span className="text-xs font-black text-indigo-500 flex items-center gap-1.5">
                          <Pencil className="size-3.5" />
                          <span>Editing Task</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingTodoId(null)}
                          className="text-xs text-nb-muted hover:text-nb-fg"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="lg:col-span-3">
                          <label className="block text-xs font-black mb-1">Title</label>
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm((cur) => ({ ...cur, title: e.target.value }))}
                            className="nb-input w-full font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black mb-1">Folder</label>
                          <select
                            value={editForm.folderId}
                            onChange={(e) => handleEditFolderChange(e.target.value)}
                            className="nb-input w-full font-bold"
                          >
                            <option value="unassigned">📂 No Folder (Unassigned)</option>
                            {folders.map((f) => (
                              <option key={f._id} value={f._id}>
                                📁 {f.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-black">Linked Website</label>
                            <span className="text-[10px] font-bold text-nb-muted">
                              {availableWebsitesForEdit.length} in folder
                            </span>
                          </div>
                          <select
                            value={editForm.websiteId}
                            onChange={(e) => setEditForm((cur) => ({ ...cur, websiteId: e.target.value }))}
                            className="nb-input w-full font-bold"
                          >
                            <option value="unassigned">🌐 No Website</option>
                            {availableWebsitesForEdit.map((w) => (
                              <option key={w._id} value={w._id}>
                                {w.title || w.domain}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-black mb-1">Due Date & Time</label>
                          <input
                            type="datetime-local"
                            value={editForm.dueAt}
                            onChange={(e) => setEditForm((cur) => ({ ...cur, dueAt: e.target.value }))}
                            className="nb-input w-full font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-black">Description & Notes (Preserves Newlines)</label>
                          <span className="text-[10px] text-emerald-600 font-bold">✨ Line breaks preserved</span>
                        </div>
                        <textarea
                          rows={4}
                          value={editForm.notes}
                          onChange={(e) => setEditForm((cur) => ({ ...cur, notes: e.target.value }))}
                          placeholder="Type description, steps, or notes..."
                          className="nb-input w-full font-medium leading-relaxed resize-y"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-nb-border/20">
                        <button
                          type="button"
                          onClick={() => setEditingTodoId(null)}
                          className="nb-btn nb-btn-surface nb-btn-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEdit(todo._id)}
                          className="nb-btn nb-btn-primary nb-btn-sm"
                        >
                          Save Changes
                        </button>
                      </div>
                    </article>
                  );
                }

                const isSelected = selectedTodoIds.has(todo._id);
                const isMenuOpen = openMenuTodoId === todo._id;

                return (
                  <article
                    key={todo._id}
                    className={`nb-card-sm nb-card-enter rounded-2xl p-4 sm:p-5 transition-all hover:-translate-x-0.5 border-2 border-nb-border relative ${
                      isMenuOpen ? "z-30" : "z-auto"
                    } ${
                      isSelected
                        ? "bg-indigo-50/20"
                        : isCompleted
                          ? "opacity-85 bg-nb-surface-alt/70"
                          : "bg-nb-surface"
                    } ${dueInfo.isWithin2Hours && !isCompleted ? "border-amber-500 shadow-nb-sm" : ""}`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Batch Selection Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleTodoSelect(todo._id);
                        }}
                        aria-label={isSelected ? "Deselect task" : "Select task"}
                        title={isSelected ? "Deselect task" : "Select task"}
                        className={`flex size-6 shrink-0 items-center justify-center rounded-lg border-2 mt-0.5 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-nb-xs"
                            : "border-nb-border bg-nb-card hover:border-indigo-400"
                        }`}
                      >
                        {isSelected ? (
                          <Check className="size-3.5 stroke-[3]" />
                        ) : (
                          <span className="size-2 rounded-sm bg-transparent group-hover:bg-nb-muted/40" />
                        )}
                      </button>

                      {/* Checkbox Button */}
                      <button
                        type="button"
                        onClick={() => toggleComplete(todo._id, isCompleted)}
                        className="mt-0.5 shrink-0 transition-transform active:scale-90"
                        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="size-6 text-emerald-500 fill-emerald-500/20 nb-pop-in" />
                        ) : (
                          <Circle className="size-6 text-nb-muted hover:text-emerald-500 transition-colors hover:scale-110" />
                        )}
                      </button>

                      {/* Main Task Content */}
                      <div className="min-w-0 flex-1 space-y-2">
                        {/* Title and Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`text-sm sm:text-base font-black tracking-tight ${
                              isCompleted ? "line-through opacity-60 text-nb-muted" : "text-nb-fg"
                            }`}
                          >
                            {todo.title}
                          </h3>

                          {/* 2-Hour Alert Urgent Badge */}
                          {dueInfo.isWithin2Hours && !isCompleted && (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500 bg-amber-500/20 px-2 py-0.5 text-[11px] font-black text-amber-700 dark:text-amber-300">
                              <BellRing className="size-3 animate-bounce" />
                              <span>Alert: Due within 2 hours</span>
                            </span>
                          )}

                          {/* Folder Badge */}
                          {todo.folderId && (
                            <button
                              type="button"
                              onClick={() => setSelectedFolderId(todo.folderId!._id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-black transition-transform hover:scale-105"
                              style={{
                                backgroundColor: `${todo.folderId.color || "#6366f1"}20`,
                                color: todo.folderId.color || "#6366f1",
                                borderColor: `${todo.folderId.color || "#6366f1"}50`,
                              }}
                              title={`Filter by folder: ${todo.folderId.name}`}
                            >
                              <Folder className="size-3" />
                              <span>{todo.folderId.name}</span>
                            </button>
                          )}

                          {/* Website Badge */}
                          {todo.websiteId && (
                            <a
                              href={todo.websiteId.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-nb-border bg-nb-surface px-2 py-0.5 text-[11px] font-bold text-nb-fg shadow-nb-xs hover:bg-nb-surface-alt transition-colors"
                              title={`Visit ${todo.websiteId.url}`}
                            >
                              {todo.websiteId.faviconUrl ? (
                                <img
                                  src={todo.websiteId.faviconUrl}
                                  alt=""
                                  className="size-3.5 rounded object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <Globe className="size-3 text-emerald-500" />
                              )}
                              <span className="truncate max-w-[150px]">
                                {todo.websiteId.title || todo.websiteId.domain}
                              </span>
                              <ExternalLink className="size-2.5 opacity-60" />
                            </a>
                          )}
                        </div>

                        {/* Multiline Description / Notes (Strictly preserving newlines as typed) */}
                        {todo.notes && (
                          <div className="mt-2 rounded-xl border border-nb-border/30 bg-nb-surface-alt/70 p-3 shadow-nb-xs">
                            <p
                              className={`whitespace-pre-wrap break-words text-xs sm:text-sm font-medium leading-relaxed ${
                                isCompleted ? "line-through opacity-70 text-nb-muted" : "text-nb-fg"
                              } ${!isNotesExpanded && isNotesLong ? "line-clamp-4" : ""}`}
                            >
                              {todo.notes}
                            </p>

                            {isNotesLong && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedNotes((cur) => ({ ...cur, [todo._id]: !cur[todo._id] }))
                                }
                                className="mt-1 text-[11px] font-bold text-indigo-500 hover:underline"
                              >
                                {isNotesExpanded ? "Show less" : "Show full notes..."}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Meta Tags: Due Date, Google Calendar Button, Created */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                          {/* Due Date Status */}
                          {dueInfo.label && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold ${
                                dueInfo.isWithin2Hours && !isCompleted
                                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/50"
                                  : dueInfo.isOverdue && !isCompleted
                                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/40"
                                    : dueInfo.isToday && !isCompleted
                                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                                      : "bg-nb-surface border border-nb-border/40 text-nb-muted"
                              }`}
                            >
                              {dueInfo.isWithin2Hours && !isCompleted ? (
                                <BellRing className="size-3 text-amber-600" />
                              ) : dueInfo.isOverdue && !isCompleted ? (
                                <AlertTriangle className="size-3 text-rose-500" />
                              ) : (
                                <Clock3 className="size-3" />
                              )}
                              <span>{dueInfo.label}</span>
                            </span>
                          )}

                          {/* One-Click Google Calendar with 2-Hour Alert Button */}
                          {todo.dueAt && !isCompleted && (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openInGoogleCalendar(todo)}
                                className="inline-flex items-center gap-1 rounded-md border border-indigo-500/40 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all shadow-nb-xs"
                                title="Add to Google Calendar (Alert triggers 2h before deadline)"
                              >
                                <Calendar className="size-3 text-indigo-500" />
                                <span>Google Calendar</span>
                                <span className="rounded bg-indigo-500/20 px-1 py-0.2 text-[9px] font-mono">
                                  2h alert
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => downloadIcs(todo)}
                                className="rounded-md border border-nb-border/40 bg-nb-surface p-1 text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt transition-colors"
                                title="Download .ics reminder file (2h alert)"
                              >
                                <Download className="size-3" />
                              </button>
                            </div>
                          )}

                          {/* Completed timestamp */}
                          {todo.completedAt && (
                            <span className="nb-tag nb-tag-success text-[10px] font-bold">
                              ✓ Completed {new Date(todo.completedAt).toLocaleDateString()}
                            </span>
                          )}

                          {/* Created date */}
                          {todo.createdAt && (
                            <span className="text-[11px] font-medium text-nb-muted hidden sm:inline">
                              Created {new Date(todo.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Strictly ONE 3-dots Action Menu */}
                      <div className="relative self-start shrink-0" data-todo-menu>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuTodoId(openMenuTodoId === todo._id ? null : todo._id);
                          }}
                          className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm"
                          aria-label={`Actions for ${todo.title}`}
                          title="More actions"
                        >
                          <MoreVertical className="size-4 text-nb-muted hover:text-nb-fg" />
                        </button>

                        {isMenuOpen && (
                          <div
                            role="menu"
                            className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border-2 border-nb-border bg-nb-card p-1.5 shadow-nb-xl z-50 text-nb-fg flex flex-col gap-0.5"
                            style={{ backgroundColor: "var(--nb-card)", color: "var(--nb-fg)" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuTodoId(null);
                                startEditing(todo);
                              }}
                              className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs font-bold rounded-lg hover:bg-nb-surface text-left transition-colors"
                            >
                              <Pencil className="size-3.5 text-nb-muted" />
                              <span>Edit Task</span>
                            </button>

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuTodoId(null);
                                copyTaskDetails(todo);
                              }}
                              className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs font-bold rounded-lg hover:bg-nb-surface text-left transition-colors"
                            >
                              <Copy className="size-3.5 text-nb-muted" />
                              <span>Copy Details</span>
                            </button>

                            {todo.dueAt && (
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setOpenMenuTodoId(null);
                                  openInGoogleCalendar(todo);
                                }}
                                className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs font-bold rounded-lg hover:bg-nb-surface text-left transition-colors text-indigo-600 dark:text-indigo-400"
                              >
                                <Calendar className="size-3.5" />
                                <span>Add to Google Cal</span>
                              </button>
                            )}

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuTodoId(null);
                                downloadIcs(todo);
                              }}
                              className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs font-bold rounded-lg hover:bg-nb-surface text-left transition-colors"
                            >
                              <Download className="size-3.5 text-nb-muted" />
                              <span>Download .ics</span>
                            </button>

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuTodoId(null);
                                toggleComplete(todo._id, isCompleted);
                              }}
                              className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs font-bold rounded-lg hover:bg-nb-surface text-left transition-colors"
                            >
                              {isCompleted ? (
                                <>
                                  <Circle className="size-3.5 text-amber-500" />
                                  <span>Mark Incomplete</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                                  <span>Mark Complete</span>
                                </>
                              )}
                            </button>

                            <div className="h-px bg-nb-border/40 my-1" />

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuTodoId(null);
                                deleteTodo(todo._id, todo.title);
                              }}
                              className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs font-bold rounded-lg hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-left transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                              <span>Delete Task</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>

      {/* Floating Batch Selection Bar */}
      {selectedTodoIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 sm:gap-3 rounded-2xl border-2 border-nb-border bg-nb-card p-2.5 sm:px-4 sm:py-3 shadow-nb-xl max-w-[94vw] animate-in fade-in slide-in-from-bottom-4">
          <span className="text-xs sm:text-sm font-extrabold whitespace-nowrap text-nb-fg">
            {selectedTodoIds.size} selected
          </span>
          <div className="h-4 w-0.5 bg-nb-border opacity-30 shrink-0" />
          <button
            type="button"
            onClick={handleSelectAllVisible}
            className="nb-btn nb-btn-surface nb-btn-sm text-xs font-bold whitespace-nowrap"
          >
            {selectedTodoIds.size === filteredTodos.length ? "Deselect All" : "Select All"}
          </button>
          <button
            type="button"
            onClick={() => handleBatchStatus(true)}
            disabled={isBatchOperating}
            className="nb-btn nb-btn-surface nb-btn-sm text-xs font-bold whitespace-nowrap flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2 className="size-3.5" />
            <span>Mark Done</span>
          </button>
          <button
            type="button"
            onClick={() => handleBatchStatus(false)}
            disabled={isBatchOperating}
            className="nb-btn nb-btn-surface nb-btn-sm text-xs font-bold whitespace-nowrap flex items-center gap-1.5 text-amber-600 dark:text-amber-400"
          >
            <Circle className="size-3.5" />
            <span>Mark Open</span>
          </button>
          <button
            type="button"
            onClick={handleBatchDelete}
            disabled={isBatchOperating}
            className="nb-btn nb-btn-danger nb-btn-sm text-xs font-bold whitespace-nowrap flex items-center gap-1.5"
          >
            {isBatchOperating ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            <span>Delete ({selectedTodoIds.size})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedTodoIds(new Set())}
            aria-label="Clear selection"
            title="Clear selection"
            className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm size-7 shrink-0"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Google Calendar Sync & Subscription Modal */}
      {showCalendarModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCalendarModal(false);
          }}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border-3 border-nb-border bg-nb-card p-5 sm:p-6 shadow-nb-xl space-y-4"
            style={{
              backgroundColor: "var(--nb-card)",
              color: "var(--nb-fg)",
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-nb-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-nb-sm border border-nb-border">
                  <CalendarDays className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight" style={{ color: "var(--nb-fg)" }}>
                    Google Calendar Integration
                  </h3>
                  <p className="text-[11px] text-nb-muted">
                    Sync tasks & receive automatic alerts 2 hours before every deadline
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="rounded-lg p-1 text-nb-muted hover:text-nb-fg hover:bg-nb-surface-alt transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Explanation card */}
            <div className="rounded-xl border-2 border-nb-border bg-indigo-500/10 p-3.5 text-xs space-y-2">
              <div className="flex items-center gap-2 font-black text-indigo-600 dark:text-indigo-400">
                <Bell className="size-4" />
                <span>Automatic 2-Hour Pre-Deadline Alerts (-PT2H)</span>
              </div>
              <p className="text-nb-muted leading-relaxed">
                All events include RFC-compliant <strong>VALARM</strong> triggers set to fire <strong>2 hours prior</strong> to your deadlines on Google Calendar, Android, iOS, and desktop calendar apps.
              </p>
            </div>

            {/* Sync Options */}
            <div className="space-y-3">
              {/* Option 1: Live Subscribe */}
              <div className="rounded-xl border-2 border-nb-border bg-nb-surface p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black" style={{ color: "var(--nb-fg)" }}>
                    1. Subscribe in Google Calendar (Live Feed)
                  </h4>
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                    Auto-Sync
                  </span>
                </div>
                <p className="text-[11px] text-nb-muted">
                  Add your WeSite Tasks calendar directly into Google Calendar. Any new task you create will automatically appear with its 2-hour alert!
                </p>
                <div className="pt-1 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const token = getAuthToken() || "";
                      const feedUrl = `${window.location.origin}/api/todos/calendar.ics${token ? `?token=${encodeURIComponent(token)}` : ""}`;
                      // Google Calendar direct subscribe URL
                      const gcalSubscribeUrl = `https://calendar.google.com/calendar/r/settings/addbyurl?cid=${encodeURIComponent(feedUrl)}`;
                      window.open(gcalSubscribeUrl, "_blank", "noopener,noreferrer");
                    }}
                    className="nb-btn nb-btn-primary nb-btn-sm flex items-center gap-1.5"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>Open in Google Calendar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const token = getAuthToken() || "";
                      const feedUrl = `${window.location.origin}/api/todos/calendar.ics${token ? `?token=${encodeURIComponent(token)}` : ""}`;
                      navigator.clipboard.writeText(feedUrl);
                      toast.success("Calendar Feed URL copied to clipboard!", {
                        description: "Paste into Google Calendar Settings -> Add by URL.",
                      });
                    }}
                    className="nb-btn nb-btn-surface nb-btn-sm flex items-center gap-1.5"
                  >
                    <Copy className="size-3.5" />
                    <span>Copy Feed URL</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Download All Tasks (.ics) */}
              <div className="rounded-xl border-2 border-nb-border bg-nb-surface p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black" style={{ color: "var(--nb-fg)" }}>
                    2. Export Active Tasks (.ics File)
                  </h4>
                  <span className="nb-tag font-mono text-[10px]">
                    {todos.filter((t) => !t.completedAt && t.dueAt).length} tasks
                  </span>
                </div>
                <p className="text-[11px] text-nb-muted">
                  Download an iCalendar (.ics) file with all your active tasks and 2-hour reminder alarms for Google Calendar, Apple Calendar, or Outlook.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={downloadAllIcs}
                    className="nb-btn nb-btn-surface nb-btn-sm flex items-center gap-1.5"
                  >
                    <Download className="size-3.5 text-indigo-500" />
                    <span>Download All Tasks (.ics)</span>
                  </button>
                </div>
              </div>

              {/* Option 3: Browser Desktop Alerts */}
              <div className="rounded-xl border-2 border-nb-border bg-nb-surface p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black" style={{ color: "var(--nb-fg)" }}>
                    3. Browser Desktop 2-Hour Alerts
                  </h4>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[10px] font-black ${
                      notificationPermission === "granted"
                        ? "bg-emerald-500/20 text-emerald-600"
                        : "bg-amber-500/20 text-amber-600"
                    }`}
                  >
                    {notificationPermission === "granted" ? "Active" : "Not Enabled"}
                  </span>
                </div>
                <p className="text-[11px] text-nb-muted">
                  Receive a desktop system alert 2 hours before every deadline when WeSite is open in your browser.
                </p>
                <div className="pt-1">
                  {notificationPermission !== "granted" ? (
                    <button
                      type="button"
                      onClick={requestNotificationAccess}
                      className="nb-btn nb-btn-primary nb-btn-sm flex items-center gap-1.5"
                    >
                      <Bell className="size-3.5" />
                      <span>Enable Browser Desktop Alerts</span>
                    </button>
                  ) : (
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Check className="size-3.5" />
                      <span>Desktop notifications are currently enabled and active.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-2 border-t border-nb-border/30">
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="nb-btn nb-btn-surface nb-btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
