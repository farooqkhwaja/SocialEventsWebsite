import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EventModel } from "@/models/Event";
import { serializeEvent } from "@/lib/serialize";
import type { AttendanceStatus } from "@/types/event";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_STATUSES: AttendanceStatus[] = ["going", "maybe", "not_going"];

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const attendeeId = typeof body.attendeeId === "string" ? body.attendeeId.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const status = body.status as AttendanceStatus;

    if (!attendeeId) {
      return NextResponse.json({ error: "Missing attendee identifier." }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid attendance status." }, { status: 400 });
    }

    await connectToDatabase();
    const event = await EventModel.findById(id);

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    // Upsert: replace this person's existing entry (by local id, falling back to
    // matching by name for the rare case where localStorage was cleared) rather
    // than allowing duplicate rows for the same person.
    const existingIndex = event.attendees.findIndex(
      (a) => a.id === attendeeId || a.name.toLowerCase() === name.toLowerCase()
    );

    const entry = { id: attendeeId, name, status, updatedAt: new Date() };

    if (existingIndex >= 0) {
      event.attendees[existingIndex] = entry;
    } else {
      event.attendees.push(entry);
    }

    await event.save();

    return NextResponse.json({ event: serializeEvent(event) });
  } catch (error) {
    console.error("POST /api/events/[id]/attendance failed", error);
    return NextResponse.json(
      { error: "Could not save your attendance. Please try again." },
      { status: 500 }
    );
  }
}
