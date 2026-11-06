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
