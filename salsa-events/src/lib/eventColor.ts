const PALETTE = [
  "blue",
  "purple",
  "pink",
  "green",
  "orange",
  "yellow",
  "teal",
] as const;

export type PaletteColor = (typeof PALETTE)[number];

interface PaletteClasses {
  border: string;
  bg: string;
  text: string;
}

export const PALETTE_CLASSES: Record<PaletteColor, PaletteClasses> = {
  blue: { border: "border-palette-blue", bg: "bg-palette-blue-soft", text: "text-palette-blue" },
  purple: { border: "border-palette-purple", bg: "bg-palette-purple-soft", text: "text-palette-purple" },
  pink: { border: "border-palette-pink", bg: "bg-palette-pink-soft", text: "text-palette-pink" },
  green: { border: "border-palette-green", bg: "bg-palette-green-soft", text: "text-palette-green" },
  orange: { border: "border-palette-orange", bg: "bg-palette-orange-soft", text: "text-palette-orange" },
  yellow: { border: "border-palette-yellow", bg: "bg-palette-yellow-soft", text: "text-palette-yellow" },
  teal: { border: "border-palette-teal", bg: "bg-palette-teal-soft", text: "text-palette-teal" },
};

/**
 * Picks a stable palette color for an event from its (permanent) database id,
 * so the color survives refreshes without needing to be stored anywhere.
 */
export function paletteColorFor(id: string): PaletteColor {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
