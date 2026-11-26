import type { Tone } from "../ui/badge";
import { linear } from "./scale";

// A trend in the space of a word: the shape of a series inside a table cell or a card, with no axes and no tooltip.
// The figure it summarizes stands beside it as text; the line only says where it has been.

const COLOR: Record<Tone, string> = {
  quiet: "var(--muted)",
  neutral: "var(--ink)",
  info: "var(--accent)",
  ok: "var(--ok)",
  warn: "var(--warn)",
  bad: "var(--bad)",
};

// Room for half the stroke and for the last dot, so nothing is clipped at the edges.
const PAD = 3;

export type SparklineShape = {
  /** One open path per run of values; a gap starts a new one. */
  lines: string[];
  /** The same runs closed down to the floor, for the fill. */
  areas: string[];
  /** Values with a gap on both sides: a line cannot show them. */
  dots: { x: number; y: number }[];
  /** Where the last value is drawn; null with no values. */
  last: { x: number; y: number } | null;
};

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * The marks of a sparkline. A position in `values` is a moment: a `null` (or anything that is not a finite number)
 * keeps its place and breaks the line. A flat series, or a single value, runs through the middle. `min` and `max`
 * fix the domain so several sparklines share one scale; a value outside it is drawn at the edge.
 */
export function sparklineShape(values: readonly (number | null | undefined)[], width: number, height: number, min?: number, max?: number): SparklineShape {
  const points = values.map((value) => (typeof value === "number" && Number.isFinite(value) ? value : null));
  const known = points.filter((value) => value !== null);
  if (known.length === 0) return { lines: [], areas: [], dots: [], last: null };
  const low = min ?? Math.min(...known);
  const high = max ?? Math.max(...known);
  const floor = height - PAD;
  const middle = height / 2;
  const scale = linear([low, high], [floor, PAD]);
  const y = (value: number) => (high > low ? round(Math.min(floor, Math.max(PAD, scale(value)))) : round(middle));
  const across = linear([0, points.length - 1], [PAD, width - PAD]);
  const x = (index: number) => (points.length > 1 ? round(across(index)) : round(width / 2));

  const shape: SparklineShape = { lines: [], areas: [], dots: [], last: null };
  let run: { x: number; y: number }[] = [];
  const close = () => {
    const first = run[0];
    const end = run.at(-1);
    if (first && end && run.length > 1) {
      const line = run.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
      shape.lines.push(line);
      shape.areas.push(`${line} L${end.x},${floor} L${first.x},${floor} Z`);
    } else if (first) {
      shape.dots.push(first);
    }
    run = [];
  };
  points.forEach((value, index) => {
    if (value === null) return close();
    const point = { x: x(index), y: y(value) };
    run.push(point);
    shape.last = point;
  });
  close();
  return shape;
}

/**
 * A small trend of a numeric series, drawn inline. `ariaLabel` says what the shape cannot («Lecturas de la última
 * hora, en alza»): it is the whole of what a screen reader gets. `tone` colors it as a state; `area` fills under the
 * line; `last` marks the latest value. With no values it draws a faint base line, so a cell is never blank.
 */
export function Sparkline({
  values,
  ariaLabel,
  width = 80,
  height = 24,
  tone = "neutral",
  min,
  max,
  area,
  last,
  className = "",
}: {
  /** The series in order; `null` is a moment without a value and breaks the line. */
  values: readonly (number | null)[];
  ariaLabel: string;
  width?: number;
  height?: number;
  tone?: Tone;
  /** The domain, when it is not the series' own extent (several sparklines on one scale). */
  min?: number;
  max?: number;
  area?: boolean;
  last?: boolean;
  className?: string;
}) {
  const shape = sparklineShape(values, width, height, min, max);
  const color = COLOR[tone];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={ariaLabel} className={`inline-block shrink-0 align-middle ${className}`}>
      {!shape.last && <line x1={PAD} x2={width - PAD} y1={height / 2} y2={height / 2} stroke="var(--line-strong)" strokeDasharray="2 3" />}
      {area && shape.areas.map((path, index) => <path key={index} d={path} fill={color} fillOpacity={0.14} stroke="none" />)}
      {shape.lines.map((path, index) => (
        <path key={index} d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {shape.dots.map((dot, index) => (
        <circle key={index} cx={dot.x} cy={dot.y} r={1.5} fill={color} />
      ))}
      {last && shape.last && <circle cx={shape.last.x} cy={shape.last.y} r={2.5} fill={color} stroke="var(--surface)" strokeWidth={1} />}
    </svg>
  );
}
