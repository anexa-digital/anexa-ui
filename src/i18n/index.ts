import { esCO } from "./es-CO";
import { format } from "./format";

// Every user-facing text goes through t(): components never embed literals. The kit ships the texts of its own
// components (es-CO); each app adds its domain catalog with extendMessages() before rendering.
export type Locale = "es-CO";

const catalogs: Record<Locale, Record<string, string>> = { "es-CO": { ...esCO } };

let activeLocale: Locale = "es-CO";

export function setLocale(locale: Locale): void {
  activeLocale = locale;
}

/** Adds (or overrides) texts of a locale: the app's catalog over the kit's. */
export function extendMessages(locale: Locale, messages: Record<string, string>): void {
  Object.assign(catalogs[locale], messages);
}

export type MessageKey = string;

export function t(key: MessageKey, params?: Record<string, string | number>): string {
  return format(catalogs[activeLocale][key] ?? key, params);
}

/** Lookup for keys built at runtime; undefined when the catalog has no entry. */
export function lookup(key: string): string | undefined {
  return catalogs[activeLocale][key];
}
