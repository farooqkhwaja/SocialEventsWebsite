import type { EventHydratedDocument } from "@/models/Event";
import type { EventDoc } from "@/types/event";

export function serializeEvent(doc: EventHydratedDocument): EventDoc {
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
      id: a.id,
      name: a.name,
      status: a.status,
      updatedAt: new Date(a.updatedAt).toISOString(),
    })),
    createdAt: new Date(obj.createdAt).toISOString(),
    updatedAt: new Date(obj.updatedAt).toISOString(),
  };
}
