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

    await connectToDatabase();
    const existing = await EventModel.findById(id);

    if (!existing) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const pinned =
      typeof body.pinned === "boolean" ? body.pinned : !existing.pinned;

    existing.pinned = pinned;
    await existing.save();

    return NextResponse.json({ event: serializeEvent(existing) });
  } catch (error) {
    console.error("PATCH /api/events/[id]/pin failed", error);
    return NextResponse.json(
      { error: "Could not update pin status. Please try again." },
      { status: 500 }
    );
  }
}
