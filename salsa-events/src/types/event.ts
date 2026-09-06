export type EventType = "salsa" | "bachata" | "salsa_bachata" | "other";

export type EventStatus = "active" | "cancelled";

export type AttendanceStatus = "going" | "maybe" | "not_going";

export interface Attendee {
  id: string;
  name: string;
  status: AttendanceStatus;
  updatedAt: string;
}

export interface EventDoc {
  _id: string;
  title: string;
  date: string; // ISO date string, e.g. "2026-09-12"
  startTime: string; // "HH:mm"
  endTime?: string; // "HH:mm"
  location: string;
  address?: string;
  type: EventType;
  price?: string;
  url?: string;
  description?: string;
  pinned: boolean;
  status: EventStatus;
  attendees: Attendee[];
  createdAt: string;
  updatedAt: string;
}

export interface EventInput {
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  address?: string;
  type: EventType;
  price?: string;
  url?: string;
  description?: string;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  salsa: "Salsa",
  bachata: "Bachata",
  salsa_bachata: "Salsa + Bachata",
  other: "Other",
};

// Slightly longer label used only for the filter bar chip, per the group's request.
export const EVENT_TYPE_FILTER_LABELS: Record<EventType, string> = {
  ...EVENT_TYPE_LABELS,
  other: "Other events",
};

// Tailwind classes for the small colored type badge/chip shown per event type.
export const EVENT_TYPE_COLOR_CLASSES: Record<EventType, string> = {
  salsa: "text-type-salsa border-type-salsa bg-type-salsa-soft",
  bachata: "text-type-bachata border-type-bachata bg-type-bachata-soft",
  salsa_bachata: "text-type-blend border-type-blend bg-type-blend-soft",
  other: "text-type-other border-type-other bg-type-other-soft",
};

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  going: "Going",
  maybe: "Maybe",
  not_going: "Not going",
};
