"use client";

import { useState, type FormEvent } from "react";
import type { EventDoc, EventInput, EventType, RepeatFrequency } from "@/types/event";
import { EVENT_TYPE_LABELS, REPEAT_LABELS } from "@/types/event";
import { addMonths, formatShortDate } from "@/lib/date";
import { expandOccurrences, MAX_OCCURRENCES } from "@/lib/recurrence";

interface EventFormProps {
  initial?: EventDoc;
  /** Type preselected for a new event, e.g. "festival" from the Festivals tab. */
  defaultType?: EventType;
  onCancel: () => void;
  onSave: (input: EventInput) => Promise<string | void>;
}

const TYPE_OPTIONS: EventType[] = [
  "salsa",
  "bachata",
  "salsa_bachata",
  "other",
  "festival",
];

const REPEAT_OPTIONS: RepeatFrequency[] = ["weekly", "biweekly", "monthly"];

const REPEAT_PRESET_MONTHS = [1, 3, 6];

export function EventForm({ initial, defaultType, onCancel, onSave }: EventFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [type, setType] = useState<EventType>(initial?.type ?? defaultType ?? "salsa");
  const [repeat, setRepeat] = useState<RepeatFrequency | "none">("none");
  const [repeatUntil, setRepeatUntil] = useState("");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [description, setDescription] = useState(
    initial?.description ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const multiDay = !!date && !!endDate && endDate > date;
  // Festivals and multi-day events may be all-day; regular nights need a time.
  const startTimeRequired = type !== "festival" && !multiDay;
  const repeating = !initial && repeat !== "none";

  const occurrences =
    repeating && date && repeatUntil >= date
      ? expandOccurrences(date, endDate || undefined, { frequency: repeat, until: repeatUntil })
      : [];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !date || !location.trim() || (startTimeRequired && !startTime)) {
      setError(
        startTimeRequired
          ? "Event name, date, start time and location are required."
          : "Event name, date and location are required."
      );
      return;
    }
    if (endDate && endDate < date) {
      setError("End date must be on or after the start date.");
      return;
    }
    if (repeating) {
      if (!repeatUntil || repeatUntil < date) {
        setError("Choose when the repeating event ends, on or after the first date.");
        return;
      }
      if (occurrences.length > MAX_OCCURRENCES) {
        setError(`A repeating event can have at most ${MAX_OCCURRENCES} dates. Pick an earlier end date.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const result = await onSave({
        title: title.trim(),
        date,
        endDate: multiDay ? endDate : undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        recurrence: repeating ? { frequency: repeat, until: repeatUntil } : undefined,
        location: location.trim(),
        address: address.trim() || undefined,
        type,
        price: price.trim() || undefined,
        url: url.trim() || undefined,
        description: description.trim() || undefined,
      });

      if (typeof result === "string") {
        setError(result);
      }
    } catch {
      setError("Something went wrong while saving the event.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-end justify-center
        bg-ink/40
        sm:items-center sm:p-4
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-form-title"
      onClick={onCancel}
    >
      <div
        className="
          flex w-full min-w-0 flex-col
          max-h-[100dvh]
          overflow-hidden
          bg-surface
          border border-border
          shadow-lg
          rounded-t-2xl
          sm:max-w-lg
          sm:max-h-[calc(100dvh-2rem)]
          sm:rounded-2xl
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="
            flex shrink-0 items-center justify-between
            border-b border-border
            px-4 py-4
            sm:px-6 sm:py-5
          "
        >
          <div className="min-w-0 pr-3">
            <h2
              id="event-form-title"
              className="font-display text-xl text-ink"
            >
              {initial ? "Edit event" : "Add event"}
            </h2>

            <p className="mt-0.5 text-xs text-muted">
              {initial?.seriesId
                ? "Changes apply to this date only"
                : initial
                  ? "Update the event details"
                  : "Add an event to your calendar"}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="
              flex h-9 w-9 shrink-0 items-center justify-center
              rounded-full
              text-xl leading-none text-muted
              hover:bg-paper hover:text-ink
              focus-visible:outline-2
              focus-visible:outline-accent
            "
          >
            ×
          </button>
        </div>

        {/* Scrollable form */}
        <form
          onSubmit={handleSubmit}
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            px-4 py-4
            sm:px-6 sm:py-5
          "
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div className="space-y-3">
            {/* Event name */}
            <Field label="Event name" required>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g. Salsa Night"
              />
            </Field>

            {/* Type -- first, since "Festival" changes which fields are required */}
            <Field label="Type">
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as EventType)
                }
                className={inputClass}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {EVENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </Field>

            {/* Date */}
            <Field label={type === "festival" ? "Start date" : "Date"} required>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </Field>

            {/* End date (multi-day events such as festivals) */}
            <Field
              label="End date"
              hint={type === "festival" ? "Last day of the festival" : "Only for events lasting several days"}
            >
              <input
                type="date"
                value={endDate}
                min={date || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </Field>

            {/* Start time */}
            <Field
              label="Start time"
              required={startTimeRequired}
              hint={startTimeRequired ? undefined : "Leave empty for an all-day event"}
            >
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClass}
              />
            </Field>

            {/* End time */}
            <Field label="End time">
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputClass}
              />
            </Field>

            {/* Repeat -- only when creating; edits apply to a single date */}
            {!initial && (
              <div className="space-y-3 rounded-xl border border-border bg-paper/60 p-3">
                <Field label="Repeat">
                  <select
                    value={repeat}
                    onChange={(e) => setRepeat(e.target.value as RepeatFrequency | "none")}
                    className={inputClass}
                  >
                    <option value="none">Doesn&apos;t repeat</option>
                    {REPEAT_OPTIONS.map((frequency) => (
                      <option key={frequency} value={frequency}>
                        {REPEAT_LABELS[frequency]}
                      </option>
                    ))}
                  </select>
                </Field>

                {repeating && (
                  <>
                    <Field label="Ends on" required>
                      <input
                        type="date"
                        value={repeatUntil}
                        min={date || undefined}
                        onChange={(e) => setRepeatUntil(e.target.value)}
                        className={inputClass}
                      />
                    </Field>

                    <div className="flex flex-wrap gap-2">
                      {REPEAT_PRESET_MONTHS.map((months) => (
                        <button
                          key={months}
                          type="button"
                          disabled={!date}
                          onClick={() => setRepeatUntil(addMonths(date, months))}
                          className={`min-h-[2.25rem] rounded-full border px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50 ${
                            date && repeatUntil === addMonths(date, months)
                              ? "border-accent bg-accent text-paper"
                              : "border-border-strong bg-surface text-ink active:bg-paper"
                          }`}
                        >
                          {months === 1 ? "1 month" : `${months} months`}
                        </button>
                      ))}
                    </div>

                    <p className="text-sm text-muted">
                      {!date
                        ? "Pick the first date to see how many events this creates."
                        : occurrences.length === 0
                          ? "Choose an end date on or after the first date."
                          : occurrences.length > MAX_OCCURRENCES
                            ? `That's more than ${MAX_OCCURRENCES} dates. Pick an earlier end date.`
                            : `Creates ${occurrences.length} ${occurrences.length === 1 ? "event" : "events"}: ${formatShortDate(
                                occurrences[0].date
                              )} – ${formatShortDate(occurrences[occurrences.length - 1].date)}`}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Location */}
            <Field label="Location" required>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputClass}
                placeholder="e.g. Antwerp"
              />
            </Field>

            {/* Address */}
            <Field label="Address">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass}
                placeholder="Street and number"
              />
            </Field>

            {/* Price */}
            <Field label="Price">
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputClass}
                placeholder="e.g. €10"
              />
            </Field>

            {/* Event URL */}
            <Field label="Event URL">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={inputClass}
                placeholder="https://..."
              />
            </Field>

            {/* Description */}
            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputClass} resize-none`}
                rows={4}
                placeholder="Add some details about the event..."
              />
            </Field>

            {/* Error */}
            {error && (
              <div
                className="
                  rounded-xl border border-cancelled/20
                  bg-cancelled/5
                  px-3 py-2.5
                  text-sm text-cancelled
                "
              >
                {error}
              </div>
            )}
          </div>
        </form>

        {/* Bottom actions */}
        <div
          className="
            shrink-0
            border-t border-border
            bg-surface
            px-4 py-3
            pb-[calc(0.75rem+env(safe-area-inset-bottom))]
            sm:px-6 sm:py-4
            sm:pb-4
          "
        >
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="
                min-h-[2.75rem]
                flex-1
                rounded-xl
                border border-border-strong
                px-4 py-2
                text-sm text-ink
                transition-colors
                hover:bg-paper
                focus-visible:outline-2
                focus-visible:outline-accent
                sm:flex-none
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              onClick={(e) => {
                e.preventDefault();

                const form = e.currentTarget
                  .closest("[role='dialog']")
                  ?.querySelector("form");

                if (form instanceof HTMLFormElement) {
                  form.requestSubmit();
                }
              }}
              className="
                min-h-[2.75rem]
                flex-1
                rounded-xl
                bg-accent
                px-5 py-2
                text-sm font-medium
                text-paper
                shadow-sm
                transition-opacity
                disabled:opacity-50
                focus-visible:outline-2
                focus-visible:outline-accent
                sm:flex-none
              "
            >
              {submitting
                ? "Saving..."
                : repeating && occurrences.length > 1 && occurrences.length <= MAX_OCCURRENCES
                  ? `Save ${occurrences.length} events`
                  : "Save event"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "block w-full min-w-0 min-h-[2.75rem] appearance-none rounded-xl border border-border-strong bg-paper px-3 py-2 text-sm text-ink outline-none transition-shadow focus:border-accent focus-visible:outline-2 focus-visible:outline-accent sm:px-3.5";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-sm text-muted">
        {label}
        {required ? " *" : ""}
      </span>

      {children}

      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

