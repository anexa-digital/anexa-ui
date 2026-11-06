// Display formatting. Dates are shown in the browser's time zone with the es-CO conventions.

const dateTime = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" });

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : dateTime.format(date);
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
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
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const shown = decimals.slice(0, fraction).replace(/0+$/, "");
  return `${sign}${grouped}${shown ? `,${shown}` : ""}`;
}

/** A civil date ("2026-10-18") as es-CO text, without time-zone shifts. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return year && month && day ? `${day}/${month}/${year}` : iso;
}
