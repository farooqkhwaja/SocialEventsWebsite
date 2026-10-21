import { addDays, eventEnd, lastDate, toDateTime } from "@/lib/date";
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

/**
 * Start and end in calendar format. Timed events are UTC instants
 * ("20261003T200000Z"); all-day events are plain dates ("20270701"), with
 * the end date exclusive as both .ics and Google Calendar require.
 */
function calendarRange(event: EventDoc): { allDay: boolean; start: string; end: string } {
  if (!event.startTime) {
    const compact = (date: string) => date.replaceAll("-", "");
    return { allDay: true, start: compact(event.date), end: compact(addDays(lastDate(event), 1)) };
  }
  const end = eventEnd(event);
  return {
    allDay: false,
    start: formatIcsUtc(zonedDateTimeToUtc(event.date, event.startTime)),
    end: formatIcsUtc(zonedDateTimeToUtc(end.date, end.time)),
  };
}

function eventLocation(event: EventDoc): string {
  return event.address ? `${event.location}, ${event.address}` : event.location;
}

function eventDescription(event: EventDoc): string {
  return [event.description, event.url].filter(Boolean).join("\n\n");
}

/**
 * A Google Calendar "add event" link. Works from in-app browsers (WhatsApp,
 * Instagram) where .ics files can't be handed off to a calendar app.
 */
export function buildGoogleCalendarUrl(event: EventDoc): string {
  const { start, end } = calendarRange(event);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    location: eventLocation(event),
  });
  const details = eventDescription(event);
  if (details) params.set("details", details);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsContent(event: EventDoc): string {
  const { allDay, start, end } = calendarRange(event);
  const valueType = allDay ? ";VALUE=DATE" : "";
  const location = eventLocation(event);
  const description = eventDescription(event);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Salsa & Bachata Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event._id}@salsa-events.local`,
    `DTSTAMP:${formatIcsUtc(new Date())}`,
    `DTSTART${valueType}:${start}`,
    `DTEND${valueType}:${end}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `LOCATION:${escapeIcsText(location)}`,
  ];

  if (description) {
    lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
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

/** Opens the event in the device's calendar app, or downloads an .ics file on desktop. */
export function addEventToCalendar(event: EventDoc): void {
  if (isIOS()) {
    // iOS ignores blob: URLs in home-screen web apps and in-app browsers.
    // Navigating to a real text/calendar response makes iOS show the
    // "Add to Calendar" sheet for Apple Calendar. This must be a full browser
    // navigation to a file, not a client-side route change.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/api/events/${event._id}/ics`;
    return;
  }

  const blob = new Blob([buildIcsContent(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const filename = icsFilenameFor(event.title);
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