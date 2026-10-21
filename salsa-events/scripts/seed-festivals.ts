/**
 * Adds the 2027 festival list to MongoDB without touching existing events.
 * Safe to run multiple times: festivals already present (same title and
 * start date) are skipped.
 *
 * Usage:
 *   npm run seed-festivals
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { EventModel } from "../src/models/Event";

dotenv.config({ path: ".env.local" });

// All-day, multi-day events: no start time, `endDate` is the last day.
const festivals: { title: string; date: string; endDate?: string; location: string }[] = [
  { title: "Mega Beach Festival", date: "2027-07-01", endDate: "2027-07-04", location: "Middelkerke" },
  { title: "Afro-Latino Festival", date: "2027-07-09", endDate: "2027-07-11", location: "Genk" },
  { title: "Gentse Feesten", date: "2027-07-16", endDate: "2027-07-25", location: "Gent" },
  { title: "Zomercarnaval", date: "2027-07-22", endDate: "2027-07-25", location: "Rotterdam" },
  { title: "Antilliaanse Feesten", date: "2027-08-12", endDate: "2027-08-15", location: "Hoogstraten" },
  { title: "Latin Village", date: "2027-08-15", location: "Amsterdam" },
  { title: "Fiesta Latina", date: "2027-08-27", endDate: "2027-08-29", location: "Brussel" },
];

async function seedFestivals() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "salsa_events";

  if (!uri) {
    console.error("MONGODB_URI is not set. Make sure your .env.local contains it.");
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName });
  console.log(`Connected to MongoDB (db: ${dbName})\n`);

  let inserted = 0;
  let skipped = 0;

  for (const festival of festivals) {
    const existing = await EventModel.findOne({ title: festival.title, date: festival.date });

    if (existing) {
      console.log(`SKIP     ${festival.date}  ${festival.title}`);
      skipped++;
      continue;
    }

    await EventModel.create({
      ...festival,
      type: "festival",
      pinned: false,
      status: "active",
      attendees: [],
    });

    console.log(`INSERT   ${festival.date}  ${festival.title}`);
    inserted++;
  }

  console.log(`\nInserted: ${inserted}  Skipped: ${skipped}  Total: ${festivals.length}`);
  await mongoose.disconnect();
}

seedFestivals().catch((error) => {
  console.error("Festival import failed:", error);
  process.exit(1);
});
