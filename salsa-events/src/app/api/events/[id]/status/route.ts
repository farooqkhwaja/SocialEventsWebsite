import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EventModel } from "@/models/Event";
import { serializeEvent } from "@/lib/serialize";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (body.status !== "active" && body.status !== "cancelled") {
      return NextResponse.json(
        { error: "Status must be 'active' or 'cancelled'." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const updated = await EventModel.findByIdAndUpdate(
      id,
      { $set: { status: body.status } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    return NextResponse.json({ event: serializeEvent(updated) });
  } catch (error) {
    console.error("PATCH /api/events/[id]/status failed", error);
    return NextResponse.json(
      { error: "Could not update the event status. Please try again." },
      { status: 500 }
    );
  }
}
