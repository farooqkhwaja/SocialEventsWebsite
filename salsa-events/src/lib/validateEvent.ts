import type { EventInput, EventType, Recurrence, RepeatFrequency } from "@/types/event";
import { expandOccurrences, MAX_OCCURRENCES } from "@/lib/recurrence";

const VALID_TYPES: EventType[] = ["salsa", "bachata", "salsa_bachata", "other", "festival"];
const VALID_FREQUENCIES: RepeatFrequency[] = ["weekly", "biweekly", "monthly"];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: EventInput;
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseRecurrence(
  value: unknown,
  date: string | undefined,
  endDate: string | undefined,
  errors: string[]
): Recurrence | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const r = value as Record<string, unknown>;

  const frequency = r.frequency as RepeatFrequency;
  const until = asOptionalString(r.until);

  if (!VALID_FREQUENCIES.includes(frequency)) {
    errors.push("Invalid repeat option.");
    return undefined;
  }
  if (!until || !DATE_PATTERN.test(until)) {
    errors.push("Choose when the repeating event ends.");
    return undefined;
  }
  if (date && until < date) {
    errors.push("The repeat end date must be on or after the first date.");
    return undefined;
  }

  const recurrence = { frequency, until };
  if (date && expandOccurrences(date, endDate, recurrence).length > MAX_OCCURRENCES) {
    errors.push(`A repeating event can have at most ${MAX_OCCURRENCES} dates. Pick an earlier end date.`);
    return undefined;
  }
  return recurrence;
}

export function validateEventInput(body: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof body !== "object" || body === null) {
    return { valid: false, errors: ["Invalid request body."] };
  }

  const b = body as Record<string, unknown>;

  const title = asOptionalString(b.title);
  const date = asOptionalString(b.date);
  const endDate = asOptionalString(b.endDate);
  const startTime = asOptionalString(b.startTime);
  const endTime = asOptionalString(b.endTime);
  const location = asOptionalString(b.location);

  const rawType = asOptionalString(b.type) as EventType | undefined;
  const type: EventType = rawType && VALID_TYPES.includes(rawType) ? rawType : "salsa";

  if (!title) errors.push("Event name is required.");
  if (!date) errors.push("Date is required.");
  else if (!DATE_PATTERN.test(date)) errors.push("Date is not valid.");
  if (endDate && (!DATE_PATTERN.test(endDate) || (date && endDate < date))) {
    errors.push("End date must be on or after the start date.");
  }
  // Festivals and multi-day events can be all-day; regular nights need a start time.
  if (!startTime && type !== "festival" && !(endDate && date && endDate > date)) {
    errors.push("Start time is required.");
  }
  if (startTime && !TIME_PATTERN.test(startTime)) errors.push("Start time is not valid.");
  if (endTime && !TIME_PATTERN.test(endTime)) errors.push("End time is not valid.");
  if (endTime && !startTime) errors.push("Add a start time when setting an end time.");
  if (!location) errors.push("Location is required.");

  const recurrence = parseRecurrence(b.recurrence, date, endDate, errors);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      title: title as string,
      date: date as string,
      // A same-day "end date" is just a single-day event.
      endDate: endDate && endDate > (date as string) ? endDate : undefined,
      startTime,
      endTime,
      location: location as string,
      address: asOptionalString(b.address),
      type,
      price: asOptionalString(b.price),
      url: asOptionalString(b.url),
      description: asOptionalString(b.description),
      recurrence,
    },
  };
}
