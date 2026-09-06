import { formatTime, toDateOnly } from "@/lib/date";
import { EVENT_TYPE_LABELS, type EventDoc } from "@/types/event";

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

export function buildShareText(event: EventDoc): string {
  const eventDate = toDateOnly(event.date);
  const dateLine = `${DAY_NAMES[eventDate.getDay()]} ${eventDate.getDate()} ${
    MONTH_NAMES[eventDate.getMonth()]
  } · ${formatTime(event.startTime)}${
    event.endTime ? ` - ${formatTime(event.endTime)}` : ""
  }`;

  const going = event.attendees.filter((a) => a.status === "going").length;
  const maybe = event.attendees.filter((a) => a.status === "maybe").length;

  const lines: string[] = [event.title];

  if (event.status === "cancelled") {
    lines.push("CANCELLED");
  }

  lines.push(dateLine);
  lines.push(`Location: ${event.location}`);

  if (event.price) {
    lines.push(`Price: ${event.price}`);
  }

  lines.push(`Type: ${EVENT_TYPE_LABELS[event.type]}`);

  if (going > 0 || maybe > 0) {
    lines.push(`Going: ${going}`);
    lines.push(`Maybe: ${maybe}`);
  }

  if (event.url) {
    lines.push(event.url);
  }

  return lines.join("\n");
}

export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
