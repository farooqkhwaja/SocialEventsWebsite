const ID_KEY = "salsa_events_attendee_id";
const NAME_KEY = "salsa_events_attendee_name";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `attendee_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function getLocalAttendeeId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(ID_KEY);
  if (!id) {
    id = generateId();
    window.localStorage.setItem(ID_KEY, id);
  }
  return id;
}

export function getLocalAttendeeName(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(NAME_KEY);
}

export function setLocalAttendeeName(name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NAME_KEY, name.trim());
}
