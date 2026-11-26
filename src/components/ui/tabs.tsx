import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";

// Tabs of every screen look the same: a bar with a visible base line and the chosen tab underlined in the accent.
// Each screen keeps its own elements (a Link when the tab lives in the URL, a button otherwise).
export const tabBarClass = "flex flex-wrap gap-0.5 border-b border-[var(--line-strong)]";

export const tabClass = (active: boolean) =>
  `-mb-px h-[var(--control-h)] border-b-2 px-3 whitespace-nowrap ${active ? "border-[var(--accent)] font-medium text-[var(--ink)]" : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"}`;

export type TabItem<Id extends string = string> = {
  id: Id;
  label: ReactNode;
  /** Beside the label: a count, a light. A number or a text is drawn as a quiet figure. */
  badge?: ReactNode;
  disabled?: boolean;
};

export type TabKey = "ArrowLeft" | "ArrowRight" | "Home" | "End";

/**
 * The tab a key leads to from `current`, or null when there is nowhere else to go. Left and Right wrap around the
 * ends, Home and End go to the first and last; a disabled tab is never a stop.
 */
export function nextTab<Id extends string>(items: readonly TabItem<Id>[], current: Id, key: TabKey): Id | null {
  const open = items.filter((item) => !item.disabled);
  if (open.length === 0) return null;
  let target: TabItem<Id> | undefined;
  if (key === "Home") target = open[0];
  else if (key === "End") target = open.at(-1);
  else {
    // Walk from where the tab stands in the bar, so a disabled (or unknown) current tab still has neighbours.
    const from = items.findIndex((item) => item.id === current);
    const step = key === "ArrowRight" ? 1 : -1;
    const start = from < 0 ? (step > 0 ? -1 : 0) : from;
    for (let offset = 1; offset <= items.length && !target; offset += 1) {
      const item = items[(((start + step * offset) % items.length) + items.length) % items.length];
      if (item && !item.disabled) target = item;
    }
  }
  return target && target.id !== current ? target.id : null;
}

const KEYS: readonly string[] = ["ArrowLeft", "ArrowRight", "Home", "End"] satisfies TabKey[];

/**
 * Tabs whose content changes in place. The screen owns the chosen tab (`value` / `onChange`), so it can live in the
 * URL. Arrows move along the bar and choose as they go; Tab leaves the bar for the panel. `children` is the content
 * of the chosen tab, or a function of its id; without children only the bar is drawn and the screen places its own
 * content. For a tab that is a link, keep `tabBarClass` / `tabClass` on a `Link`.
 */
export function Tabs<Id extends string = string>({
  items,
  value,
  onChange,
  label,
  children,
  className = "",
  panelClassName = "",
}: {
  items: readonly TabItem<Id>[];
  value: Id;
  onChange: (id: Id) => void;
  /** Names the bar for readers («Secciones del registro»). */
  label: string;
  children?: ReactNode | ((id: Id) => ReactNode);
  className?: string;
  panelClassName?: string;
}) {
  const base = useId();
  const bar = useRef<HTMLDivElement>(null);
  const chosen = items.findIndex((item) => item.id === value);
  // One stop in the Tab order: the chosen tab, or the first that can be chosen when the value names none.
  const stop = chosen >= 0 && !items[chosen]?.disabled ? chosen : items.findIndex((item) => !item.disabled);
  const content = typeof children === "function" ? children(value) : children;
  const hasPanel = content !== undefined && content !== null && content !== false && chosen >= 0;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, from: Id) => {
    if (event.altKey || event.ctrlKey || event.metaKey || !KEYS.includes(event.key)) return;
    event.preventDefault();
    const next = nextTab(items, from, event.key as TabKey);
    if (next === null) return;
    const index = items.findIndex((item) => item.id === next);
    bar.current?.querySelector<HTMLElement>(`[data-tab-index="${index}"]`)?.focus();
    onChange(next);
  };

  return (
    <div className={`flex min-w-0 flex-col gap-3 ${className}`}>
      <div ref={bar} role="tablist" aria-label={label} className={tabBarClass}>
        {items.map((item, index) => {
          const active = index === chosen;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${base}-tab-${index}`}
              data-tab-index={index}
              aria-selected={active}
              aria-controls={active && hasPanel ? `${base}-panel` : undefined}
              tabIndex={index === stop ? 0 : -1}
              disabled={item.disabled}
              onClick={() => !active && onChange(item.id)}
              onKeyDown={(event) => onKeyDown(event, item.id)}
              className={`${tabClass(active)} inline-flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {item.label}
              {typeof item.badge === "number" || typeof item.badge === "string" ? <span className="num text-xs text-[var(--muted)]">{item.badge}</span> : item.badge}
            </button>
          );
        })}
      </div>
      {hasPanel && (
        <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${chosen}`} tabIndex={0} className={`min-w-0 ${panelClassName}`}>
          {content}
        </div>
      )}
    </div>
  );
}
