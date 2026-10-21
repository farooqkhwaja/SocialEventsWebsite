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

type Tab = "events" | "festivals";

const isFestival = (event: EventDoc) => event.type === "festival";

const EMPTY_TEXT: Record<Tab, { none: { title: string; message: string }; filtered: { title: string; message: string } }> = {
  events: {
    none: {
      title: "No events yet",
      message: "Add the first salsa or bachata event to get the group's calendar started.",
    },
    filtered: {
      title: "No upcoming events",
      message: "Nothing matches your filters right now. Adjust the filters or add a new event.",
    },
  },
  festivals: {
    none: {
      title: "No festivals yet",
      message: "Add a festival to start planning the season together.",
    },
    filtered: {
      title: "No upcoming festivals",
      message: "Nothing matches your search right now. Try another search or add a festival.",
    },
  },
};

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
    deleteSeriesFor,
    submitAttendanceFor,
    removeAttendanceFor,
  } = useEvents();

  const [tab, setTab] = useState<Tab>("events");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [showPast, setShowPast] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleSaveEvent(input: Parameters<typeof saveEvent>[0]) {
    const error = await saveEvent(input, modal?.mode === "edit" ? modal.event._id : undefined);
    if (!error) {
      setModal(null);
      // Show the tab the new event lives in.
      setTab(input.type === "festival" ? "festivals" : "events");
    }
    return error;
  }

  function handleDelete(event: EventDoc) {
    if (expandedId === event._id) setExpandedId(null);
    void deleteEventFor(event);
  }

  function handleDeleteSeries(event: EventDoc) {
    setExpandedId(null);
    void deleteSeriesFor(event);
  }

  function handleTabChange(next: Tab) {
    setTab(next);
    setExpandedId(null);
    setShowPast(false);
  }

  const seriesSizes = useMemo(() => {
    const sizes = new Map<string, number>();
    for (const event of events) {
      if (event.seriesId) sizes.set(event.seriesId, (sizes.get(event.seriesId) ?? 0) + 1);
    }
    return sizes;
  }, [events]);

  const upcomingFestivalCount = events.filter((e) => isFestival(e) && !isPastEvent(e)).length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      if (isFestival(event) !== (tab === "festivals")) return false;
      if (tab === "events" && typeFilter !== "all" && event.type !== typeFilter) return false;
      if (!query) return true;
      return (
        event.title.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      );
    });
  }, [events, tab, typeFilter, search]);

  const sortByDateTime = (a: EventDoc, b: EventDoc) =>
    toDateTime(a.date, a.startTime).getTime() - toDateTime(b.date, b.startTime).getTime();

  const pinned = filtered
    .filter((e) => e.pinned && !isPastEvent(e))
    .sort(sortByDateTime);

  const upcoming = filtered
    .filter((e) => !e.pinned && !isPastEvent(e))
    .sort(sortByDateTime);

  const past = filtered
    .filter((e) => isPastEvent(e))
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
        onDeleteSeries={handleDeleteSeries}
        seriesSize={event.seriesId ? (seriesSizes.get(event.seriesId) ?? 1) : 1}
        onAttendance={submitAttendanceFor}
        onRemoveAttendance={removeAttendanceFor}
      />
    );
  }

  const tabClass = (active: boolean) =>
    `min-h-[2.5rem] flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors sm:flex-none ${
      active ? "bg-accent text-paper shadow-sm" : "text-muted hover:text-ink"
    }`;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-10">
      <AppHeader onAddEvent={() => setModal({ mode: "add" })} onRenamed={load} />

      <div
        role="tablist"
        aria-label="Event lists"
        className="mb-4 flex gap-1 rounded-full border border-border-strong bg-surface p-1 sm:inline-flex"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "events"}
          onClick={() => handleTabChange("events")}
          className={tabClass(tab === "events")}
        >
          Events
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "festivals"}
          onClick={() => handleTabChange("festivals")}
          className={tabClass(tab === "festivals")}
        >
          Festivals{upcomingFestivalCount > 0 ? ` (${upcomingFestivalCount})` : ""}
        </button>
      </div>

      <div className="mb-6">
        <Filters
          activeType={typeFilter}
          onTypeChange={setTypeFilter}
          search={search}
          onSearchChange={setSearch}
          showTypes={tab === "events"}
          searchPlaceholder={tab === "festivals" ? "Search festivals or locations" : undefined}
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
          {!hasAnyUpcoming && past.length === 0 && <EmptyState {...EMPTY_TEXT[tab].none} />}

          {!hasAnyUpcoming && past.length > 0 && <EmptyState {...EMPTY_TEXT[tab].filtered} />}

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
                {showPast
                  ? `Hide past ${tab}`
                  : `Show past ${tab} (${past.length})`}
              </button>
              {showPast && <div className="mt-3 space-y-2">{past.map(renderRow)}</div>}
            </section>
          )}
        </div>
      )}

      {modal && (
        <EventForm
          initial={modal.mode === "edit" ? modal.event : undefined}
          defaultType={tab === "festivals" ? "festival" : undefined}
          onCancel={() => setModal(null)}
          onSave={handleSaveEvent}
        />
      )}
    </div>
  );
}
