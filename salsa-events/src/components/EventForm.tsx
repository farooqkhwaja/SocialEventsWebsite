"use client";

import { useState, type FormEvent } from "react";
import type { EventDoc, EventInput, EventType } from "@/types/event";
import { EVENT_TYPE_LABELS } from "@/types/event";

interface EventFormProps {
  initial?: EventDoc;
  onCancel: () => void;
  onSave: (input: EventInput) => Promise<string | void>;
}

const TYPE_OPTIONS: EventType[] = ["salsa", "bachata", "salsa_bachata", "other"];

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
  const [description, setDescription] = useState(initial?.description ?? "");
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
    setSubmitting(false);

    if (typeof result === "string") {
      setError(result);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-form-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl bg-surface border border-border-strong p-5 shadow-lg sm:my-8 sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="event-form-title" className="font-display text-xl text-ink mb-4">
          {initial ? "Edit event" : "Add event"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Field label="Event name" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="e.g. Salsa Night"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Date" required>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Type">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
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

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Start time" required>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="End time">
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Location" required>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClass}
              placeholder="e.g. Antwerp"
            />
          </Field>

          <Field label="Address">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass}
              placeholder="Street and number"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Price">
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputClass}
                placeholder="e.g. 10 euro"
              />
            </Field>
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

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              rows={3}
            />
          </Field>

          {error && <p className="text-sm text-cancelled">{error}</p>}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[2.75rem] w-full rounded-xl border border-border-strong px-4 py-2 text-sm text-ink sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[2.75rem] w-full rounded-xl bg-accent px-4 py-2 text-sm font-medium text-paper shadow-sm disabled:opacity-50 sm:w-auto"
            >
              {submitting ? "Saving..." : "Save event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full min-h-[2.75rem] rounded-xl border border-border-strong bg-paper px-3.5 py-2 text-base text-ink outline-none focus-visible:outline-2 focus-visible:outline-accent sm:text-sm";

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
    <label className="block">
      <span className="block text-sm text-muted mb-1">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
