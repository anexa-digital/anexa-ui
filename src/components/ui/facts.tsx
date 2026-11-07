import type { ReactNode } from "react";

// The facts of a record on its detail screen: a caption at the left, the value at the right, one per line. A `<dl>`,
// so readers announce each caption with its value. An empty value shows «—» instead of a hole.

export type Fact = {
  label: string;
  value: ReactNode;
  /** Figures that line up (money, counts): the figures' face, tabular. */
  num?: boolean;
  /** A long code or identifier (a hash, a fiscal code): the figures' face, and it breaks anywhere instead of overflowing. */
  mono?: boolean;
  /** Spans both columns of a two-column list. */
  wide?: boolean;
};

const blank = (value: ReactNode) => value === null || value === undefined || value === "" || value === false;

export function Facts({ items, columns = 1, className = "" }: { items: Fact[]; /** Two columns from the tablet up. */ columns?: 1 | 2; className?: string }) {
  return (
    <dl className={`grid ${columns === 2 ? "md:grid-cols-2 md:gap-x-6" : ""} ${className}`}>
      {items.map((item) => (
        <div key={item.label} className={`flex items-baseline justify-between gap-6 border-b border-[var(--line)] py-1 ${item.wide ? "md:col-span-2" : ""}`}>
          <dt className="shrink-0 text-[var(--muted)]">{item.label}</dt>
          <dd className={`min-w-0 text-right ${item.num ? "num" : ""} ${item.mono ? "num wrap-anywhere text-xs" : ""}`}>{blank(item.value) ? <span className="text-[var(--muted)]">—</span> : item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
