import { Store } from "@tanstack/store";
import { useStore } from "@tanstack/react-store";

// What the person (or their company) chose for reading dates, numbers and money: the locale, the date format, the
// time zone and the currency. One store outside React, so the formatters work in column cells and in code; an app
// loads it from its server (the tenant's defaults, then the person's own) and the screens follow at once.

export const DATE_FORMATS = ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"] as const;
export type DateFormat = (typeof DATE_FORMATS)[number];

export type Preferences = {
  /** BCP 47: "es-CO", "en-US". Drives Intl (numbers, month names, week start). */
  locale: string;
  dateFormat: DateFormat;
  /** IANA: "America/Bogota". The date of «today» and the clock of every instant. */
  timeZone: string;
  /** ISO 4217: "COP". The currency `formatMoney` assumes when none is given. */
  currency: string;
};

export const DEFAULT_PREFERENCES: Preferences = { locale: "es-CO", dateFormat: "YYYY-MM-DD", timeZone: "America/Bogota", currency: "COP" };

export const preferencesStore = new Store<Preferences>(DEFAULT_PREFERENCES);

/** The preferences in force, outside React (formatters, column cells). */
export const currentPreferences = (): Preferences => preferencesStore.state;

/** Changes the preferences in force (an app does it when its server answers, and when the person edits them). */
export function setPreferences(next: Partial<Preferences>): void {
  const clean = Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined && value !== null && value !== ""));
  preferencesStore.setState((previous) => ({ ...previous, ...clean }));
}

/** The preferences in force, live. */
export function usePreferences(): Preferences {
  return useStore(preferencesStore);
}

/** Whether a string is a time zone Intl knows. */
export function isTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}
