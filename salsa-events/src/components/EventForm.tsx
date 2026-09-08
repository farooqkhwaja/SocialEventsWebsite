"use client";

import { useState, type FormEvent } from "react";
import type { EventDoc, EventInput, EventType } from "@/types/event";
import { EVENT_TYPE_LABELS } from "@/types/event";

interface EventFormProps {
  initial?: EventDoc;
  onCancel: () => void;
  onSave: (input: EventInput) => Promise<string | void>;
}

const TYPE_OPTIONS: EventType[] = [
  "salsa",
  "bachata",
  "salsa_bachata",
  "other",
];

export function EventForm({ initial, onCancel, onSave }: EventFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [type, setType] = useState<EventType>(initial?.type ?? "salsa");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [description, setDescription] = useState(
    initial?.description ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !date || !startTime || !location.trim()) {
      setError("Event name, date, start time and location are required.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await onSave({
        title: title.trim(),
        date,
        startTime,
        endTime: endTime || undefined,
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
              {initial
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

        {/* Scrollable form area */}
        <form
          onSubmit={handleSubmit}
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            px-4 py-5
            sm:px-6 sm:py-6
          "
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div className="space-y-4">
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

            {/* Date + Type */}
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2.5 sm:gap-3.5">
              <div className="min-w-0">
                <Field label="Date" required>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="min-w-0">
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
              </div>
            </div>

            {/* Start + End time */}
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2.5 sm:gap-3.5">
              <div className="min-w-0">
                <Field label="Start time" required>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="min-w-0">
                <Field label="End time">
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

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

            {/* Price + URL */}
            <div className="grid min-w-0 grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-2.5 sm:grid-cols-2 sm:gap-3.5">
              <div className="min-w-0">
                <Field label="Price">
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. €10"
                  />
                </Field>
              </div>

              <div className="min-w-0">
                <Field label="Event URL">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className={inputClass}
                    placeholder="https://..."
                  />
                </Field>
              </div>
            </div>

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
                  px-3.5 py-3
                  text-sm text-cancelled
                "
              >
                {error}
              </div>
            )}
          </div>
        </form>

        {/* Fixed bottom actions */}
        <div
          className="
            shrink-0
            border-t border-border
            bg-surface
            px-4 py-4
            pb-[calc(1rem+env(safe-area-inset-bottom))]
            sm:px-6 sm:py-4
            sm:pb-4
          "
        >
          <div className="flex gap-3">
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
              {submitting ? "Saving..." : "Save event"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "block w-full min-w-0 min-h-[2.75rem] appearance-none rounded-xl border border-border-strong bg-paper px-2.5 py-2 text-sm text-ink outline-none transition-shadow focus:border-accent focus-visible:outline-2 focus-visible:outline-accent sm:px-3.5 sm:text-sm";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm text-muted">
        {label}
        {required ? " *" : ""}
      </span>

      {children}
    </label>
  );
}