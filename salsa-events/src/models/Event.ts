import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";
import type { AttendanceStatus, EventStatus, EventType } from "@/types/event";

export interface AttendeeSubdoc {
  id: string;
  name: string;
  status: AttendanceStatus;
  updatedAt: Date;
}

export interface EventSchemaFields {
  title: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location: string;
  address?: string;
  type: EventType;
  price?: string;
  url?: string;
  description?: string;
  pinned: boolean;
  status: EventStatus;
  seriesId?: string;
  attendees: AttendeeSubdoc[];
  createdAt: Date;
  updatedAt: Date;
}

export type EventHydratedDocument = HydratedDocument<EventSchemaFields>;

const AttendeeSchema = new Schema<AttendeeSubdoc>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["going", "maybe", "not_going"],
      required: true,
    },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const EventSchema = new Schema<EventSchemaFields>(
  {
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    endDate: { type: String },
    // Optional: festivals and other all-day events have no start time.
    startTime: { type: String },
    endTime: { type: String },
    location: { type: String, required: true, trim: true },
    address: { type: String },
    type: {
      type: String,
      enum: ["salsa", "bachata", "salsa_bachata", "other", "festival"],
      required: true,
      default: "salsa",
    },
    price: { type: String },
    url: { type: String },
    description: { type: String },
    pinned: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
    seriesId: { type: String, index: true },
    attendees: { type: [AttendeeSchema], default: [] },
  },
  { timestamps: true }
);

// Reuse the compiled model across hot reloads.
export const EventModel: Model<EventSchemaFields> =
  (mongoose.models.Event as Model<EventSchemaFields>) ||
  mongoose.model<EventSchemaFields>("Event", EventSchema);
