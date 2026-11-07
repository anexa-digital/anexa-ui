// Where the login sends the person afterwards (`?next=`). Only a path of this app: never another site, never a
// protocol-relative address, so a crafted link cannot send a fresh session somewhere else.

export function safeNext(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/";
  return next;
}

export function validateLoginSearch(search: Record<string, unknown>): { next?: string } {
  const next = safeNext(search.next);
  return next === "/" ? {} : { next };
}

// Back to the list as it was: a list screen remembers its search (filters, order, page) under its path while it is
// shown; a detail screen builds its link back from that memory, so «← Cotizaciones» lands on the same page and filters.
const RETURN_KEY = (path: string) => `anexa_return_${path}`;

/** A list screen calls it with its path and its current search (URL state); the memory lives in this tab. */
export function rememberListSearch(path: string, search: Record<string, unknown>): void {
  try {
    sessionStorage.setItem(RETURN_KEY(path), JSON.stringify(search));
  } catch {
    // Without storage the detail goes back to the plain list.
  }
}

/** The search the list had when it was left, or `fallback` (empty by default). */
export function listReturnSearch(path: string, fallback: Record<string, unknown> = {}): Record<string, unknown> {
  try {
    const raw = sessionStorage.getItem(RETURN_KEY(path));
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : fallback;
  } catch {
    return fallback;
  }
}
