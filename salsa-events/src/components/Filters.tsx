"use client";

import type { EventType } from "@/types/event";
import { EVENT_TYPE_FILTER_LABELS } from "@/types/event";

export type TypeFilter = "all" | EventType;

interface FiltersProps {
  activeType: TypeFilter;
  onTypeChange: (type: TypeFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "salsa", label: EVENT_TYPE_FILTER_LABELS.salsa },
  { value: "bachata", label: EVENT_TYPE_FILTER_LABELS.bachata },
  { value: "salsa_bachata", label: EVENT_TYPE_FILTER_LABELS.salsa_bachata },
  { value: "other", label: EVENT_TYPE_FILTER_LABELS.other },
];

export function Filters({ activeType, onTypeChange, search, onSearchChange }: FiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onTypeChange(opt.value)}
            className={`min-h-[2.5rem] shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              activeType === opt.value
                ? "border-accent bg-accent text-paper shadow-sm"
                : "border-border-strong bg-surface text-ink active:bg-paper"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search events or locations"
        className="w-full min-h-[2.75rem] rounded-xl border border-border-strong bg-surface px-4 py-2 text-base text-ink outline-none focus-visible:outline-2 focus-visible:outline-accent sm:max-w-xs sm:text-sm"
      />
    </div>
  );
}
