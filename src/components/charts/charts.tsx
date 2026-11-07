import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { t } from "../../i18n";
import { formatDecimal } from "../../lib/format";
import { extentWithZero, linear, niceTicks, shares, toNumber, waterfall } from "./scale";

// The simulation charts, drawn in SVG with the theme's tokens (index.css) so dark mode and print work.
// Thin marks with rounded-[var(--radius-sm)] ends at the data, a hairline grid, labels in ink (never in the series colour), a tooltip on
// hover and focus, and the same data as a table one click away: colour never carries a meaning alone.

type Tip = { x: number; y: number; lines: string[] } | null;

function Tooltip({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--raised)] px-2 py-1 text-xs shadow-[var(--shadow)]"
      style={{ left: tip.x + 12, top: tip.y + 12 }}
    >
      {tip.lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </div>
  );
}

function useTip() {
  const [tip, setTip] = useState<Tip>(null);
  const show = (event: { currentTarget: Element; clientX?: number; clientY?: number }, lines: string[]) => {
    const box = event.currentTarget.closest("figure")?.getBoundingClientRect();
    const target = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX ?? target.left + target.width / 2) - (box?.left ?? 0);
    const y = (event.clientY ?? target.top) - (box?.top ?? 0);
    setTip({ x, y, lines });
  };
  return { tip, show, hide: () => setTip(null) };
}


/** The width the chart really has, so it draws at that size: text stays at its size whatever the panel's width. */
function useWidth(fallback = 560): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const next = Math.round(entries[0]?.contentRect.width ?? fallback);
      if (next > 0) setWidth(Math.max(320, next));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [fallback]);
  return [ref, width];
}

