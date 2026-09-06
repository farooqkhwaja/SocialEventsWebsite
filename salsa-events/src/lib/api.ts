import type { AttendanceStatus, EventDoc, EventInput } from "@/types/event";

async function parseResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Something went wrong. Please try again.");
  }
  return body as T;
}

export async function fetchEvents(): Promise<EventDoc[]> {
  const res = await fetch("/api/events", { cache: "no-store" });
  const body = await parseResponse<{ events: EventDoc[] }>(res);
  return body.events;
}

export async function createEvent(input: EventInput): Promise<EventDoc> {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseResponse<{ event: EventDoc }>(res);
  return body.event;
}

export async function updateEvent(id: string, input: EventInput): Promise<EventDoc> {
  const res = await fetch(`/api/events/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseResponse<{ event: EventDoc }>(res);
  return body.event;
}

export async function togglePin(id: string, pinned: boolean): Promise<EventDoc> {
  const res = await fetch(`/api/events/${id}/pin`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pinned }),
  });
  const body = await parseResponse<{ event: EventDoc }>(res);
  return body.event;
}

export async function setEventStatus(
  id: string,
  status: "active" | "cancelled"
): Promise<EventDoc> {
  const res = await fetch(`/api/events/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const body = await parseResponse<{ event: EventDoc }>(res);
  return body.event;
}

export async function submitAttendance(
  id: string,
  attendeeId: string,
  name: string,
  status: AttendanceStatus
): Promise<EventDoc> {
  const res = await fetch(`/api/events/${id}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attendeeId, name, status }),
  });
  const body = await parseResponse<{ event: EventDoc }>(res);
  return body.event;
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
  await parseResponse<{ success: boolean }>(res);
}

export async function renameAttendee(attendeeId: string, name: string): Promise<void> {
  const res = await fetch(`/api/attendees/${attendeeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  await parseResponse<{ success: boolean }>(res);
}
