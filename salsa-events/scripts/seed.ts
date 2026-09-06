/**
 * Development seed script.
 *
 * Populates the database with a handful of example salsa/bachata events so
 * the UI can be reviewed immediately. This data is clearly for local
 * development only -- do not run this against a shared/production database
 * you care about, since it clears the events collection first.
 *
 * Usage: npm run seed
 */
import "dotenv/config";
import mongoose from "mongoose";
import { EventModel } from "../src/models/Event";

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "salsa_events";

  if (!uri) {
    console.error("MONGODB_URI is not set. Copy .env.example to .env.local first.");
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName });
  console.log(`Connected to MongoDB (db: ${dbName}). Clearing existing events...`);
  await EventModel.deleteMany({});

  const events = [
    {
      title: "[Example] Friday Salsa Social",
      date: daysFromNow(0),
      startTime: "20:00",
      endTime: "23:30",
      location: "Antwerp",
      address: "Dansstudio Ritmo, Somewhere 12",
      type: "salsa" as const,
      price: "10 euro",
      url: "https://example.com/friday-salsa",
      description: "Casual social night, open floor, beginner-friendly.",
      pinned: true,
      status: "active" as const,
      attendees: [
        { id: "seed-1", name: "Alex", status: "going" as const, updatedAt: new Date() },
        { id: "seed-2", name: "Sarah", status: "going" as const, updatedAt: new Date() },
        { id: "seed-3", name: "John", status: "maybe" as const, updatedAt: new Date() },
      ],
    },
    {
      title: "[Example] Bachata Sensual Workshop",
      date: daysFromNow(2),
      startTime: "19:00",
      endTime: "21:00",
      location: "Ghent",
      type: "bachata" as const,
      price: "15 euro",
      description: "Intermediate workshop, partner rotation.",
      pinned: false,
      status: "active" as const,
      attendees: [
        { id: "seed-4", name: "Maria", status: "going" as const, updatedAt: new Date() },
      ],
    },
    {
      title: "[Example] Big Latin Party",
      date: daysFromNow(9),
      startTime: "21:00",
      location: "Brussels",
      address: "Grand Ballroom, Main Square 1",
      type: "salsa_bachata" as const,
      price: "20 euro",
      url: "https://example.com/big-latin-party",
      description: "Two rooms, live band later in the evening.",
      pinned: false,
      status: "active" as const,
      attendees: [
        { id: "seed-1", name: "Alex", status: "going" as const, updatedAt: new Date() },
        { id: "seed-5", name: "Tom", status: "not_going" as const, updatedAt: new Date() },
      ],
    },
    {
      title: "[Example] Wednesday Practice Session",
      date: daysFromNow(4),
      startTime: "19:30",
      endTime: "21:00",
      location: "Antwerp",
      type: "salsa" as const,
      description: "Informal practice, bring your own music requests.",
      pinned: false,
      status: "active" as const,
      attendees: [],
    },
    {
      title: "[Example] Rooftop Bachata Night (cancelled)",
      date: daysFromNow(6),
      startTime: "20:30",
      location: "Antwerp",
      type: "bachata" as const,
      price: "12 euro",
      description: "Cancelled due to weather -- will be rescheduled.",
      pinned: false,
      status: "cancelled" as const,
      attendees: [
        { id: "seed-2", name: "Sarah", status: "going" as const, updatedAt: new Date() },
      ],
    },
    {
      title: "[Example] Salsa Congress Day Pass",
      date: daysFromNow(20),
      startTime: "14:00",
      endTime: "02:00",
      location: "Brussels",
      address: "Expo Hall 3",
      type: "salsa_bachata" as const,
      price: "45 euro",
      url: "https://example.com/congress",
      description: "Workshops all afternoon, socials in the evening.",
      pinned: false,
      status: "active" as const,
      attendees: [
        { id: "seed-1", name: "Alex", status: "maybe" as const, updatedAt: new Date() },
        { id: "seed-3", name: "John", status: "going" as const, updatedAt: new Date() },
        { id: "seed-4", name: "Maria", status: "going" as const, updatedAt: new Date() },
      ],
    },
    {
      title: "[Example] Last Month's Social",
      date: daysFromNow(-14),
      startTime: "20:00",
      endTime: "23:00",
      location: "Antwerp",
      type: "salsa" as const,
      description: "Past event, kept for reference in the Past events section.",
      pinned: false,
      status: "active" as const,
      attendees: [
        { id: "seed-5", name: "Tom", status: "going" as const, updatedAt: new Date() },
      ],
    },
  ];

  await EventModel.insertMany(events);
  console.log(`Seeded ${events.length} example events.`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
