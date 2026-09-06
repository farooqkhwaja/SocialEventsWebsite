import { EventModel } from "@/models/Event";
import { toDateTime } from "@/lib/date";

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Deletes events whose scheduled date/time is more than 7 days in the past,
 * regardless of status (cancelled events are not treated specially -- they
 * follow the same time-based rule as active ones).
 *
 * There's no dedicated background worker in this app, so this runs
 * opportunistically whenever the event list is fetched. It's cheap (the
 * group's dataset is small) and safe to run repeatedly: it only ever
 * deletes documents that are already past the retention window, so calling
 * it multiple times in a row is a no-op after the first pass.
 */
export async function cleanupOldEvents(): Promise<void> {
  const cutoff = Date.now() - RETENTION_MS;

  const candidates = await EventModel.find({}, { date: 1, startTime: 1 }).lean();

  const staleIds = candidates
    .filter((doc) => toDateTime(doc.date, doc.startTime).getTime() < cutoff)
    .map((doc) => doc._id);

  if (staleIds.length > 0) {
    await EventModel.deleteMany({ _id: { $in: staleIds } });
  }
}
