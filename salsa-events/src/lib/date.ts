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

/** The date/time fields of an event, as stored. */
export interface EventTiming {
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}

/** Parses a "YYYY-MM-DD" + "HH:mm" pair into a local Date. */
export function toDateTime(date: string, time?: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = (time || "00:00").split(":").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0);
}

/** Start-of-day Date for a "YYYY-MM-DD" string, in local time. */
export function toDateOnly(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" for a local Date. */
export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(date: string, days: number): string {
  const d = toDateOnly(date);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

/** Same day-of-month `months` later, clamped to the month's last day (31 Jan + 1 → 28/29 Feb). */
export function addMonths(date: string, months: number): string {
  const d = toDateOnly(date);
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), lastDay));
  return toDateString(target);
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

/** Last day the event runs on (the start date for single-day events). */
export function lastDate(e: EventTiming): string {
  return e.endDate && e.endDate > e.date ? e.endDate : e.date;
}

export function isMultiDay(e: EventTiming): boolean {
  return lastDate(e) !== e.date;
}

function fullDate(date: string): string {
  const d = toDateOnly(date);
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function timeRangeLabel(e: EventTiming): string {
  if (!e.startTime) return "";
  return e.endTime
    ? `${formatTime(e.startTime)} - ${formatTime(e.endTime)}`
    : formatTime(e.startTime);
}

/**
 * Produces a friendly two-line-style label for an event date, e.g.:
 * { eyebrow: "TODAY", detail: "Saturday · 8:00 PM" }
 * { eyebrow: "NEXT SATURDAY", detail: "Saturday 12 September · 8:00 PM" }
 * { eyebrow: "4 DAYS", detail: "Thursday 1 July – Sunday 4 July" }
 */
export function friendlyDateLabel(e: EventTiming): { eyebrow: string; detail: string } {
  const today = startOfDay(new Date());
  const diff = daysBetween(today, toDateOnly(e.date));
  const times = timeRangeLabel(e);
  const withTimes = (text: string) => (times ? `${text} · ${times}` : text);

  if (isMultiDay(e)) {
    const last = lastDate(e);
    const range = withTimes(`${fullDate(e.date)} – ${fullDate(last)}`);
    const daysLeft = daysBetween(today, toDateOnly(last));

    if (daysLeft < 0) return { eyebrow: "PAST", detail: range };
    if (diff <= 0) return { eyebrow: "ON NOW", detail: range };
    if (diff === 1) return { eyebrow: "STARTS TOMORROW", detail: range };
    return { eyebrow: `${daysBetween(toDateOnly(e.date), toDateOnly(last)) + 1} DAYS`, detail: range };
  }

  const dayName = DAY_NAMES[toDateOnly(e.date).getDay()];
  const dayTimes = times || "All day";

  if (diff === 0) {
    return { eyebrow: "TODAY", detail: `${dayName} · ${dayTimes}` };
  }
  if (diff === 1) {
    return { eyebrow: "TOMORROW", detail: `${dayName} · ${dayTimes}` };
  }
  if (diff > 1 && diff <= 7) {
    return { eyebrow: `THIS ${dayName.toUpperCase()}`, detail: `${fullDate(e.date)} · ${dayTimes}` };
  }
  if (diff > 7 && diff <= 14) {
    return { eyebrow: `NEXT ${dayName.toUpperCase()}`, detail: `${fullDate(e.date)} · ${dayTimes}` };
  }
  if (diff < 0) {
    return { eyebrow: "PAST", detail: `${fullDate(e.date)} · ${dayTimes}` };
  }

  return { eyebrow: fullDate(e.date).toUpperCase(), detail: dayTimes };
}

/** One-line date text for sharing, e.g. "Saturday 12 September · 8:00 PM". */
export function formatDateLine(e: EventTiming): string {
  const dates = isMultiDay(e) ? `${fullDate(e.date)} – ${fullDate(lastDate(e))}` : fullDate(e.date);
  const times = timeRangeLabel(e);
  return times ? `${dates} · ${times}` : dates;
}

/** Compact "12 Sep" style date, used in the compact Events list. */
export function formatShortDate(date: string): string {
  const d = toDateOnly(date);
  return `${d.getDate()} ${SHORT_MONTH_NAMES[d.getMonth()]}`;
}

/** Compact range: "1–4 Jul", or "30 Jul – 2 Aug" across months. */
export function formatShortDateRange(e: EventTiming): string {
  if (!isMultiDay(e)) return formatShortDate(e.date);
  const start = toDateOnly(e.date);
  const end = toDateOnly(lastDate(e));
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${SHORT_MONTH_NAMES[end.getMonth()]}`;
  }
  return `${formatShortDate(e.date)} – ${formatShortDate(lastDate(e))}`;
}

/** Assumed event length when no end time is given (used for "is this past?" and calendar export). */
export const DEFAULT_EVENT_DURATION_MS = 3 * 60 * 60 * 1000;

/**
 * When the event ends, as local wall-clock date + time strings:
 * - timed events ending past midnight (22:00 - 02:00) roll over to the next day
 * - timed events without an end time last DEFAULT_EVENT_DURATION_MS
 * - all-day and multi-day events without an end time run until the end of their last day
 */
export function eventEnd(e: EventTiming): { date: string; time: string } {
  const last = lastDate(e);

  if (e.endTime) {
    const pastMidnight = !isMultiDay(e) && !!e.startTime && e.endTime < e.startTime;
    return { date: pastMidnight ? addDays(last, 1) : last, time: e.endTime };
  }

  if (e.startTime && !isMultiDay(e)) {
    const end = new Date(toDateTime(e.date, e.startTime).getTime() + DEFAULT_EVENT_DURATION_MS);
    return { date: toDateString(end), time: `${pad(end.getHours())}:${pad(end.getMinutes())}` };
  }

  return { date: addDays(last, 1), time: "00:00" };
}

export function eventEndDateTime(e: EventTiming): Date {
  const { date, time } = eventEnd(e);
  return toDateTime(date, time);
}

export function isPastEvent(e: EventTiming): boolean {
  return eventEndDateTime(e).getTime() < Date.now();
}
