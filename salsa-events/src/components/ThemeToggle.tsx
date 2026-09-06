"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "theme";

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
  try {
    window.localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  } catch {
    // Storage unavailable (private browsing, etc.) -- theme still applies for this session.
  }
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Reading the class already applied by the inline theme-init script (see
    // layout.tsx) has no render-time equivalent -- it must happen after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const optionClass = (active: boolean) =>
    `min-h-[2.25rem] rounded-full px-3 py-1 text-sm font-medium transition-colors ${
      active ? "bg-accent text-paper" : "text-muted"
    }`;

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-border-strong bg-surface p-0.5"
      role="group"
      aria-label="Theme"
    >
      <button
        type="button"
        onClick={() => {
          setIsDark(false);
          applyTheme(false);
        }}
        aria-pressed={mounted ? !isDark : undefined}
        className={optionClass(mounted && !isDark)}
      >
        Light
      </button>
      <button
        type="button"
        onClick={() => {
          setIsDark(true);
          applyTheme(true);
        }}
        aria-pressed={mounted ? isDark : undefined}
        className={optionClass(mounted && isDark)}
      >
        Dark
      </button>
    </div>
  );
}
