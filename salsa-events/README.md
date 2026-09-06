# Salsa & Bachata Events

A single-page event board for a private group to keep track of salsa/bachata
events and indicate who's attending -- no accounts, no login.

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- MongoDB via Mongoose

## 1. Install dependencies

```bash
npm install
```

## 2. Configure MongoDB

Copy the example environment file and fill in your MongoDB connection details:

```bash
cp .env.example .env.local
```

`.env.local` supports two variables:

```
MONGODB_URI=mongodb://localhost:27017/salsa_events
MONGODB_DB=salsa_events
```

- `MONGODB_URI` -- your MongoDB connection string. This can point to a local
  MongoDB instance or a hosted cluster (e.g. MongoDB Atlas).
- `MONGODB_DB` -- the database name to use.

`.env.local` is already excluded from version control (see `.gitignore`), so
your credentials won't be committed.

## 3. Run the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## 4. Seed example data (optional)

To see the UI populated with example events (a mix of normal, pinned,
cancelled, and each event type), run:

```bash
npm run seed
```

This clears the `events` collection in the configured database and inserts
about seven example events, each titled with an `[Example]` prefix. Only run
this against a database you're happy to have reset -- it deletes existing
events first.

## 5. Build for production

```bash
npm run build
npm run start
```

## Required environment variables

| Variable      | Required | Description                                |
| ------------- | -------- | ------------------------------------------- |
| `MONGODB_URI` | Yes      | MongoDB connection string                   |
| `MONGODB_DB`  | No       | Database name (defaults to `salsa_events`)  |

## Project structure

```
src/
  app/
    page.tsx               Single-page event board (client component)
    api/events/             REST API routes (list, create, edit, pin, status, attendance)
  components/                EventCard, EventForm, Filters, AttendanceControls, EmptyState
  lib/                       date formatting, share-text builder, validation, API client, local attendee id
  models/Event.ts            Mongoose schema
  types/event.ts             Shared TypeScript types
scripts/seed.ts               Development seed script
```

## Notes

- There is no authentication. Anyone with the link can view events, add
  events, and mark attendance. Attendance is tied to a locally stored
  identifier in the browser (not a login), so a person can update their own
  response later from the same device/browser.
- Cancelling an event never deletes it -- it's kept and marked "Cancelled",
  and can be restored to active at any time.
- "Share on WhatsApp" opens a pre-filled WhatsApp message (via wa.me) built
  from the event's current details and attendance counts. "Copy details"
  copies the same text to the clipboard.
