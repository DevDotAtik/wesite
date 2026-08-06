export function tzOffsetLabel(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(Math.round(minutes));
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  return `${sign}${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function parseTzOffset(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(-840, Math.min(840, Math.round(parsed)));
}

export function dateKeyAtOffset(instant: number, offsetMinutes: number): string {
  return new Date(instant + offsetMinutes * 60_000).toISOString().slice(0, 10);
}

export function startOfLocalDayUtc(instant: number, offsetMinutes: number): number {
  const shifted = instant + offsetMinutes * 60_000;
  const dayStart = Math.floor(shifted / 86_400_000) * 86_400_000;
  return dayStart - offsetMinutes * 60_000;
}

export function clientTzOffsetMinutes(): number {
  if (typeof window === "undefined") return 0;
  return -new Date().getTimezoneOffset();
}
