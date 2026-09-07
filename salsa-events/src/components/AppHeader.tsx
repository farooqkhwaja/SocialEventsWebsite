"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { NameSettings } from "@/components/NameSettings";

interface AppHeaderProps {
  onAddEvent: () => void;
  onRenamed?: () => void;
}

export function AppHeader({ onAddEvent, onRenamed }: AppHeaderProps) {
  return (
    <header className="mb-5 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-xl text-ink sm:text-2xl">Salsa &amp; Bachata Events</h1>
          <p className="text-xs text-muted sm:text-sm">Our group&apos;s shared event calendar</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <NameSettings onRenamed={onRenamed} />
        <button
          type="button"
          onClick={onAddEvent}
          className="min-h-[2.5rem] shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-paper shadow-sm active:bg-accent-strong"
        >
          Add event
        </button>
      </div>
    </header>
  );
}

