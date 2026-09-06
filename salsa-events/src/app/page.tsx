"use client";

import { useMemo, useState } from "react";
import type { EventDoc } from "@/types/event";
import { AppHeader } from "@/components/AppHeader";
import { EventCard } from "@/components/EventCard";
import { EventForm } from "@/components/EventForm";
import { Filters, type TypeFilter } from "@/components/Filters";
import { EmptyState } from "@/components/EmptyState";
import { isPastEvent, toDateTime } from "@/lib/date";
import { useEvents } from "@/lib/useEvents";

type ModalState = { mode: "add" } | { mode: "edit"; event: EventDoc } | null;

export default function Home() {
  const {
    events,
    loading,
    loadError,
    load,
    saveEvent,
    togglePinFor,
    toggleStatusFor,
    deleteEventFor,
    submitAttendanceFor,
  } = useEvents();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [showPast, setShowPast] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleSaveEvent(input: Parameters<typeof saveEvent>[0]) {
    const error = await saveEvent(input, modal?.mode === "edit" ? modal.event._id : undefined);
    if (!error) setModal(null);
    return error;
  }

  function handleDelete(event: EventDoc) {
    if (expandedId === event._id) setExpandedId(null);
    void deleteEventFor(event);
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      if (typeFilter !== "all" && event.type !== typeFilter) return false;
      if (!query) return true;
      return (
        event.title.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      );
    });
  }, [events, typeFilter, search]);

  const sortByDateTime = (a: EventDoc, b: EventDoc) =>
    toDateTime(a.date, a.startTime).getTime() - toDateTime(b.date, b.startTime).getTime();

  const pinned = filtered
    .filter((e) => e.pinned && !isPastEvent(e.date, e.startTime, e.endTime))
    .sort(sortByDateTime);

  const upcoming = filtered
    .filter((e) => !e.pinned && !isPastEvent(e.date, e.startTime, e.endTime))
    .sort(sortByDateTime);

  const past = filtered
    .filter((e) => isPastEvent(e.date, e.startTime, e.endTime))
    .sort((a, b) => sortByDateTime(b, a));

  const hasAnyUpcoming = pinned.length > 0 || upcoming.length > 0;

  function renderRow(event: EventDoc) {
    return (
      <EventCard
        key={event._id}
        event={event}
        expanded={expandedId === event._id}
        onToggleExpand={() =>
          setExpandedId((current) => (current === event._id ? null : event._id))
        }
        onEdit={(e) => setModal({ mode: "edit", event: e })}
        onTogglePin={togglePinFor}
        onToggleStatus={toggleStatusFor}
        onDelete={handleDelete}
        onAttendance={submitAttendanceFor}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-10">
      <AppHeader onAddEvent={() => setModal({ mode: "add" })} onRenamed={load} />

      <div className="mb-6">
        <Filters
          activeType={typeFilter}
          onTypeChange={setTypeFilter}
          search={search}
          onSearchChange={setSearch}
        />
      </div>

      {loading && <p className="text-sm text-muted">Loading events...</p>}

      {loadError && !loading && (
        <div className="rounded-xl border border-cancelled bg-cancelled-soft p-4 text-sm text-cancelled">
          {loadError}{" "}
          <button type="button" onClick={() => void load()} className="underline">
            Try again
          </button>
        </div>
      )}

      {!loading && !loadError && (
        <div className="space-y-4">
          {!hasAnyUpcoming && past.length === 0 && (
            <EmptyState
              title="No events yet"
              message="Add the first salsa or bachata event to get the group's calendar started."
            />
          )}

          {!hasAnyUpcoming && past.length > 0 && (
            <EmptyState
              title="No upcoming events"
              message="Nothing matches your filters right now. Adjust the filters or add a new event."
            />
          )}

          {pinned.length > 0 && (
            <section className="space-y-2">{pinned.map(renderRow)}</section>
          )}

          {upcoming.length > 0 && (
            <section className="space-y-2">{upcoming.map(renderRow)}</section>
          )}

          {past.length > 0 && (
            <section className="border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setShowPast((v) => !v)}
                className="min-h-[2.5rem] rounded-full border border-border-strong px-4 py-2 text-sm font-medium text-ink active:bg-paper"
              >
                {showPast ? "Hide past events" : `Show past events (${past.length})`}
              </button>
              {showPast && <div className="mt-3 space-y-2">{past.map(renderRow)}</div>}
            </section>
          )}
        </div>
      )}

      {modal && (
        <EventForm
          initial={modal.mode === "edit" ? modal.event : undefined}
          onCancel={() => setModal(null)}
          onSave={handleSaveEvent}
        />
      )}
    </div>
  );
}
