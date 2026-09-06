"use client";

import { useCallback, useEffect, useState } from "react";
import type { AttendanceStatus, EventDoc, EventInput } from "@/types/event";
import { getLocalAttendeeId } from "@/lib/localAttendee";
import {
  createEvent,
  deleteEvent,
  fetchEvents,
  setEventStatus,
  submitAttendance,
  togglePin,
  updateEvent,
} from "@/lib/api";

export function useEvents() {
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Ensures a stable local attendee id exists before anyone taps an attendance button.
    getLocalAttendeeId();
    // Fetching the initial event list on mount has no render-time
    // alternative in a client component without a data-fetching library.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function upsertLocal(updated: EventDoc) {
    setEvents((prev) => {
      const exists = prev.some((e) => e._id === updated._id);
      return exists
        ? prev.map((e) => (e._id === updated._id ? updated : e))
        : [...prev, updated];
    });
  }

  function removeLocal(id: string) {
    setEvents((prev) => prev.filter((e) => e._id !== id));
  }

  async function saveEvent(input: EventInput, editingId?: string): Promise<string | void> {
    try {
      if (editingId) {
        const updated = await updateEvent(editingId, input);
        upsertLocal(updated);
      } else {
        const created = await createEvent(input);
        upsertLocal(created);
      }
    } catch (err) {
      return err instanceof Error ? err.message : "Could not save the event.";
    }
  }

  async function togglePinFor(event: EventDoc) {
    try {
      const updated = await togglePin(event._id, !event.pinned);
      upsertLocal(updated);
    } catch {
      // Non-fatal: the UI simply keeps its previous state.
    }
  }

  async function toggleStatusFor(event: EventDoc) {
    const nextStatus = event.status === "active" ? "cancelled" : "active";
    try {
      const updated = await setEventStatus(event._id, nextStatus);
      upsertLocal(updated);
    } catch {
      // Non-fatal: the UI simply keeps its previous state.
    }
  }

  async function deleteEventFor(event: EventDoc) {
    try {
      await deleteEvent(event._id);
      removeLocal(event._id);
    } catch {
      // Non-fatal: the UI simply keeps showing the event if deletion failed.
    }
  }

  async function submitAttendanceFor(event: EventDoc, status: AttendanceStatus, name: string) {
    const updated = await submitAttendance(event._id, getLocalAttendeeId(), name, status);
    upsertLocal(updated);
  }

  return {
    events,
    loading,
    loadError,
    load,
    saveEvent,
    togglePinFor,
    toggleStatusFor,
    deleteEventFor,
    submitAttendanceFor,
  };
}
