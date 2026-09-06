import type { EventInput, EventType } from "@/types/event";

const VALID_TYPES: EventType[] = ["salsa", "bachata", "salsa_bachata", "other"];

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

export function validateEventInput(body: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof body !== "object" || body === null) {
    return { valid: false, errors: ["Invalid request body."] };
  }

  const b = body as Record<string, unknown>;

  const title = asOptionalString(b.title);
  const date = asOptionalString(b.date);
  const startTime = asOptionalString(b.startTime);
  const location = asOptionalString(b.location);

  if (!title) errors.push("Event name is required.");
  if (!date) errors.push("Date is required.");
  if (!startTime) errors.push("Start time is required.");
  if (!location) errors.push("Location is required.");

  const rawType = asOptionalString(b.type) as EventType | undefined;
  const type: EventType = rawType && VALID_TYPES.includes(rawType) ? rawType : "salsa";

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      title: title as string,
      date: date as string,
      startTime: startTime as string,
      endTime: asOptionalString(b.endTime),
      location: location as string,
      address: asOptionalString(b.address),
      type,
      price: asOptionalString(b.price),
      url: asOptionalString(b.url),
      description: asOptionalString(b.description),
    },
  };
}
