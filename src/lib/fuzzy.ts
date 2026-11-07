// The match of the command palette: every character of the query, in order, anywhere in the text; accents and
// case do not count; a match at the start of a word, or right after the previous character, scores higher.

const fold = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** A score above 0 when `query` matches `text`; 0 when it does not. An empty query matches everything with 1. */
export function fuzzyScore(query: string, text: string): number {
  const q = fold(query.trim());
  if (!q) return 1;
  const t = fold(text);
  let score = 0;
  let position = 0;
  let previous = -2;
  for (const char of q) {
    if (char === " ") continue;
    const at = t.indexOf(char, position);
    if (at < 0) return 0;
    score += at === previous + 1 ? 3 : at === 0 || /[\s\-_/·.]/.test(t[at - 1] ?? "") ? 2 : 1;
    previous = at;
    position = at + 1;
  }
  return score + Math.max(0, 20 - t.length) / 100;
}

/** The items that match, best first; `text` names what to search in each one. */
export function fuzzyFilter<T>(items: T[], query: string, text: (item: T) => string): T[] {
  return items
    .map((item) => ({ item, score: fuzzyScore(query, text(item)) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}
