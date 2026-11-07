// The axes of the screen: the skin (the whole look: color, type, shape, chrome), the mode (dark, light or follow the
// system), the density (compact for a desk, comfortable for a finger) and whether actions show their keys. index.html
// applies them before the first paint from these same localStorage keys; this module changes them afterwards and
// lets the app set defaults (per company, per build) that apply to whoever never chose.

import { installFonts } from "../styles/fonts";

export const MODES = ["dark", "light", "system"] as const;
export type Mode = (typeof MODES)[number];

export const SKINS = ["cockpit", "ledger", "terminal", "studio", "blueprint", "classic"] as const;
export type Skin = (typeof SKINS)[number];

export const DENSITIES = ["compact", "comfortable"] as const;
export type Density = (typeof DENSITIES)[number];

export const LAYOUTS = ["top", "rail", "sidebar"] as const;
export type Layout = (typeof LAYOUTS)[number];

export const DEFAULT_SKIN: Skin = "cockpit";
export const DEFAULT_DENSITY: Density = "compact";

/** The mode a skin was drawn for: what a browser that never chose a mode sees. */
export const SKIN_MODE: Record<Skin, Exclude<Mode, "system">> = { cockpit: "dark", terminal: "dark", ledger: "light", studio: "light", blueprint: "light", classic: "light" };
/** The chrome a skin proposes; AppShell takes it unless the app says otherwise. */
export const SKIN_LAYOUT: Record<Skin, Layout> = { cockpit: "rail", studio: "sidebar", ledger: "top", terminal: "top", blueprint: "top", classic: "top" };
/** Whether a skin shows the key of every action by default. */
export const SKIN_KEYS: Record<Skin, boolean> = { cockpit: false, ledger: false, terminal: true, studio: false, blueprint: false, classic: false };

export const MODE_KEY = "anexa_theme";
export const SKIN_KEY = "anexa_skin";
export const DENSITY_KEY = "anexa_density";
export const KEYS_KEY = "anexa_keys";
/** The palette axis of 0.3, replaced by the skins: a stored palette means the person was on the classic look. */
export const LEGACY_PALETTE_KEY = "anexa_palette";

/** Defaults the app sets (per company, per build) for whoever never chose; they never override a stored choice. */
export type ThemeDefaults = { skin?: Skin; mode?: Mode; density?: Density; showKeys?: boolean };
let defaults: ThemeDefaults = {};
export function appDefaults(next: ThemeDefaults): void {
  defaults = { ...defaults, ...next };
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function storage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function stored(key: string): string | null {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function store(key: string, value: string) {
  try {
    storage()?.setItem(key, value);
  } catch {
    // Private windows may refuse storage: the choice still applies to this page.
  }
}

const root = () => document.documentElement;
const pick = <T extends string>(options: readonly T[], value: string | null | undefined, fallback: T): T => ((options as readonly string[]).includes(value ?? "") ? (value as T) : fallback);

/** 0.3 kept a palette; 0.4 keeps a skin. A stored palette and no skin means "classic"; the old key goes away. */
export function migrateLegacyPalette(target: StorageLike | null = storage()): Skin | null {
  if (!target) return null;
  const palette = target.getItem(LEGACY_PALETTE_KEY);
  if (palette === null) return null;
  target.removeItem(LEGACY_PALETTE_KEY);
  if (target.getItem(SKIN_KEY) !== null) return null;
  target.setItem(SKIN_KEY, "classic");
  return "classic";
}

export function currentSkin(): Skin {
  return pick(SKINS, root().getAttribute("data-skin") ?? stored(SKIN_KEY) ?? defaults.skin, DEFAULT_SKIN);
}

export function currentMode(): Mode {
  const chosen = root().getAttribute("data-theme") ?? stored(MODE_KEY) ?? defaults.mode;
  return pick(MODES, chosen, SKIN_MODE[currentSkin()]);
}

export function currentDensity(): Density {
  return pick(DENSITIES, root().getAttribute("data-density") ?? stored(DENSITY_KEY) ?? defaults.density, DEFAULT_DENSITY);
}

export function currentShowKeys(): boolean {
  const attribute = root().getAttribute("data-keys");
  if (attribute !== null) return attribute === "on";
  const chosen = stored(KEYS_KEY);
  if (chosen !== null) return chosen === "on";
  return defaults.showKeys ?? SKIN_KEYS[currentSkin()];
}

export function applyMode(mode: Mode) {
  store(MODE_KEY, mode);
  root().setAttribute("data-theme", mode);
}

export function applySkin(skin: Skin) {
  store(SKIN_KEY, skin);
  root().setAttribute("data-skin", skin);
  // Whoever never chose a mode or the keys follows the skin's own.
  if (stored(MODE_KEY) === null && !defaults.mode) root().setAttribute("data-theme", SKIN_MODE[skin]);
  if (stored(KEYS_KEY) === null && defaults.showKeys === undefined) root().setAttribute("data-keys", SKIN_KEYS[skin] ? "on" : "off");
}

export function applyDensity(density: Density) {
  store(DENSITY_KEY, density);
  root().setAttribute("data-density", density);
}

export function applyShowKeys(show: boolean) {
  store(KEYS_KEY, show ? "on" : "off");
  root().setAttribute("data-keys", show ? "on" : "off");
}

/** Shows a skin without choosing it (the playground, a gallery); `previewSkin(null)` restores the choice. */
export function previewSkin(skin: Skin | null) {
  const target = skin ?? pick(SKINS, stored(SKIN_KEY) ?? defaults.skin, DEFAULT_SKIN);
  root().setAttribute("data-skin", target);
  if (stored(MODE_KEY) === null && !defaults.mode) root().setAttribute("data-theme", SKIN_MODE[target]);
}

/**
 * Puts every axis on <html> from what is stored, the app's defaults and the skin's own mode. index.html does the same
 * inline before the first paint (see docs/ADOPCION.md); this one serves the playground and any app that renders late.
 */
export function applyStoredTheme(): void {
  installFonts();
  migrateLegacyPalette();
  const skin = pick(SKINS, stored(SKIN_KEY) ?? defaults.skin, DEFAULT_SKIN);
  root().setAttribute("data-skin", skin);
  root().setAttribute("data-theme", pick(MODES, stored(MODE_KEY) ?? defaults.mode, SKIN_MODE[skin]));
  root().setAttribute("data-density", pick(DENSITIES, stored(DENSITY_KEY) ?? defaults.density, DEFAULT_DENSITY));
  const keys = stored(KEYS_KEY);
  root().setAttribute("data-keys", (keys !== null ? keys === "on" : (defaults.showKeys ?? SKIN_KEYS[skin])) ? "on" : "off");
}
