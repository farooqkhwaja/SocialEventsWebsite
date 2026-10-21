import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { expandOccurrences } from "@/lib/recurrence";
import { EventModel } from "@/models/Event";
import { attendeeKeyFrom, serializeEvent } from "@/lib/serialize";
import { validateEventInput } from "@/lib/validateEvent";
import { cleanupOldEvents } from "@/lib/cleanupOldEvents";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    try {
      // Opportunistic sweep: removes events more than 7 days past their
      // scheduled time. Failure here should never break the event listing.
      await cleanupOldEvents();
    } catch (cleanupError) {
      console.error("Event cleanup failed", cleanupError);
    }

    const events = await EventModel.find().sort({ date: 1, startTime: 1 });
    return NextResponse.json({ events: events.map((e) => serializeEvent(e, attendeeKeyFrom(request))) });
  } catch (error) {
    console.error("GET /api/events failed", error);
    return NextResponse.json(
      { error: "Could not load events. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = validateEventInput(body);

    if (!result.valid || !result.data) {
      return NextResponse.json({ error: result.errors.join(" ") }, { status: 400 });
    }

    const { recurrence, ...fields } = result.data;
    const base = { ...fields, pinned: false, status: "active" as const, attendees: [] };

    await connectToDatabase();

    if (!recurrence) {
      const created = await EventModel.create(base);
      return NextResponse.json({ events: [serializeEvent(created)] }, { status: 201 });
    }

    // A repeating event becomes one independent event per date, linked by a
    // shared seriesId, so RSVPs, pinning and cancelling work per date.
    const seriesId = randomUUID();
    const created = await EventModel.insertMany(
      expandOccurrences(fields.date, fields.endDate, recurrence).map((occurrence) => ({
        ...base,
        ...occurrence,
        seriesId,
      }))
    );

    return NextResponse.json(
      { events: created.map((doc) => serializeEvent(doc)) },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/events failed", error);
    return NextResponse.json(
      { error: "Could not create the event. Please try again." },
      { status: 500 }
    );
  }
}
