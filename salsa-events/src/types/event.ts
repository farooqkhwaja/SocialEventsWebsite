export type EventType = "salsa" | "bachata" | "salsa_bachata" | "other" | "festival";

export type EventStatus = "active" | "cancelled";

export type AttendanceStatus = "going" | "maybe" | "not_going";

export type RepeatFrequency = "weekly" | "biweekly" | "monthly";

export interface Recurrence {
  frequency: RepeatFrequency;
  /** Last date ("YYYY-MM-DD") an occurrence may start on. */
  until: string;
}

export interface Attendee {
  name: string;
  status: AttendanceStatus;
  /** True for the viewing browser's own entry. Attendee keys are never exposed. */
  mine: boolean;
  updatedAt: string;
}

export interface EventDoc {
  _id: string;
  title: string;
  date: string; // ISO date string, e.g. "2026-09-12"
  /** Last day of a multi-day event such as a festival. */
  endDate?: string;
  /** "HH:mm". Missing means an all-day event. */
  startTime?: string;
  endTime?: string; // "HH:mm"
  location: string;
  address?: string;
  type: EventType;
  price?: string;
  url?: string;
  description?: string;
  pinned: boolean;
  status: EventStatus;
  /** Shared by every occurrence created from one repeating event. */
  seriesId?: string;
  attendees: Attendee[];
  createdAt: string;
  updatedAt: string;
}

export interface EventInput {
  title: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location: string;
  address?: string;
  type: EventType;
  price?: string;
  url?: string;
  description?: string;
  /** Only used when creating: expands into one event per occurrence. */
  recurrence?: Recurrence;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  salsa: "Salsa",
  bachata: "Bachata",
  salsa_bachata: "Salsa + Bachata",
  other: "Other",
  festival: "Festival",
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
  festival: "text-gold border-gold bg-gold-soft",
};

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  going: "Going",
  maybe: "Maybe",
  not_going: "Not going",
};

export const REPEAT_LABELS: Record<RepeatFrequency, string> = {
  weekly: "Every week",
  biweekly: "Every 2 weeks",
  monthly: "Every month",
};