/** A figure: its title, the chart, a legend when there is more than one series, and a table behind a toggle. */
function Figure({ title, legend, table, children }: { title: string; legend?: { label: string; color: string }[]; table?: ReactNode; children: ReactNode }) {
  return (
    <figure className="relative m-0 flex flex-col gap-2">
      <figcaption className="flex flex-wrap items-center gap-3">
        <span className="font-medium">{title}</span>
        {legend && legend.length > 1 && (
          <span className="flex flex-wrap gap-3 text-xs text-[var(--muted)]">
            {legend.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-1">
                <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
          </span>
        )}
      </figcaption>
      {children}
      {table && (
        <details className="text-sm">
          <summary className="cursor-pointer text-[var(--muted)]">{t("charts.asTable")}</summary>
          <div className="mt-1 overflow-x-auto">{table}</div>
        </details>
      )}
    </figure>
  );
}

const cell = "px-2 py-1";

function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="data-table">
      <thead className="text-[var(--muted)]">
        <tr>
          {head.map((label) => (
            <th key={label} className={`${cell} font-normal`}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="border-t border-[var(--line)]">
            {row.map((value, position) => (
              <td key={position} className={`${cell} ${position ? "text-right num" : ""}`}>
                {value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const LIGHT_COLOR = { red: "var(--bad)", yellow: "var(--warn)", green: "var(--ok)" } as const;

/** The index lights of every option, before and after: two stacked bars with each share labelled. */
export function StackedLights({ base, run }: { base: { red: number; yellow: number; green: number }; run: { red: number; yellow: number; green: number } }) {
  const { tip, show, hide } = useTip();
  const rows = [
    { label: t("charts.base"), counts: base },
    { label: t("charts.simulated"), counts: run },
  ];
  const width = 100;
  return (
    <Figure
      title={t("charts.lightsTitle")}
      legend={(["green", "yellow", "red"] as const).map((light) => ({ label: t(`charts.light.${light}`), color: LIGHT_COLOR[light] }))}
      table={
        <DataTable
          head={[t("charts.set"), t("charts.light.green"), t("charts.light.yellow"), t("charts.light.red")]}
          rows={rows.map((row) => [row.label, row.counts.green, row.counts.yellow, row.counts.red])}
        />
      }
    >
      <div className="flex flex-col gap-2" role="img" aria-label={t("charts.lightsAria", { base: base.green, run: run.green })}>
        {rows.map((row) => {
          const share = shares(row.counts);
          let offset = 0;
          return (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-[var(--muted)]">{row.label}</span>
              <svg viewBox={`0 0 ${width} 10`} preserveAspectRatio="none" className="h-[var(--control-h)] min-w-0 flex-1 overflow-visible">
                {(["green", "yellow", "red"] as const).map((light) => {
                  const value = share[light];
                  const x = offset;
                  offset += value;
                  if (!value) return null;
                  return (
                    <rect
                      key={light}
                      className="chart-bar"
                      x={x + 0.2}
                      y={0}
                      width={Math.max(0, value - 0.4)}
                      height={10}
                      rx={0.8}
                      fill={LIGHT_COLOR[light]}
                      tabIndex={0}
                      onMouseMove={(event) => show(event, [`${row.label} · ${t(`charts.light.${light}`)}`, t("charts.optionsShare", { options: row.counts[light], share: value.toFixed(1) })])}
                      onFocus={(event) => show(event, [`${row.label} · ${t(`charts.light.${light}`)}`, t("charts.optionsShare", { options: row.counts[light], share: value.toFixed(1) })])}
                      onMouseLeave={hide}
                      onBlur={hide}
                    />
                  );
                })}
              </svg>
              <span className="w-24 shrink-0 text-right text-sm">
                {t("charts.greenShare", { share: share.green.toFixed(0) })}
              </span>
            </div>
          );
        })}
      </div>
      <Tooltip tip={tip} />
    </Figure>
  );
}

/** How many options moved how many index points: negatives in the fall colour, positives in the rise colour. */
export function Histogram({ buckets }: { buckets: { change: string; options: number }[] }) {
  const { tip, show, hide } = useTip();
  const [box, width] = useWidth();
  const height = 180;
  const pad = { top: 16, right: 8, bottom: 34, left: 40 };
  const max = Math.max(1, ...buckets.map((bucket) => bucket.options));
  const ticks = niceTicks(0, max, 3);
  const top = ticks[ticks.length - 1] ?? max;
  const y = linear([0, top], [height - pad.bottom, pad.top]);
  const band = (width - pad.left - pad.right) / Math.max(1, buckets.length);
  const tone = (label: string) => (label.startsWith("<") || label.startsWith("-") ? "var(--fall)" : label === "0" ? "var(--series-base)" : "var(--rise)");
  return (
    <Figure
      title={t("charts.changesTitle")}
      legend={[
        { label: t("charts.fall"), color: "var(--fall)" },
        { label: t("charts.noChange"), color: "var(--series-base)" },
        { label: t("charts.rise"), color: "var(--rise)" },
      ]}
      table={<DataTable head={[t("charts.indexPoints"), t("charts.options")]} rows={buckets.map((bucket) => [bucket.change, bucket.options])} />}
    >
      <div ref={box}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="block max-w-full" role="img" aria-label={t("charts.changesAria")}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} stroke="var(--grid)" />
            <text x={pad.left - 6} y={y(tick)} dy="0.32em" textAnchor="end" fontSize="10" fill="var(--muted)">
              {tick.toLocaleString("es-CO")}
            </text>
          </g>
        ))}
        {buckets.map((bucket, index) => {
          const x = pad.left + index * band + 3;
          const barHeight = y(0) - y(bucket.options);
          const lines = [t("charts.pointsLabel", { change: bucket.change }), t("charts.optionsCount", { options: bucket.options })];
          return (
            <g key={bucket.change}>
              <rect
                className="chart-bar"
                x={x}
                y={y(bucket.options)}
                width={band - 6}
                height={Math.max(0, barHeight)}
                rx={3}
                fill={tone(bucket.change)}
                tabIndex={0}
                onMouseMove={(event) => show(event, lines)}
                onFocus={(event) => show(event, lines)}
                onMouseLeave={hide}
                onBlur={hide}
              />
              {bucket.options > 0 && (
                <text x={x + (band - 6) / 2} y={y(bucket.options) - 4} textAnchor="middle" fontSize="10" fill="var(--ink)">
                  {bucket.options.toLocaleString("es-CO")}
                </text>
              )}
              <text x={x + (band - 6) / 2} y={height - pad.bottom + 14} textAnchor="middle" fontSize="10" fill="var(--muted)">
                {bucket.change}
              </text>
            </g>
          );
        })}
        <line x1={pad.left} x2={width - pad.right} y1={y(0)} y2={y(0)} stroke="var(--axis)" />
        <text x={(width + pad.left) / 2} y={height - 4} textAnchor="middle" fontSize="10" fill="var(--muted)">
          {t("charts.indexPoints")}
        </text>
      </svg>
      </div>
      <Tooltip tip={tip} />
    </Figure>
  );
}

/** How the calculated price of the portfolio goes from the baseline to the simulation, concept by concept. */
export function Waterfall({
  base,
  run,
  concepts,
  limit = 10,
}: {
  base: string | null;
  run: string | null;
  concepts: { concept: string; change: string | null }[];
  limit?: number;
}) {
  const { tip, show, hide } = useTip();
  const moved = concepts.filter((item) => toNumber(item.change) !== 0);
  const shown = moved.slice(0, limit);
  const rest = moved.slice(limit).reduce((sum, item) => sum + toNumber(item.change), 0);
  const changes = shown.map((item) => ({ label: item.concept, change: toNumber(item.change) }));
  if (rest) changes.push({ label: t("charts.otherConcepts", { count: moved.length - limit }), change: rest });
  const steps = waterfall(t("charts.base"), toNumber(base), changes, t("charts.simulated"));
  const values = steps.flatMap((step) => [step.start, step.end]);
  const [low, high] = extentWithZero(values);
  const rowHeight = 22;
  const [box, width] = useWidth();
  const labelWidth = 170;
  const valueWidth = 90;
  const x = linear([low, high], [labelWidth, width - valueWidth]);
  const height = steps.length * rowHeight + 8;
  const color = { total: "var(--series-base)", rise: "var(--fall)", fall: "var(--rise)" } as const; // more cost is worse
  return (
    <Figure
      title={t("charts.bridgeTitle")}
      legend={[
        { label: t("charts.costUp"), color: "var(--fall)" },
        { label: t("charts.costDown"), color: "var(--rise)" },
      ]}
      table={
        <DataTable
          head={[t("charts.concept"), t("charts.change")]}
          rows={[[t("charts.base"), formatDecimal(base, 0)], ...concepts.map((item) => [item.concept, formatDecimal(item.change, 0)]), [t("charts.simulated"), formatDecimal(run, 0)]]}
        />
      }
    >
      <div ref={box}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="block max-w-full" role="img" aria-label={t("charts.bridgeAria")}>
        {steps.map((step, index) => {
          const top = index * rowHeight + 4;
          const left = x(Math.min(step.start, step.end));
          const barWidth = Math.max(1.5, Math.abs(x(step.end) - x(step.start)));
          const amount = step.kind === "total" ? step.end : step.end - step.start;
          const text = `${step.kind === "rise" ? "+" : ""}${Math.round(amount).toLocaleString("es-CO")}`;
          const lines = [step.label, step.kind === "total" ? t("charts.totalOf", { value: text }) : t("charts.changeOf", { value: text })];
          return (
            <g key={`${step.label}-${index}`}>
              <text x={labelWidth - 8} y={top + rowHeight / 2} dy="0.1em" textAnchor="end" fontSize="11" fill={step.kind === "total" ? "var(--ink)" : "var(--muted)"}>
                {step.label.length > 26 ? `${step.label.slice(0, 25)}…` : step.label}
              </text>
              <rect
                className="chart-bar"
                x={left}
                y={top + 3}
                width={barWidth}
                height={rowHeight - 8}
                rx={3}
                fill={color[step.kind]}
                tabIndex={0}
                onMouseMove={(event) => show(event, lines)}
                onFocus={(event) => show(event, lines)}
                onMouseLeave={hide}
                onBlur={hide}
              />
              <text x={width - valueWidth + 6} y={top + rowHeight / 2} dy="0.1em" fontSize="11" fill="var(--ink)" fontFamily="ui-monospace, monospace">
                {text}
              </text>
            </g>
          );
        })}
        <line x1={x(0)} x2={x(0)} y1={0} y2={height} stroke="var(--axis)" />
      </svg>
      </div>
      <Tooltip tip={tip} />
    </Figure>
  );
}

export type BarRow = { label: string; base: number; run: number; baseText: string; runText: string; note?: string };

/** Base against simulation per group: two thin bars per row, the simulation in the series colour. */
export function CompareBars({ title, rows, onSelect, seriesLabel }: { title: string; rows: BarRow[]; onSelect?: (label: string) => void; seriesLabel?: [string, string] }) {
  const { tip, show, hide } = useTip();
  const [baseLabel, runLabel] = seriesLabel ?? [t("charts.base"), t("charts.simulated")];
  const [low, high] = extentWithZero(rows.flatMap((row) => [row.base, row.run]));
  const [box, width] = useWidth();
  const labelWidth = 170;
  const valueWidth = 100;
  const rowHeight = 30;
  const x = linear([low, high], [labelWidth, width - valueWidth]);
  const height = rows.length * rowHeight + 4;
  return (
    <Figure
      title={title}
      legend={[
        { label: baseLabel, color: "var(--series-base)" },
        { label: runLabel, color: "var(--series-1)" },
      ]}
      table={<DataTable head={[t("charts.group"), baseLabel, runLabel]} rows={rows.map((row) => [row.label, row.baseText, row.runText])} />}
    >
      <div ref={box}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="block max-w-full" role="img" aria-label={title}>
        {rows.map((row, index) => {
          const top = index * rowHeight + 2;
          const lines = [row.label, `${baseLabel}: ${row.baseText}`, `${runLabel}: ${row.runText}`, ...(row.note ? [row.note] : [])];
          return (
            <g
              key={`${row.label}-${index}`}
              tabIndex={0}
              role={onSelect ? "button" : undefined}
              aria-label={lines.join(". ")}
              onClick={() => onSelect?.(row.label)}
              onKeyDown={(event) => {
                if (onSelect && (event.key === "Enter" || event.key === " ")) onSelect(row.label);
              }}
              onMouseMove={(event) => show(event, lines)}
              onFocus={(event) => show(event, lines)}
              onMouseLeave={hide}
              onBlur={hide}
              className={onSelect ? "cursor-pointer" : undefined}
            >
              <rect x={0} y={top} width={width} height={rowHeight - 2} fill="transparent" />
              <text x={labelWidth - 8} y={top + rowHeight / 2} dy="0.1em" textAnchor="end" fontSize="11" fill="var(--ink)">
                {row.label.length > 26 ? `${row.label.slice(0, 25)}…` : row.label}
              </text>
              <rect className="chart-bar" x={x(Math.min(0, row.base))} y={top + 5} width={Math.max(1, Math.abs(x(row.base) - x(0)))} height={8} rx={3} fill="var(--series-base)" />
              <rect className="chart-bar" x={x(Math.min(0, row.run))} y={top + 15} width={Math.max(1, Math.abs(x(row.run) - x(0)))} height={8} rx={3} fill="var(--series-1)" />
              <text x={width - valueWidth + 6} y={top + rowHeight / 2} dy="0.1em" fontSize="11" fill="var(--ink)" fontFamily="ui-monospace, monospace">
                {row.runText}
              </text>
            </g>
          );
        })}
      </svg>
      </div>
      <Tooltip tip={tip} />
    </Figure>
  );
}

export type TornadoRow = { label: string; low: number; high: number; lowText: string; highText: string; lowValue: string; highValue: string };

/** Which variable moves the metric most: bars to each side of the base value, the widest swing on top. */
export function Tornado({ rows, baseText }: { rows: TornadoRow[]; baseText: string }) {
  const { tip, show, hide } = useTip();
  const extent = Math.max(1e-9, ...rows.flatMap((row) => [Math.abs(row.low), Math.abs(row.high)]));
  const [box, width] = useWidth();
  const labelWidth = 150;
  const rowHeight = 30;
  const x = linear([-extent, extent], [labelWidth + 40, width - 40]);
  const height = rows.length * rowHeight + 24;
  return (
    <Figure
      title={t("charts.tornadoTitle")}
      legend={[
        { label: t("charts.atLow"), color: "var(--fall)" },
        { label: t("charts.atHigh"), color: "var(--rise)" },
      ]}
      table={
        <DataTable
          head={[t("charts.variable"), t("charts.atLow"), t("charts.atHigh")]}
          rows={rows.map((row) => [row.label, `${row.lowValue}: ${row.lowText}`, `${row.highValue}: ${row.highText}`])}
        />
      }
    >
      <div ref={box}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="block max-w-full" role="img" aria-label={t("charts.tornadoAria", { base: baseText })}>
        <text x={x(0)} y={10} textAnchor="middle" fontSize="10" fill="var(--muted)">
          {t("charts.baseValue", { value: baseText })}
        </text>
        {rows.map((row, index) => {
          const top = index * rowHeight + 18;
          const lines = [row.label, `${t("charts.atLow")} (${row.lowValue}): ${row.lowText}`, `${t("charts.atHigh")} (${row.highValue}): ${row.highText}`];
          return (
            <g key={row.label} tabIndex={0} onMouseMove={(event) => show(event, lines)} onFocus={(event) => show(event, lines)} onMouseLeave={hide} onBlur={hide}>
              <text x={labelWidth} y={top + rowHeight / 2} dy="0.1em" textAnchor="end" fontSize="11" fill="var(--ink)">
                {row.label}
              </text>
              {[
                { value: row.low, color: "var(--fall)" },
                { value: row.high, color: "var(--rise)" },
              ].map((bar, position) => (
                <rect
                  key={position}
                  className="chart-bar"
                  x={Math.min(x(0), x(bar.value))}
                  y={top + 6}
                  width={Math.max(1, Math.abs(x(bar.value) - x(0)))}
                  height={rowHeight - 12}
                  rx={3}
                  fill={bar.color}
                  opacity={0.9}
                />
              ))}
            </g>
          );
        })}
        <line x1={x(0)} x2={x(0)} y1={14} y2={height} stroke="var(--axis)" />
      </svg>
      </div>
      <Tooltip tip={tip} />
    </Figure>
  );
}

export type BandRow = { label: string; p5: number; p25: number; p50: number; p75: number; p95: number; text: string };

/** Ranges of a simulated metric: p5 to p95 thin, p25 to p75 thick, the median as a tick. */
export function Bands({ title, rows, reference }: { title: string; rows: BandRow[]; reference?: { value: number; label: string } }) {
  const { tip, show, hide } = useTip();
  const values = rows.flatMap((row) => [row.p5, row.p95, ...(reference ? [reference.value] : [])]);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const pad = (high - low) * 0.05 || 1;
  const [box, width] = useWidth();
  const labelWidth = 150;
  const rowHeight = 30;
  const ticks = niceTicks(low - pad, high + pad, 4);
  const x = linear([ticks[0] ?? low, ticks[ticks.length - 1] ?? high], [labelWidth + 10, width - 20]);
  const height = rows.length * rowHeight + 30;
  return (
    <Figure
      title={title}
      table={<DataTable head={[t("charts.group"), "p5", "p25", "p50", "p75", "p95"]} rows={rows.map((row) => [row.label, row.p5.toFixed(2), row.p25.toFixed(2), row.p50.toFixed(2), row.p75.toFixed(2), row.p95.toFixed(2)])} />}
    >
      <div ref={box}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="block max-w-full" role="img" aria-label={title}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={x(tick)} x2={x(tick)} y1={0} y2={height - 18} stroke="var(--grid)" />
            <text x={x(tick)} y={height - 4} textAnchor="middle" fontSize="10" fill="var(--muted)">
              {tick.toLocaleString("es-CO")}
            </text>
          </g>
        ))}
        {reference && (
          <g>
            <line x1={x(reference.value)} x2={x(reference.value)} y1={0} y2={height - 18} stroke="var(--ink)" strokeDasharray="3 3" />
            <text x={x(reference.value) + 4} y={10} fontSize="10" fill="var(--ink)">
              {reference.label}
            </text>
          </g>
        )}
        {rows.map((row, index) => {
          const middle = index * rowHeight + 16 + rowHeight / 2;
          const lines = [row.label, row.text];
          return (
            <g key={row.label} tabIndex={0} onMouseMove={(event) => show(event, lines)} onFocus={(event) => show(event, lines)} onMouseLeave={hide} onBlur={hide}>
              <text x={labelWidth} y={middle} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--ink)">
                {row.label}
              </text>
              <line x1={x(row.p5)} x2={x(row.p95)} y1={middle} y2={middle} stroke="var(--series-1)" strokeWidth={2} />
              <rect x={x(row.p25)} y={middle - 6} width={Math.max(2, x(row.p75) - x(row.p25))} height={12} rx={3} fill="var(--series-1)" opacity={0.85} />
              <line x1={x(row.p50)} x2={x(row.p50)} y1={middle - 9} y2={middle + 9} stroke="var(--ink)" strokeWidth={2} />
            </g>
          );
        })}
      </svg>
      </div>
      <Tooltip tip={tip} />
    </Figure>
  );
}

