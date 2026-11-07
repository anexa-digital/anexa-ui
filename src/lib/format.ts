import { currentPreferences, type DateFormat, type Preferences } from "./preferences";

// Display formatting, in the preferences in force (lib/preferences.ts): a civil date in the person's format, an
// instant in their time zone, numbers and money in their locale. Nothing here ever goes through a float for money:
// amounts travel as strings.

type Prefs = Pick<Preferences, "locale" | "dateFormat" | "timeZone" | "currency">;
const prefs = (given?: Partial<Prefs>): Prefs => ({ ...currentPreferences(), ...given });

const dateTimeFormats = new Map<string, Intl.DateTimeFormat>();
function dateTimeFormat(locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${timeZone}|${JSON.stringify(options)}`;
  let format = dateTimeFormats.get(key);
  if (!format) {
    try {
      format = new Intl.DateTimeFormat(locale, { timeZone, ...options });
    } catch {
      format = new Intl.DateTimeFormat("es-CO", options);
    }
    dateTimeFormats.set(key, format);
  }
  return format;
}

/** The civil date of an instant in a time zone, as "YYYY-MM-DD" (en-CA spells dates that way). */
export function civilDate(date: Date, timeZone: string): string {
  const parts = dateTimeFormat("en-CA", timeZone, { year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Today's date where the company works ("2026-11-07"), never the browser's UTC day. */
export function todayIso(timeZone = currentPreferences().timeZone): string {
  return civilDate(new Date(), timeZone);
}

/** A civil date "YYYY-MM-DD" plus some days, as "YYYY-MM-DD" (no time zone involved). */
export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, (day ?? 1) + days));
  return date.toISOString().slice(0, 10);
}

/** A civil date ("2026-10-18") in the person's format, without time-zone shifts; anything else comes back as is. */
export function formatDate(iso: string | null | undefined, given?: Partial<Prefs>): string {
  if (!iso) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  return writeDate(year!, month!, day!, prefs(given).dateFormat);
}

function writeDate(year: string, month: string, day: string, format: DateFormat): string {
  if (format === "DD/MM/YYYY") return `${day}/${month}/${year}`;
  if (format === "MM/DD/YYYY") return `${month}/${day}/${year}`;
  return `${year}-${month}-${day}`;
}

/** What the person typed in a date field, as "YYYY-MM-DD"; the ISO form is always accepted. Null when it is no date. */
export function parseDateInput(text: string, format: DateFormat = currentPreferences().dateFormat): string | null {
  const clean = text.trim();
  if (!clean) return null;
  let year: number, month: number, day: number;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(clean);
  const slashed = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(clean);
  const compact = /^(\d{8})$/.exec(clean);
  if (iso) [year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (slashed) {
    const [a, b] = [Number(slashed[1]), Number(slashed[2])];
    [day, month] = format === "MM/DD/YYYY" ? [b, a] : [a, b];
    year = Number(slashed[3]);
  } else if (compact) {
    const digits = compact[1]!;
    if (format === "YYYY-MM-DD") [year, month, day] = [Number(digits.slice(0, 4)), Number(digits.slice(4, 6)), Number(digits.slice(6, 8))];
    else if (format === "MM/DD/YYYY") [month, day, year] = [Number(digits.slice(0, 2)), Number(digits.slice(2, 4)), Number(digits.slice(4, 8))];
    else [day, month, year] = [Number(digits.slice(0, 2)), Number(digits.slice(2, 4)), Number(digits.slice(4, 8))];
  } else return null;
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2200) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}

/** An instant (ISO with offset) as date and time in the person's zone: "7 nov 2026, 14:03". */
export function formatDateTime(iso: string | null | undefined, given?: Partial<Prefs>): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  // The day in the person's date format (the same as every civil date), then the clock in their zone.
  const settings = prefs(given);
  return `${formatDate(civilDate(date, settings.timeZone), settings)} ${dateTimeFormat(settings.locale, settings.timeZone, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date)}`;
}

/** Only the clock of an instant, in the person's zone: "14:03". */
export function formatTime(iso: string | number | Date, given?: Partial<Prefs>): string {
  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  const { locale, timeZone } = prefs(given);
  return dateTimeFormat(locale, timeZone, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}

/** A civil date as a short reading: "5 nov" (this year) or "5 nov 2025". */
export function formatDateShort(iso: string | null | undefined, given?: Partial<Prefs>): string {
  if (!iso) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  const { locale, timeZone } = prefs(given);
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  const thisYear = match[1] === todayIso(timeZone).slice(0, 4);
  return dateTimeFormat(locale, "UTC", thisYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** How long ago an instant was, in words: "hace 2 min", "hace 3 h", "ayer". */
export function formatRelative(iso: string | number | Date, given?: Partial<Prefs>): string {
  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const relative = new Intl.RelativeTimeFormat(prefs(given).locale, { numeric: "auto" });
  const abs = Math.abs(seconds);
  if (abs < 60) return relative.format(seconds, "second");
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), "hour");
  if (abs < 86400 * 30) return relative.format(Math.round(seconds / 86400), "day");
  return formatDate(civilDate(date, prefs(given).timeZone), given);
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

/** A whole number or a float for reading, in the person's locale: 12000 → "12.000" (es-CO). */
export function formatNumber(value: number | string | null | undefined, options: Intl.NumberFormatOptions = {}, given?: Partial<Prefs>): string {
  if (value === null || value === undefined || value === "") return "—";
  const number = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(number)) return String(value);
  return new Intl.NumberFormat(prefs(given).locale, { maximumFractionDigits: 2, ...options }).format(number);
}

/** A percentage from a fraction or a percent value: formatPercent(0.82) → "82 %"; formatPercent(82, { of: 100 }) too. */
export function formatPercent(value: number | string | null | undefined, options: { digits?: number; of?: 1 | 100 } = {}, given?: Partial<Prefs>): string {
  if (value === null || value === undefined || value === "") return "—";
  const number = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(number)) return String(value);
  const fraction = options.of === 100 ? number / 100 : number;
  const { locale } = prefs(given);
  const text = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: options.digits ?? 0 }).format(fraction);
  // Spanish writes a space before the sign (82 %); ICU does not always.
  return locale.startsWith("es") ? text.replace(/(\d)%$/, "$1\u00a0%") : text;
}

/**
 * Money for reading: the amount (a decimal string, never a float on the way in) with the currency's symbol in the
 * person's locale: formatMoney("1842", "COP") → "$ 1.842"; formatMoney("12.5", "USD") → "US$ 12,50".
 */
export function formatMoney(value: string | number | null | undefined, currency?: string, options: { digits?: number } = {}, given?: Partial<Prefs>): string {
  if (value === null || value === undefined || value === "") return "—";
  const settings = prefs(given);
  const code = currency ?? settings.currency;
  const number = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(number)) return String(value);
  const digits = options.digits ?? (code === "COP" ? 0 : 2);
  try {
    return new Intl.NumberFormat(settings.locale, { style: "currency", currency: code, currencyDisplay: "narrowSymbol", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(number);
  } catch {
    return `${formatNumber(number, { minimumFractionDigits: digits, maximumFractionDigits: digits }, given)} ${code}`;
  }
}

/**
 * A decimal string for reading, es-CO style, without ever going through a float: "1849.770000" -> "1.849,77".
 * Trailing zeros go; `fraction` caps the decimals shown by truncation (stored amounts keep all of theirs).
 */
export function formatDecimal(value: string | null | undefined, fraction = 6): string {
  if (value === null || value === undefined || value === "") return "—";
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) return value;
  const [, sign, whole = "0", decimals = ""] = match;
  const { locale } = prefs();
  const sample = new Intl.NumberFormat(locale).formatToParts(1234567.8);
  const group = sample.find((part) => part.type === "group")?.value ?? ".";
  const decimal = sample.find((part) => part.type === "decimal")?.value ?? ",";
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  const shown = decimals.slice(0, fraction).replace(/0+$/, "");
  return `${sign}${grouped}${shown ? `${decimal}${shown}` : ""}`;
}
