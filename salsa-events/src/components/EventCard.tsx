"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { AttendanceStatus, EventDoc } from "@/types/event";
import {
  EVENT_TYPE_COLOR_CLASSES,
  EVENT_TYPE_LABELS,
} from "@/types/event";
import { friendlyDateLabel, formatShortDate } from "@/lib/date";
import {
  buildShareText,
  buildWhatsAppShareUrl,
} from "@/lib/share";
import {
  buildIcsContent,
  downloadIcsFile,
  icsFilenameFor,
} from "@/lib/ics";
import {
  PALETTE_CLASSES,
  paletteColorFor,
} from "@/lib/eventColor";
import { AttendanceControls } from "@/components/AttendanceControls";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface EventCardProps {
  event: EventDoc;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: (event: EventDoc) => void;
  onTogglePin: (event: EventDoc) => void;
  onToggleStatus: (event: EventDoc) => void;
  onDelete: (event: EventDoc) => void;
  onAttendance: (
    event: EventDoc,
    status: AttendanceStatus,
    name: string
  ) => Promise<void>;
  onRemoveAttendance: (event: EventDoc) => Promise<void>;
}

const actionButtonClass =
  "min-h-[2.5rem] rounded-full border px-3.5 py-2 text-sm font-medium transition-colors active:scale-[0.98]";

const menuItemClass =
  "w-full min-h-[2.75rem] rounded-lg px-3 py-2 text-left text-sm font-medium text-ink active:bg-paper";

function attendeePreview(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length <= 3) return names.join(", ");

  return `${names.slice(0, 3).join(", ")} + ${
    names.length - 3
  } others`;
}

