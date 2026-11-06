// Scales and ticks of the simulation charts. Geometry only: values travel as decimal strings and are
// shown with formatDecimal; a number here only decides where a mark is drawn.

export const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === "") return 0;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
};

/** A linear map from [domain] to [range]; a flat domain maps to the start of the range. */
export function linear(domain: [number, number], range: [number, number]): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  return (value) => (span === 0 ? r0 : r0 + ((value - d0) / span) * (r1 - r0));
}

/** Round tick steps (1, 2, 5 x 10^n) covering [low, high] with about `count` ticks; the domain grows to them. */
export function niceTicks(low: number, high: number, count = 4): number[] {
  if (!Number.isFinite(low) || !Number.isFinite(high)) return [0];
  if (low === high) {
    if (low === 0) return [0, 1];
    [low, high] = low > 0 ? [0, low] : [low, 0];
  }
  const raw = (high - low) / Math.max(1, count);
  const power = 10 ** Math.floor(Math.log10(raw));
  const error = raw / power; // the step closest to the raw one, as d3 picks it
  const step = power * (error >= Math.sqrt(50) ? 10 : error >= Math.sqrt(10) ? 5 : error >= Math.sqrt(2) ? 2 : 1);
  const start = Math.floor(low / step) * step;
  const ticks: number[] = [];
  const end = Math.ceil(high / step) * step;
  for (let value = start; value <= end + step / 2; value += step) ticks.push(Number(value.toPrecision(12)));
  return ticks;
}

/** The extent of some values, always including zero (bars start at the baseline). */
export function extentWithZero(values: number[]): [number, number] {
  let low = 0;
  let high = 0;
  for (const value of values) {
    if (value < low) low = value;
    if (value > high) high = value;
  }
  return [low, high];
}

export type Step = { label: string; start: number; end: number; kind: "total" | "rise" | "fall" };

/** A waterfall: from the first total, each change moves the running total, and the last total closes it. */
export function waterfall(startLabel: string, start: number, changes: { label: string; change: number }[], endLabel: string): Step[] {
  const steps: Step[] = [{ label: startLabel, start: 0, end: start, kind: "total" }];
  let running = start;
  for (const item of changes) {
    steps.push({ label: item.label, start: running, end: running + item.change, kind: item.change >= 0 ? "rise" : "fall" });
    running += item.change;
  }
  steps.push({ label: endLabel, start: 0, end: running, kind: "total" });
  return steps;
}

/** Share of each light in a total, in percent (for stacked bars); zero total gives zeros. */
export function shares(counts: { red: number; yellow: number; green: number }): { red: number; yellow: number; green: number } {
  const total = counts.red + counts.yellow + counts.green;
  if (!total) return { red: 0, yellow: 0, green: 0 };
  return { red: (counts.red / total) * 100, yellow: (counts.yellow / total) * 100, green: (counts.green / total) * 100 };
}
