import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EventModel } from "@/models/Event";
import { attendeeKeyFrom, serializeEvent } from "@/lib/serialize";
import { validateEventInput } from "@/lib/validateEvent";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = validateEventInput(body);

    if (!result.valid || !result.data) {
      return NextResponse.json({ error: result.errors.join(" ") }, { status: 400 });
    }

    await connectToDatabase();
    const updated = await EventModel.findOneAndUpdate(
      { _id: { $eq: id } },
      { $set: result.data },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    return NextResponse.json({ event: serializeEvent(updated, attendeeKeyFrom(request)) });
  } catch (error) {
    console.error("PATCH /api/events/[id] failed", error);
    return NextResponse.json(
      { error: "Could not update the event. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const deleted = await EventModel.findOneAndDelete({ _id: { $eq: id } });

    if (!deleted) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/events/[id] failed", error);
    return NextResponse.json(
      { error: "Could not delete the event. Please try again." },
      { status: 500 }
    );
  }
}
