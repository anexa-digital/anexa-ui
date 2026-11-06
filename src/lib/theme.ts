// The two theme axes of the app: the mode (dark, light or follow the system) and the palette. index.html
// applies both before the first paint from these same localStorage keys; this module changes them afterwards.

export const MODES = ["dark", "light", "system"] as const;
export type Mode = (typeof MODES)[number];

// "classic" is the look without a palette attribute: the tokens of :root in index.css.
export const PALETTES = ["classic", "graphite", "petrol", "indigo"] as const;
export type Palette = (typeof PALETTES)[number];

// What a browser that never chose sees (decided 2026-10-27): light, with the indigo-and-lime palette.
export const DEFAULT_MODE: Mode = "light";
export const DEFAULT_PALETTE: Palette = "indigo";

export const MODE_KEY = "anexa_theme";
export const PALETTE_KEY = "anexa_palette";

function stored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private windows may refuse storage: the choice still applies to this page.
  }
}

export function currentMode(): Mode {
  const value = document.documentElement.getAttribute("data-theme") ?? stored(MODE_KEY);
  return (MODES as readonly string[]).includes(value ?? "") ? (value as Mode) : DEFAULT_MODE;
}

export function currentPalette(): Palette {
  const value = document.documentElement.getAttribute("data-palette") ?? stored(PALETTE_KEY);
  return (PALETTES as readonly string[]).includes(value ?? "") ? (value as Palette) : DEFAULT_PALETTE;
}

export function applyMode(mode: Mode) {
  store(MODE_KEY, mode);
  document.documentElement.setAttribute("data-theme", mode);
}

export function applyPalette(palette: Palette) {
  store(PALETTE_KEY, palette);
  if (palette === "classic") document.documentElement.removeAttribute("data-palette");
  else document.documentElement.setAttribute("data-palette", palette);
}
