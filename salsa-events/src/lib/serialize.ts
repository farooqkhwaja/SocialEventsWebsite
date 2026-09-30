import type { EventHydratedDocument } from "@/models/Event";
import type { EventDoc } from "@/types/event";

/** Header the browser sends its private attendee key in (see lib/api.ts). */
export const ATTENDEE_KEY_HEADER = "x-attendee-key";

export function attendeeKeyFrom(request: Request): string {
  return request.headers.get(ATTENDEE_KEY_HEADER)?.trim() ?? "";
}

/**
 * `viewerKey` is the requesting browser's attendee key. Attendee keys are
 * never sent back -- anyone holding one can change that person's RSVP -- so
 * each attendee only carries a `mine` flag for the viewer's own entry.
 */
export function serializeEvent(doc: EventHydratedDocument, viewerKey = ""): EventDoc {
  const obj = doc.toObject();
  return {
    _id: obj._id.toString(),
    title: obj.title,
    date: obj.date,
    startTime: obj.startTime,
    endTime: obj.endTime,
    location: obj.location,
    address: obj.address,
    type: obj.type,
    price: obj.price,
    url: obj.url,
    description: obj.description,
    pinned: obj.pinned,
    status: obj.status,
    attendees: (obj.attendees || []).map((a) => ({
      name: a.name,
      status: a.status,
      mine: !!viewerKey && a.id === viewerKey,
      updatedAt: new Date(a.updatedAt).toISOString(),
    })),
    createdAt: new Date(obj.createdAt).toISOString(),
    updatedAt: new Date(obj.updatedAt).toISOString(),
  };
}
