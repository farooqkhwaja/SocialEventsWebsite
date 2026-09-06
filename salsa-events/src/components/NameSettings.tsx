"use client";

import { useEffect, useState } from "react";
import {
  getLocalAttendeeId,
  getLocalAttendeeName,
  setLocalAttendeeName,
} from "@/lib/localAttendee";
import { renameAttendee } from "@/lib/api";

interface NameSettingsProps {
  onRenamed?: () => void;
}

export function NameSettings({ onRenamed }: NameSettingsProps) {
  const [name, setName] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Reading localStorage has no render-time equivalent -- it must happen
    // after mount to avoid a server/client markup mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(getLocalAttendeeName());
  }, []);

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) return;

    setSaving(true);
    setLocalAttendeeName(trimmed);
    try {
      // Updates the name on every event this browser already has an
      // attendance entry for, so past responses show the new name too.
      await renameAttendee(getLocalAttendeeId(), trimmed);
      onRenamed?.();
    } catch {
      // Non-fatal: the local name is still updated and used going forward,
      // even if syncing existing records failed.
    }
    setName(trimmed);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <input
          type="text"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
          placeholder="Your name"
          className="min-h-[2.25rem] rounded-lg border border-border-strong bg-paper px-3 py-1 text-sm text-ink outline-none focus-visible:outline-2 focus-visible:outline-accent"
        />
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!draft.trim() || saving}
          className="min-h-[2.25rem] rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-paper disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="min-h-[2.25rem] rounded-lg px-2 py-1.5 text-sm text-muted"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted">
      {name ? `Your name: ${name}` : "You haven't set a name yet."}{" "}
      <button
        type="button"
        onClick={() => {
          setDraft(name ?? "");
          setEditing(true);
        }}
        className="font-medium text-accent underline underline-offset-2"
      >
        Change name
      </button>
    </p>
  );
}
