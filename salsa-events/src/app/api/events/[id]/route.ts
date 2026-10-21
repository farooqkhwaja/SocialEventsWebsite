import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { EventModel } from "@/models/Event";
import { attendeeKeyFrom, serializeEvent } from "@/lib/serialize";
import { validateEventInput } from "@/lib/validateEvent";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Fields the edit form can leave empty; emptied ones are removed from the document. */
const OPTIONAL_FIELDS = [
  "endDate",
  "startTime",
  "endTime",
  "address",
  "price",
  "url",
  "description",
] as const;

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = validateEventInput(body);

    if (!result.valid || !result.data) {
      return NextResponse.json({ error: result.errors.join(" ") }, { status: 400 });
    }

    // Editing changes this one date only; repeat settings apply on creation.
    const fields = { ...result.data };
    delete fields.recurrence;
    const unset = Object.fromEntries(
      OPTIONAL_FIELDS.filter((field) => fields[field] === undefined).map((field) => [field, 1])
    );

    await connectToDatabase();
    const updated = await EventModel.findOneAndUpdate(
      { _id: { $eq: id } },
      { $set: fields, ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}) },
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

/** `?scope=series` deletes every date of a repeating event. */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    await connectToDatabase();
    const event = await EventModel.findOne({ _id: { $eq: id } });

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const wholeSeries = request.nextUrl.searchParams.get("scope") === "series" && event.seriesId;

    if (wholeSeries) {
      await EventModel.deleteMany({ seriesId: event.seriesId });
    } else {
      await event.deleteOne();
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
