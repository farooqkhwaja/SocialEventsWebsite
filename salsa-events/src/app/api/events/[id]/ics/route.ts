import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { EventModel } from "@/models/Event";
import { serializeEvent } from "@/lib/serialize";
import { buildIcsContent, icsFilenameFor } from "@/lib/ics";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Serves an event as a real .ics file. iOS only hands a calendar file to
 * Apple Calendar when it arrives as an actual `text/calendar` HTTP response
 * -- blob: URLs do nothing in home-screen web apps and in-app browsers.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    await connectToDatabase();
    const event = await EventModel.findById(id);

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const serialized = serializeEvent(event);

    return new NextResponse(buildIcsContent(serialized), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="${icsFilenameFor(serialized.title)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/events/[id]/ics failed", error);
    return NextResponse.json(
      { error: "Could not create the calendar file. Please try again." },
      { status: 500 }
    );
  }
}
