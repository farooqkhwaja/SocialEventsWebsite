import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EventModel } from "@/models/Event";
import { serializeEvent } from "@/lib/serialize";
import { validateEventInput } from "@/lib/validateEvent";
import { cleanupOldEvents } from "@/lib/cleanupOldEvents";

export async function GET() {
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
    return NextResponse.json({ events: events.map(serializeEvent) });
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

    await connectToDatabase();
    const created = await EventModel.create({
      ...result.data,
      pinned: false,
      status: "active",
      attendees: [],
    });

    return NextResponse.json({ event: serializeEvent(created) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/events failed", error);
    return NextResponse.json(
      { error: "Could not create the event. Please try again." },
      { status: 500 }
    );
  }
}