/** A path of values towards a target (goal seek): each point a scenario priced, the target as a dashed line. */
export function Trail({ points, target, valueLabel, metricLabel }: { points: { value: number; metric: number }[]; target: number; valueLabel: string; metricLabel: string }) {
  const { tip, show, hide } = useTip();
  const [box, width] = useWidth();
  const height = 200;
  const pad = { top: 14, right: 16, bottom: 30, left: 50 };
  const metrics = [...points.map((point) => point.metric), target];
  const ticks = niceTicks(Math.min(...metrics), Math.max(...metrics), 4);
  const y = linear([ticks[0] ?? 0, ticks[ticks.length - 1] ?? 1], [height - pad.bottom, pad.top]);
  const x = linear([0, Math.max(1, points.length - 1)], [pad.left, width - pad.right]);
  const path = points.map((point, index) => `${index ? "L" : "M"}${x(index)},${y(point.metric)}`).join(" ");
  return (
    <Figure
      title={t("charts.trailTitle")}
      table={<DataTable head={["#", valueLabel, metricLabel]} rows={points.map((point, index) => [index + 1, point.value, point.metric])} />}
    >
      <div ref={box}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="block max-w-full" role="img" aria-label={t("charts.trailAria", { steps: points.length })}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} stroke="var(--grid)" />
            <text x={pad.left - 6} y={y(tick)} dy="0.32em" textAnchor="end" fontSize="10" fill="var(--muted)">
              {tick.toLocaleString("es-CO")}
            </text>
          </g>
        ))}
        <line x1={pad.left} x2={width - pad.right} y1={y(target)} y2={y(target)} stroke="var(--ink)" strokeDasharray="4 3" />
        <text x={width - pad.right} y={y(target) - 4} textAnchor="end" fontSize="10" fill="var(--ink)">
          {t("charts.target", { value: target.toLocaleString("es-CO") })}
        </text>
        <path d={path} fill="none" stroke="var(--series-1)" strokeWidth={2} />
        {points.map((point, index) => (
          <circle
            key={index}
            cx={x(index)}
            cy={y(point.metric)}
            r={5}
            fill="var(--series-1)"
            stroke="var(--surface)"
            strokeWidth={2}
            tabIndex={0}
            onMouseMove={(event) => show(event, [`${valueLabel}: ${point.value}`, `${metricLabel}: ${point.metric}`])}
            onFocus={(event) => show(event, [`${valueLabel}: ${point.value}`, `${metricLabel}: ${point.metric}`])}
            onMouseLeave={hide}
            onBlur={hide}
          />
        ))}
        <text x={(width + pad.left) / 2} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--muted)">
          {t("charts.iteration")}
        </text>
      </svg>
      </div>
      <Tooltip tip={tip} />
    </Figure>
  );
}
