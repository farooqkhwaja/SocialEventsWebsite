"use client";

import { useState } from "react";
import type { AttendanceStatus, EventDoc } from "@/types/event";
import {
  getLocalAttendeeId,
  getLocalAttendeeName,
  setLocalAttendeeName,
} from "@/lib/localAttendee";

interface AttendanceControlsProps {
  event: EventDoc;
  onSubmit: (status: AttendanceStatus, name: string) => Promise<void>;
}

const OPTIONS: { status: AttendanceStatus; label: string }[] = [
  { status: "going", label: "I'm going" },
  { status: "maybe", label: "Maybe" },
  { status: "not_going", label: "Not going" },
];

const ACTIVE_CLASSES: Record<AttendanceStatus, string> = {
  going: "border-going bg-going text-paper",
  maybe: "border-maybe bg-maybe text-paper",
  not_going: "border-cancelled bg-cancelled text-paper",
};

const CONFIRM_TEXT: Record<AttendanceStatus, string> = {
  going: "You are going",
  maybe: "You are marked as maybe",
  not_going: "You are not going",
};

const CONFIRM_COLOR: Record<AttendanceStatus, string> = {
  going: "text-going",
  maybe: "text-maybe",
  not_going: "text-cancelled",
};

export function AttendanceControls({ event, onSubmit }: AttendanceControlsProps) {
  const [pendingStatus, setPendingStatus] = useState<AttendanceStatus | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localId = typeof window !== "undefined" ? getLocalAttendeeId() : "";
  const mine = event.attendees.find((a) => a.id === localId);

  function handleChoose(status: AttendanceStatus) {
    setError(null);
    const knownName = getLocalAttendeeName();
    if (knownName) {
      void doSubmit(status, knownName);
    } else {
      setPendingStatus(status);
      setNameDraft("");
    }
  }

  async function doSubmit(status: AttendanceStatus, name: string) {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(status, name);
      setLocalAttendeeName(name);
      setPendingStatus(null);
    } catch {
      setError("Could not save your response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleNameConfirm() {
    const trimmed = nameDraft.trim();
    if (!trimmed || !pendingStatus) return;
    void doSubmit(pendingStatus, trimmed);
  }

     if (pendingStatus) {
    return (
      <div className="space-y-2 rounded-xl border border-border-strong bg-surface p-2.5">
        <div>
          <label htmlFor={`name-${event._id}`} className="mb-1 block text-sm text-muted">
            Your name
          </label>
          <input
            id={`name-${event._id}`}
            type="text"
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNameConfirm();
              if (e.key === "Escape") setPendingStatus(null);
            }}
            placeholder="e.g. Sarah"
            className="min-h-[2.5rem] w-full min-w-0 rounded-lg border border-border bg-paper px-3 py-1.5 text-base text-ink outline-none focus-visible:outline-2 focus-visible:outline-accent sm:text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleNameConfirm}
            disabled={!nameDraft.trim() || submitting}
            className="min-h-[2.5rem] flex-1 rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-paper disabled:opacity-50 sm:flex-none"
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setPendingStatus(null)}
            className="min-h-[2.5rem] rounded-lg px-3 py-1.5 text-sm text-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => {
          const active = mine?.status === opt.status;
          return (
            <button
              key={opt.status}
              type="button"
              disabled={submitting}
              onClick={() => handleChoose(opt.status)}
              className={`min-h-[2.75rem] rounded-lg border px-2 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                active
                  ? ACTIVE_CLASSES[opt.status]
                  : "border-border-strong bg-surface text-ink active:bg-paper"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {mine && <p className={`text-sm font-medium ${CONFIRM_COLOR[mine.status]}`}>{CONFIRM_TEXT[mine.status]}</p>}
      {error && <p className="text-sm text-cancelled">{error}</p>}
    </div>
  );
}
