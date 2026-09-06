const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Parses a "YYYY-MM-DD" + "HH:mm" pair into a local Date. */
export function toDateTime(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = (time || "00:00").split(":").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0);
}

/** Start-of-day Date for a "YYYY-MM-DD" string, in local time. */
export function toDateOnly(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function formatTime(time?: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Produces a friendly two-line-style label for an event date, e.g.:
 * { eyebrow: "TODAY", detail: "Saturday · 20:00" }
 * { eyebrow: "TOMORROW", detail: "Sunday · 21:00" }
 * { eyebrow: "NEXT SATURDAY", detail: "Saturday 12 September · 20:00" }
 */
export function friendlyDateLabel(
  date: string,
  startTime: string,
  endTime?: string
): { eyebrow: string; detail: string } {
  const eventDate = toDateOnly(date);
  const today = startOfDay(new Date());
  const diff = daysBetween(today, eventDate);
  const dayName = DAY_NAMES[eventDate.getDay()];
  const timeRange = endTime
    ? `${formatTime(startTime)} - ${formatTime(endTime)}`
    : formatTime(startTime);

  if (diff === 0) {
    return { eyebrow: "TODAY", detail: `${dayName} · ${timeRange}` };
  }
  if (diff === 1) {
    return { eyebrow: "TOMORROW", detail: `${dayName} · ${timeRange}` };
  }

  const monthName = MONTH_NAMES[eventDate.getMonth()];
  const fullDate = `${dayName} ${eventDate.getDate()} ${monthName}`;

  if (diff > 1 && diff <= 7) {
    return { eyebrow: `THIS ${dayName.toUpperCase()}`, detail: `${fullDate} · ${timeRange}` };
  }
  if (diff > 7 && diff <= 14) {
    return { eyebrow: `NEXT ${dayName.toUpperCase()}`, detail: `${fullDate} · ${timeRange}` };
  }
  if (diff < 0) {
    return { eyebrow: "PAST", detail: `${fullDate} · ${timeRange}` };
  }

  return { eyebrow: fullDate.toUpperCase(), detail: timeRange };
}

const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Compact "12 Sep" style date, used in the compact Events list. */
export function formatShortDate(date: string): string {
  const d = toDateOnly(date);
  return `${d.getDate()} ${SHORT_MONTH_NAMES[d.getMonth()]}`;
}

/** Assumed event length when no end time is given (used for "is this past?" and calendar export). */
export const DEFAULT_EVENT_DURATION_MS = 3 * 60 * 60 * 1000;

export function isPastEvent(date: string, startTime: string, endTime?: string): boolean {
  const reference = endTime
    ? toDateTime(date, endTime)
    : new Date(toDateTime(date, startTime).getTime() + DEFAULT_EVENT_DURATION_MS);
  return reference.getTime() < Date.now();
}
