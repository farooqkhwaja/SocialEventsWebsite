import type { Recurrence } from "@/types/event";
import { addDays, addMonths, lastDate, toDateOnly } from "@/lib/date";

/** Hard cap so a typo in the end date can't create hundreds of events. */
export const MAX_OCCURRENCES = 60;

function daySpan(from: string, to: string): number {
  return Math.round((toDateOnly(to).getTime() - toDateOnly(from).getTime()) / 86_400_000);
}

/**
 * Every occurrence of a repeating event, from `date` up to and including
 * `recurrence.until`. Multi-day events keep their length on each occurrence.
 */
export function expandOccurrences(
  date: string,
  endDate: string | undefined,
  recurrence: Recurrence,
  // One past the cap, so callers can tell when an end date asks for too many.
  limit = MAX_OCCURRENCES + 1
): { date: string; endDate?: string }[] {
  const span = endDate ? daySpan(date, lastDate({ date, endDate })) : 0;
  const occurrences: { date: string; endDate?: string }[] = [];

  for (let i = 0; occurrences.length < limit; i++) {
    const next =
      recurrence.frequency === "monthly"
        ? addMonths(date, i)
        : addDays(date, i * (recurrence.frequency === "weekly" ? 7 : 14));

    if (next > recurrence.until) break;
    occurrences.push(span > 0 ? { date: next, endDate: addDays(next, span) } : { date: next });
  }

  return occurrences;
}
