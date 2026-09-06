"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { NameSettings } from "@/components/NameSettings";

interface AppHeaderProps {
  onAddEvent: () => void;
  onRenamed?: () => void;
}

export function AppHeader({ onAddEvent, onRenamed }: AppHeaderProps) {
  return (
    <header className="mb-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Salsa &amp; Bachata Events</h1>
          <p className="text-sm text-muted">Our group&apos;s shared event calendar</p>
        </div>
        <ThemeToggle />
      </div>

      <button
        type="button"
        onClick={onAddEvent}
        className="min-h-[2.75rem] w-full rounded-xl bg-accent px-4 py-2 text-sm font-medium text-paper shadow-sm active:bg-accent-strong sm:w-auto"
      >
        Add event
      </button>

      <NameSettings onRenamed={onRenamed} />
    </header>
  );
}