export function EventCard({
  event,
  expanded,
  onToggleExpand,
  onEdit,
  onTogglePin,
  onToggleStatus,
  onDelete,
  onAttendance,
  onRemoveAttendance,
}: EventCardProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!expanded) {
      setMenuOpen(false);
      setConfirmingCancel(false);
      setConfirmingDelete(false);
    }
  }, [expanded]);

  const cancelled = event.status === "cancelled";

  const { eyebrow, detail } = friendlyDateLabel(
    event.date,
    event.startTime,
    event.endTime
  );

  const isToday = eyebrow === "TODAY";
  const isTomorrow = eyebrow === "TOMORROW";

  const rowDateLabel = isToday
    ? "Today"
    : isTomorrow
      ? "Tomorrow"
      : formatShortDate(event.date);

  const palette = PALETTE_CLASSES[paletteColorFor(event._id)];

  const going = event.attendees.filter(
    (a) => a.status === "going"
  );

  const maybe = event.attendees.filter(
    (a) => a.status === "maybe"
  );

  const notGoing = event.attendees.filter(
    (a) => a.status === "not_going"
  );

  async function handleShare() {
    const text = buildShareText(event);

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text,
        });
        return;
      } catch {
        // Fall through to WhatsApp if native sharing is dismissed/unsupported.
      }
    }

    window.open(
      buildWhatsAppShareUrl(text),
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function handleCopy() {
    const text = buildShareText(event);

    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");

      setTimeout(() => {
        setCopyState("idle");
        setMenuOpen(false);
      }, 1800);
    } catch {
      // Clipboard API unavailable.
    }
  }

  function handleAddToCalendar() {
    const content = buildIcsContent(event);
    downloadIcsFile(
      icsFilenameFor(event.title),
      content
    );
  }

  return (
    <article
      className={`rounded-2xl border ${palette.border} ${palette.bg} shadow-sm ${
        cancelled ? "opacity-80" : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={expanded}
        className="flex w-full min-h-[3.25rem] items-center gap-3 px-4 py-3 text-left sm:px-5"
      >
        {event.pinned && (
          <span className="shrink-0 rounded-full border border-gold bg-gold-soft px-2 py-0.5 text-xs font-medium text-gold">
            Pinned
          </span>
        )}

        <span
          className={`min-w-0 flex-1 truncate font-display text-base text-ink sm:text-lg ${
            cancelled
              ? "line-through decoration-cancelled"
              : ""
          }`}
        >
          {event.title}
        </span>

        {cancelled && (
          <span className="shrink-0 rounded-full border border-cancelled bg-cancelled-soft px-2 py-0.5 text-xs font-medium text-cancelled">
            Cancelled
          </span>
        )}

        <span
          className={`shrink-0 text-sm font-medium ${
            !cancelled &&
            (isToday || isTomorrow)
              ? "text-accent"
              : "text-muted"
          }`}
        >
          {rowDateLabel}
        </span>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          expanded
            ? "grid-rows-[1fr]"
            : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`rounded-b-2xl border-t border-border bg-surface p-4 transition-opacity duration-300 ease-out sm:p-5 ${
              expanded
                ? "opacity-100"
                : "opacity-0"
            }`}
          >
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${EVENT_TYPE_COLOR_CLASSES[event.type]}`}
              >
                {EVENT_TYPE_LABELS[event.type]}
              </span>
            </div>

            <div className="text-sm">
              <p className="font-medium text-ink">
                {eyebrow}{" "}
                <span className="font-normal text-muted">
                  · {detail}
                </span>
              </p>

              <p className="text-muted">
                {event.location}
                {event.address
                  ? `, ${event.address}`
                  : ""}
              </p>

              {event.price && (
                <p className="text-muted">
                  Price: {event.price}
                </p>
              )}

              {event.url && (
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-words text-accent underline underline-offset-2"
                >
                  {event.url}
                </a>
              )}

              {event.description && (
                <p className="mt-2 whitespace-pre-wrap text-ink/90">
                  {event.description}
                </p>
              )}
            </div>

            <div className="mt-4 space-y-2 rounded-xl border border-border bg-paper/60 p-3">
              <p className="text-sm">
                <span className="font-medium text-going">
                  Going: {going.length}
                </span>

                <span className="text-muted">
                  {" "}
                  &middot;{" "}
                </span>

                <span className="font-medium text-maybe">
                  Maybe: {maybe.length}
                </span>

                {notGoing.length > 0 && (
                  <>
                    <span className="text-muted">
                      {" "}
                      &middot;{" "}
                    </span>

                    <span className="font-medium text-cancelled">
                      Not going: {notGoing.length}
                    </span>
                  </>
                )}
              </p>

              {going.length > 0 && (
                <p className="text-sm text-ink">
                  {attendeePreview(
                    going.map((a) => a.name)
                  )}
                </p>
              )}

              <AttendanceControls
                event={event}
                onSubmit={(status, name) =>
                  onAttendance(
                    event,
                    status,
                    name
                  )
                }
                onRemove={() =>
                  onRemoveAttendance(event)
                }
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3.5">
              <button
                type="button"
                onClick={handleShare}
                className={`${actionButtonClass} border-accent text-accent active:bg-accent-soft`}
              >
                Share
              </button>

              <button
                type="button"
                onClick={handleAddToCalendar}
                className={`${actionButtonClass} border-border-strong text-ink active:bg-paper`}
              >
                Add to Calendar
              </button>

              <button
                type="button"
                onClick={() =>
                  setMenuOpen((value) => !value)
                }
                aria-expanded={menuOpen}
                className={`${actionButtonClass} border-border-strong text-ink active:bg-paper`}
              >
                More
              </button>
            </div>
          </div>
        </div>
      </div>

      {menuOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setMenuOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-t-2xl border border-border-strong bg-surface p-1.5 shadow-lg sm:rounded-2xl"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(event);
                }}
                className={menuItemClass}
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onTogglePin(event);
                }}
                className={menuItemClass}
              >
                {event.pinned ? "Unpin" : "Pin"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);

                  if (cancelled) {
                    onToggleStatus(event);
                  } else {
                    setConfirmingCancel(true);
                  }
                }}
                className={`${menuItemClass} ${
                  cancelled
                    ? "text-going"
                    : "text-cancelled"
                }`}
              >
                {cancelled
                  ? "Restore"
                  : "Cancel event"}
              </button>

              <button
                type="button"
                onClick={() => void handleCopy()}
                className={menuItemClass}
              >
                {copyState === "copied"
                  ? "Copied"
                  : "Copy details"}
              </button>

              <div className="my-1 border-t border-border" />

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmingDelete(true);
                }}
                className={`${menuItemClass} text-cancelled`}
              >
                Delete event
              </button>

              <div className="my-1 border-t border-border sm:hidden" />

              <button
                type="button"
                onClick={() =>
                  setMenuOpen(false)
                }
                className={`${menuItemClass} text-center text-muted sm:hidden`}
              >
                Cancel
              </button>
            </div>
          </div>,
          document.body
        )}

      {confirmingCancel && (
        <ConfirmDialog
          message="Are you sure you want to cancel this event?"
          confirmLabel="Cancel event"
          onCancel={() =>
            setConfirmingCancel(false)
          }
          onConfirm={() => {
            setConfirmingCancel(false);
            onToggleStatus(event);
          }}
        />
      )}

      {confirmingDelete && (
        <ConfirmDialog
          message="Are you sure you want to delete this event? This cannot be undone."
          confirmLabel="Delete"
          onCancel={() =>
            setConfirmingDelete(false)
          }
          onConfirm={() => {
            setConfirmingDelete(false);
            onDelete(event);
          }}
        />
      )}
    </article>
  );
}

