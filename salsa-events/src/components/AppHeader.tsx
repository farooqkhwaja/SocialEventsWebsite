"use client";

import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { NameSettings } from "./NameSettings";

interface AppHeaderProps {
  onAddEvent: () => void;
  onRenamed?: () => void;
}

export function AppHeader({ onAddEvent, onRenamed }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu when clicking outside it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header className="mb-6">
      {/* Top row */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="min-w-0 font-display text-xl text-ink sm:text-2xl">
          Salsa &amp; Bachata Events
        </h1>

        <div className="flex shrink-0 items-center gap-2">
          {/* Add event */}
          <button
            type="button"
            onClick={onAddEvent}
            className="
              min-h-[2.5rem]
              rounded-xl
              bg-accent
              px-3.5 py-2
              text-sm font-medium
              text-paper
              shadow-sm
              transition
              hover:bg-accent-strong
              active:scale-[0.98]
              sm:px-4
            "
          >
            <span className="sm:hidden">+ Add</span>
            <span className="hidden sm:inline">+ Add event</span>
          </button>

          {/* Three-dot menu */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Open settings"
              aria-expanded={menuOpen}
              className="
                flex
                h-10 w-10
                items-center justify-center
                rounded-xl
                border border-border-strong
                bg-surface
                text-lg
                tracking-widest
                text-muted
                transition
                hover:bg-paper
                hover:text-ink
                active:scale-[0.96]
                focus-visible:outline-2
                focus-visible:outline-accent
              "
            >
              <span className="-mt-2">...</span>
            </button>

            {menuOpen && (
              <div
                className="
                  absolute right-0 top-[calc(100%+0.5rem)]
                  z-50
                  w-64
                  overflow-hidden
                  rounded-2xl
                  border border-border-strong
                  bg-surface
                  shadow-xl
                "
              >
                {/* Appearance */}
                <div className="border-b border-border px-4 py-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                    Appearance
                  </p>

                  <ThemeToggle />
                </div>

                {/* Name */}
                <div className="px-4 py-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                    Your name
                  </p>

                  <NameSettings onRenamed={onRenamed} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subtle separator */}
      <div className="mt-4 border-b border-border" />
    </header>
  );
}

