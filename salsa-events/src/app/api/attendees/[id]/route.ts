import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EventModel } from "@/models/Event";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!id) {
      return NextResponse.json({ error: "Missing attendee identifier." }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    await connectToDatabase();

    // Updates every event this browser has an attendance entry on, so past
    // "Going"/"Maybe"/"Not going" records show the new name too. Safe to run
    // more than once (idempotent) since it's a plain field overwrite.
    await EventModel.updateMany(
      { "attendees.id": id },
      { $set: { "attendees.$.name": name, "attendees.$.updatedAt": new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/attendees/[id] failed", error);
    return NextResponse.json(
      { error: "Could not update your name on existing events. Please try again." },
      { status: 500 }
    );
  }
}
