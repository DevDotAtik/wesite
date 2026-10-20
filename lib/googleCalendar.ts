/**
 * Google Calendar & iCalendar (.ics) integration utilities for WeSite Todos
 * Configures event details, URLs, and 2-hour pre-deadline alerts (-PT2H)
 */

export interface CalendarTaskInput {
  id?: string;
  title: string;
  dueAt: string;
  notes?: string;
  website?: {
    title?: string;
    domain?: string;
    url?: string;
  } | null;
  folder?: {
    name?: string;
  } | null;
}

/**
 * Format a Date object into Google Calendar UTC format: YYYYMMDDTHHmmssZ
 */
export function formatGoogleCalendarUtc(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Generate a direct Google Calendar Web URL for one-click event creation
 * Sets the event end time to the deadline, with notes and 2-hour alert instructions
 */
export function buildGoogleCalendarUrl(task: CalendarTaskInput): string {
  const due = new Date(task.dueAt);
  // Default event duration: 30 minutes ending at the deadline
  const start = new Date(due.getTime() - 30 * 60 * 1000);

  const datesParam = `${formatGoogleCalendarUtc(start)}/${formatGoogleCalendarUtc(due)}`;

  const detailsParts: string[] = [];
  detailsParts.push(`Task: ${task.title}`);
  detailsParts.push(`Deadline: ${due.toLocaleString()}`);
  detailsParts.push(`⚠️ REMINDER: Alert set 2 hours before deadline.`);

  if (task.folder?.name) {
    detailsParts.push(`Folder: ${task.folder.name}`);
  }

  if (task.website?.url) {
    const siteTitle = task.website.title || task.website.domain || task.website.url;
    detailsParts.push(`Website: ${siteTitle} (${task.website.url})`);
  }

  if (task.notes && task.notes.trim()) {
    detailsParts.push(`\nNotes:\n${task.notes.trim()}`);
  }

  detailsParts.push(`\nCreated with WeSite Task Center`);

  const details = detailsParts.join("\n");
  const location = task.website?.url || "";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `[Task] ${task.title}`,
    dates: datesParam,
    details: details,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Escape text for RFC 5545 iCalendar specification
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\n|\r/g, "\\n");
}

/**
 * Generate RFC 5545 iCalendar (.ics) content for a task
 * Includes VALARM with TRIGGER:-PT2H (fires an alert 2 hours before the deadline)
 */
export function generateIcsContent(task: CalendarTaskInput): string {
  const due = new Date(task.dueAt);
  const start = new Date(due.getTime() - 30 * 60 * 1000);
  const now = new Date();

  const uid = task.id ? `task-${task.id}@wesite.app` : `task-${Date.now()}@wesite.app`;

  const detailsParts: string[] = [];
  detailsParts.push(`Task: ${task.title}`);
  detailsParts.push(`Deadline: ${due.toLocaleString()}`);
  detailsParts.push(`Alert: Notification fires 2 hours before deadline`);

  if (task.folder?.name) {
    detailsParts.push(`Folder: ${task.folder.name}`);
  }

  if (task.website?.url) {
    detailsParts.push(`Website: ${task.website.url}`);
  }

  if (task.notes && task.notes.trim()) {
    detailsParts.push(`\nNotes:\n${task.notes.trim()}`);
  }

  const description = escapeIcsText(detailsParts.join("\n"));
  const summary = escapeIcsText(`[Task] ${task.title}`);
  const location = escapeIcsText(task.website?.url || "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WeSite//Todo Task Manager//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatGoogleCalendarUtc(now)}`,
    `DTSTART:${formatGoogleCalendarUtc(start)}`,
    `DTEND:${formatGoogleCalendarUtc(due)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    location ? `LOCATION:${location}` : "",
    task.website?.url ? `URL:${task.website.url}` : "",
    "STATUS:CONFIRMED",
    // 2-Hour Alert: Display Notification in Google Calendar / OS
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: "${summary}" deadline is in 2 hours!`,
    "TRIGGER:-PT2H",
    "END:VALARM",
    // 2-Hour Alert: Email Notification if supported by Calendar app
    "BEGIN:VALARM",
    "ACTION:EMAIL",
    `SUMMARY:Reminder: "${summary}" deadline is in 2 hours!`,
    `DESCRIPTION:Your task "${summary}" is due in 2 hours at ${due.toLocaleString()}.`,
    "TRIGGER:-PT2H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/**
 * Trigger download of .ics calendar file in the browser
 */
export function downloadTaskIcs(task: CalendarTaskInput): void {
  if (typeof window === "undefined") return;

  const icsData = generateIcsContent(task);
  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const cleanTitle = (task.title || "task")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${cleanTitle || "task"}-reminder.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate iCalendar feed for multiple tasks (for Calendar Subscription URL)
 */
export function generateCalendarFeed(tasks: CalendarTaskInput[]): string {
  const now = new Date();

  const events = tasks
    .filter((t) => t.dueAt)
    .map((task) => {
      const due = new Date(task.dueAt);
      const start = new Date(due.getTime() - 30 * 60 * 1000);
      const uid = task.id ? `task-${task.id}@wesite.app` : `task-${Math.random()}@wesite.app`;

      const detailsParts: string[] = [];
      detailsParts.push(`Task: ${task.title}`);
      detailsParts.push(`Deadline: ${due.toLocaleString()}`);

      if (task.folder?.name) {
        detailsParts.push(`Folder: ${task.folder.name}`);
      }
      if (task.website?.url) {
        detailsParts.push(`Website: ${task.website.url}`);
      }
      if (task.notes && task.notes.trim()) {
        detailsParts.push(`\nNotes:\n${task.notes.trim()}`);
      }

      const description = escapeIcsText(detailsParts.join("\n"));
      const summary = escapeIcsText(`[Task] ${task.title}`);
      const location = escapeIcsText(task.website?.url || "");

      return [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${formatGoogleCalendarUtc(now)}`,
        `DTSTART:${formatGoogleCalendarUtc(start)}`,
        `DTEND:${formatGoogleCalendarUtc(due)}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        location ? `LOCATION:${location}` : "",
        task.website?.url ? `URL:${task.website.url}` : "",
        "STATUS:CONFIRMED",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:Reminder: "${summary}" deadline is in 2 hours!`,
        "TRIGGER:-PT2H",
        "END:VALARM",
        "END:VEVENT",
      ]
        .filter(Boolean)
        .join("\r\n");
    })
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WeSite//Todo Task Manager//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:WeSite Todos",
    "X-WR-CALDESC:Tasks and deadlines from WeSite with 2-hour pre-deadline alerts",
    events,
    "END:VCALENDAR",
  ].join("\r\n");
}
