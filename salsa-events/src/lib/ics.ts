import { DEFAULT_EVENT_DURATION_MS, toDateTime } from "@/lib/date";
import type { EventDoc } from "@/types/event";

/**
 * The group's events are entered as plain local date/time with no stored
 * timezone. Since this is a Belgian group (see seed data locations), we
 * assume Europe/Brussels when converting to the UTC times required by the
 * .ics format. This keeps event times correct for attendees without adding
 * a timezone field to the data model.
 */
const APP_TIMEZONE = "Europe/Brussels";

function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(date);
  const offsetLabel = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+0";
  const match = offsetLabel.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = parseInt(match[2], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;
  return sign * (hours * 60 + minutes);
}

/** Converts a local wall-clock date/time in APP_TIMEZONE to the correct UTC instant. */
function zonedDateTimeToUtc(date: string, time: string): Date {
  const local = toDateTime(date, time);
  const naiveUtcMs = Date.UTC(
    local.getFullYear(),
    local.getMonth(),
    local.getDate(),
    local.getHours(),
    local.getMinutes()
  );
  const offsetMinutes = getTimeZoneOffsetMinutes(new Date(naiveUtcMs), APP_TIMEZONE);
  return new Date(naiveUtcMs - offsetMinutes * 60_000);
}

function formatIcsUtc(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
    date.getUTCHours()
  )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Folds a content line to the 75-octet limit required by RFC 5545. */
function foldLine(line: string): string {
  const maxLen = 75;
  if (line.length <= maxLen) return line;
  let result = "";
  let start = 0;
  while (start < line.length) {
    const chunkLen = start === 0 ? maxLen : maxLen - 1;
    result += (start === 0 ? "" : "\r\n ") + line.slice(start, start + chunkLen);
    start += chunkLen;
  }
  return result;
}

export function buildIcsContent(event: EventDoc): string {
  const start = zonedDateTimeToUtc(event.date, event.startTime);
  const end = event.endTime
    ? zonedDateTimeToUtc(event.date, event.endTime)
    : new Date(start.getTime() + DEFAULT_EVENT_DURATION_MS);

  const location = event.address ? `${event.location}, ${event.address}` : event.location;

  const descriptionParts = [event.description, event.url].filter(Boolean) as string[];

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Salsa & Bachata Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event._id}@salsa-events.local`,
    `DTSTAMP:${formatIcsUtc(new Date())}`,
    `DTSTART:${formatIcsUtc(start)}`,
    `DTEND:${formatIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `LOCATION:${escapeIcsText(location)}`,
  ];

  if (descriptionParts.length > 0) {
    lines.push(`DESCRIPTION:${escapeIcsText(descriptionParts.join("\n\n"))}`);
  }
  if (event.url) {
    lines.push(`URL:${event.url}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(foldLine).join("\r\n") + "\r\n";
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const iOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
  // iPadOS 13+ reports itself as "MacIntel" but has multiple touch points.
  const iPadOS13 = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS13;
}

/** Triggers an .ics download/open in a way that works on iOS Safari and desktop browsers. */
export function downloadIcsFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  if (isIOS()) {
    // iOS Safari doesn't support the `download` attribute, and data: URIs
    // for text/calendar are unreliable there (often silently do nothing).
    // Opening the object URL directly lets Safari recognize the
    // text/calendar content type and hand off to Calendar.app.
    const opened = window.open(url, "_blank");
    if (!opened) {
      window.location.href = url;
    }
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function icsFilenameFor(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${slug || "event"}.ics`;
}