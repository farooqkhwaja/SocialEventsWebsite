/**
 * One-time event importer.
 *
 * Adds the user's real events to MongoDB without deleting existing events.
 * Safe to run multiple times: existing matching events are skipped.
 *
 * Usage:
 *   npm run seed-events
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { EventModel } from "../src/models/Event";

dotenv.config({ path: ".env.local" });

const events = [
  {
    title: "Dominican Bachata Rotterdam",
    date: "2026-09-01",
  },
  {
    title: "Laatste Bocadero",
    date: "2026-09-01",
  },
  {
    title: "Laatste Bar Brial",
    date: "2026-09-02",
  },
  {
    title: "Laatste Ark van Noë Kasterlee",
    date: "2026-09-03",
  },
  {
    title: "Parc de Josaphat Brussel",
    date: "2026-09-04",
  },
  {
    title: "Publiek Latina & Flamingo — Plein Publiek",
    date: "2026-09-05",
  },
  {
    title: "Bachata Brisa Rooftop",
    date: "2026-09-06",
  },
  {
    title: "Wolf",
    date: "2026-09-10",
  },
  {
    title: "Bar Once",
    date: "2026-09-11",
  },
  {
    title: "Cuba Bella",
    date: "2026-09-11",
  },
  {
    title: "El Dorado",
    date: "2026-09-11",
  },
  {
    title: "Capital — Zuiderpershuis",
    date: "2026-09-18",
  },
  {
    title: "Ritmo del Caribe Brussel",
    date: "2026-09-18",
  },
  {
    title: "Capital — Zuiderpershuis",
    date: "2026-10-02",
  },
  {
    title: "Pura Cuba Brussel",
    date: "2026-10-10",
  },
  {
    title: "Ritmo del Caribe Brussel",
    date: "2026-10-23",
  },
  {
    title: "Capital — Zuiderpershuis",
    date: "2026-10-24",
  },
  {
    title: "Al Cielo",
    date: "2026-10-30",
  },
  {
    title: "Ritmo del Caribe Brussel",
    date: "2026-11-20",
  },
  {
    title: "Pura Cuba Brussel",
    date: "2026-12-05",
  },
  {
    title: "Merecumbe",
    date: "2026-12-20",
  },
];

async function seedEvents() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "salsa_events";

  if (!uri) {
    console.error(
      "MONGODB_URI is not set. Make sure your .env.local contains it."
    );
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName });

  console.log(`Connected to MongoDB (db: ${dbName})`);
  console.log(`Checking ${events.length} events...\n`);

  let inserted = 0;
  let skipped = 0;

  for (const event of events) {
    const existing = await EventModel.findOne({
      title: event.title,
      date: event.date,
      startTime: "19:00",
    });

    if (existing) {
      console.log(`SKIP     ${event.date}  ${event.title}`);
      skipped++;
      continue;
    }

    await EventModel.create({
      title: event.title,
      date: event.date,
      startTime: "19:00",
      endTime: "00:00",
      location: "Antwerp",
      address: "Antwerp",
      type: "salsa_bachata",
      pinned: false,
      status: "active",
      attendees: [],
    });

    console.log(`INSERT   ${event.date}  ${event.title}`);
    inserted++;
  }

  console.log("\n--------------------------------");
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Total:    ${events.length}`);
  console.log("--------------------------------");

  await mongoose.disconnect();
}

seedEvents().catch((error) => {
  console.error("Event import failed:", error);
  process.exit(1);
});