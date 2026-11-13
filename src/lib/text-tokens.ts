// Text with tokens: free text where some pieces are references (a variable, an action, a file) written as
// `⟦kind:key⟧`. The app decides what a token means; the kit only splits, finds and inserts them.

/** A token in the stored text. The default shape is `⟦…⟧` with no spaces or closing bracket inside. */
export const TOKEN_PATTERN = /⟦[^⟧\s]+⟧/g;

export type TokenPart = { text: string } | { token: string };

/** The text split into plain runs and tokens, in order; empty runs are dropped. */
export function tokenParts(value: string, pattern: RegExp = TOKEN_PATTERN): TokenPart[] {
  const parts: TokenPart[] = [];
  const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  let last = 0;
  for (const match of value.matchAll(re)) {
    const at = match.index ?? 0;
    if (at > last) parts.push({ text: value.slice(last, at) });
    parts.push({ token: match[0] });
    last = at + match[0].length;
  }
  if (last < value.length) parts.push({ text: value.slice(last) });
  return parts;
}

/** The tokens of the text that none of the known ones matches, once each, in order of appearance. */
export function unknownTokens(value: string, known: Iterable<string>, pattern: RegExp = TOKEN_PATTERN): string[] {
  const set = new Set(known);
  const out: string[] = [];
  for (const part of tokenParts(value, pattern)) {
    if ("token" in part && !set.has(part.token) && !out.includes(part.token)) out.push(part.token);
  }
  return out;
}

/** Inserts a token at a text offset, with a space on each side where the neighbours are not already blank. */
export function insertToken(value: string, at: number, token: string): { value: string; caret: number } {
  const where = Math.max(0, Math.min(at, value.length));
  const before = value.slice(0, where);
  const after = value.slice(where);
  const left = before && !/\s$/.test(before) ? " " : "";
  const right = !after || !/^\s/.test(after) ? " " : "";
  const inserted = `${left}${token}${right}`;
  return { value: before + inserted + after, caret: where + inserted.length };
}
