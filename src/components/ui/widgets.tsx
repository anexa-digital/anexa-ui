import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { t } from "../../i18n";
import { errorMessage } from "../../lib/errors";
import { formatDecimal } from "../../lib/format";
import { buttonClass, inputClass } from "../controls";
import { Icon } from "./icons";

/** How far a task got: a smooth bar, never a spinner without end. Indeterminate while nothing is known yet. */
export function ProgressBar({ percent, label, tone = "accent" }: { percent: number | null; label: string; tone?: "accent" | "ok" | "bad" | "muted" }) {
  const color = { accent: "bg-[var(--accent)]", ok: "bg-[var(--ok)]", bad: "bg-[var(--bad)]", muted: "bg-[var(--muted)]" }[tone];
  const known = percent !== null && Number.isFinite(percent);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={known ? Math.round(percent) : undefined}
      className="relative h-2 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[var(--line)]"
    >
      {known ? (
        <div className={`progress-fill h-full rounded-[var(--radius-pill)] ${color}`} style={{ width: `${Math.max(2, Math.min(100, percent))}%` }} />
      ) : (
        <div className={`progress-wait h-full w-1/3 rounded-[var(--radius-pill)] ${color}`} />
      )}
    </div>
  );
}

/** Numbered steps of a wizard; the ones already reached can be clicked. */
export function Stepper({ steps, current, reached, onSelect }: { steps: string[]; current: number; reached: number; onSelect: (step: number) => void }) {
  return (
    <ol aria-label={t("ui.steps")} className="flex flex-wrap items-center gap-1">
      {steps.map((label, index) => {
        const state = index === current ? "current" : index <= reached ? "reached" : "ahead";
        return (
          <li key={label} className="flex items-center gap-1">
            <button
              type="button"
              disabled={state === "ahead"}
              aria-current={state === "current" ? "step" : undefined}
              onClick={() => onSelect(index)}
              className={`flex h-[var(--control-h)] items-center gap-2 rounded-[var(--radius-pill)] px-3 ${
                state === "current"
                  ? "bg-[var(--accent)] text-[var(--on-accent)]"
                  : state === "reached"
                    ? "bg-[var(--accent-soft)] text-[var(--ink)]"
                    : "text-[var(--muted)]"
              }`}
            >
              <span className="num text-xs">{index + 1}</span>
              {label}
            </button>
            {index < steps.length - 1 && <span aria-hidden className="h-px w-4 bg-[var(--line)]" />}
          </li>
        );
      })}
    </ol>
  );
}

export function Chip({ children, onRemove, removeLabel, tone = "filter" }: { children: ReactNode; onRemove?: () => void; removeLabel?: string; /** `filter`: a bordered chip on the raised ground (what a list keeps); `value`: a chosen value in the accent's soft tint. */ tone?: "filter" | "value" }) {
  const look = tone === "filter" ? "rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--raised)]" : "rounded-[var(--radius-pill)] bg-[var(--accent-soft)]";
  return (
    <span className={`inline-flex h-[var(--control-h-sm)] items-center gap-1 pl-2 pr-1 text-xs ${look}`}>
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={removeLabel ?? t("ui.remove")} className="flex h-5 w-5 items-center justify-center rounded-[var(--radius-pill)] text-[var(--muted)] hover:text-[var(--ink)]">
          <Icon name="close" className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

export type ComboOption = { value: string; hint?: string };

/** Pick one or more values from a list that may be long: type to narrow it, arrows and Enter to choose. */
export function ComboBox({
  label,
  options,
  selected,
  onChange,
  onSearch,
  placeholder,
  single,
}: {
  label: string;
  options: ComboOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  onSearch?: (text: string) => void;
  placeholder?: string;
  single?: boolean;
}) {
  const id = useId();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const shown = options.filter((option) => !selected.includes(option.value) && option.value.toLowerCase().includes(text.toLowerCase())).slice(0, 50);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  function choose(value: string) {
    onChange(single ? [value] : [...selected, value]);
    setText("");
    setActive(0);
    if (single) setOpen(false);
  }
  return (
    <div ref={box} className="relative flex flex-col gap-1">
      <label htmlFor={id} className="label">
        {label}
      </label>
      {!single && selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((value) => (
            <Chip key={value} tone="value" onRemove={() => onChange(selected.filter((item) => item !== value))} removeLabel={t("ui.removeValue", { value })}>
              {value}
            </Chip>
          ))}
        </div>
      )}
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        value={single && !open ? (selected[0] ?? "") : text}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setText(event.target.value);
          setOpen(true);
          setActive(0);
          onSearch?.(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((value) => Math.min(value + 1, shown.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((value) => Math.max(value - 1, 0));
          } else if (event.key === "Enter" && open && shown[active]) {
            event.preventDefault();
            choose(shown[active].value);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className={inputClass}
      />
      {open && shown.length > 0 && (
        <ul id={`${id}-list`} role="listbox" aria-label={label} className="absolute top-full z-20 mt-1 max-h-64 w-full overflow-auto rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--raised)] py-1 shadow-[var(--shadow)]">
          {shown.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(option.value);
              }}
              onMouseEnter={() => setActive(index)}
              className={`flex cursor-pointer items-center gap-2 px-2 py-1 ${index === active ? "bg-[var(--accent-soft)]" : ""}`}
            >
              <span className="truncate">{option.value}</span>
              {option.hint && <span className="ml-auto shrink-0 text-xs text-[var(--muted)]">{option.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A percentage with a slider and an exact box: the box is the value (text, never a float). */
export function PercentInput({ label, value, onChange, min = -50, max = 50 }: { label: string; value: string; onChange: (value: string) => void; min?: number; max?: number }) {
  const id = useId();
  const number = Number(value.replace(",", "."));
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          aria-label={t("ui.slider", { label })}
          min={min}
          max={max}
          step={0.5}
          value={Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : 0}
          onChange={(event) => onChange(event.target.value)}
          className="w-40 accent-[var(--accent)]"
        />
        <input id={id} inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} w-24 text-right`} />
        <span className="text-[var(--muted)]">%</span>
      </div>
    </div>
  );
}

/** A big number with what it was before: the first thing a result says. */
export function Stat({
  label,
  value,
  before,
  delta,
  tone,
  digits = 2,
  suffix,
  beforeLabel,
  hint,
}: {
  label: string;
  value: string | null;
  before?: string | null;
  beforeLabel?: "before" | "target";
  hint?: string;
  delta?: string | null;
  tone?: "up-good" | "up-bad" | "neutral";
  digits?: number;
  suffix?: string;
}) {
  const change = delta === undefined || delta === null ? null : Number(delta);
  const color =
    change === null || change === 0 || tone === "neutral"
      ? "text-[var(--muted)]"
      : (change > 0) === (tone !== "up-bad")
        ? "text-[var(--ok)]"
        : "text-[var(--bad)]";
  return (
    <div className="flex min-w-40 flex-1 flex-col gap-1 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-3">
      <span className="label">{label}</span>
      <span className="stat-in num text-2xl font-semibold [font-family:var(--font-display)]">
        {value === null ? "—" : formatDecimal(value, digits)}
        {suffix && value !== null ? <span className="text-base font-normal text-[var(--muted)]"> {suffix}</span> : null}
      </span>
      {(before !== undefined || change !== null) && (
        <span className="flex flex-wrap items-baseline gap-2 text-sm">
          {before !== undefined && (
            <span className="text-[var(--muted)]">
              {t(beforeLabel === "target" ? "ui.target" : "ui.before", { value: before === null ? "—" : formatDecimal(before, digits) })}
            </span>
          )}
          {change !== null && delta !== null && delta !== undefined && (
            <span className={`font-medium ${color}`}>
              {change > 0 ? "▲" : change < 0 ? "▼" : "="} {formatDecimal(delta.replace("-", ""), digits)}
            </span>
          )}
        </span>
      )}
      {hint && <span className="text-sm text-[var(--muted)]">{hint}</span>}
    </div>
  );
}

/** What a list, a panel or a search says when there is nothing to show: what this is, why it is empty and how to
 * start (an action), never a bare «No hay datos». */
export type Empty = { title: string; body?: string; action?: ReactNode };

export function EmptyState({ title, body, action }: Empty) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--line)] p-8 text-center">
      <p className="font-medium">{title}</p>
      {body && <p className="prose-narrow text-[var(--muted)]">{body}</p>}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

/** A grid while its rows load: the header's ground and a few skeleton rows, the height of real ones. */
export function GridSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div aria-busy aria-label={t("grid.loading")} className="flex flex-col">
      <div className="h-[var(--control-h)] border-b border-[var(--line-strong)] bg-[var(--head)]" />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex h-[var(--row-h)] items-center gap-4 border-b border-[var(--line)] px-2.5">
          <span className="skeleton h-3 w-20 rounded-[var(--radius-sm)]" />
          <span className="skeleton h-3 flex-1 rounded-[var(--radius-sm)]" style={{ maxWidth: `${55 - (index % 4) * 8}%` }} />
          <span className="skeleton h-3 w-16 rounded-[var(--radius-sm)]" />
        </div>
      ))}
    </div>
  );
}

/** A list that could not load: what happened and the way to try again, in the list's own card. */
export function LoadError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 p-8 text-center">
      <p className="font-medium text-[var(--bad)]">{t("grid.loadFailed")}</p>
      <p className="prose-narrow text-[var(--muted)]">{errorMessage(error)}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`${buttonClass} mt-1 flex items-center gap-1.5`}>
          <Icon name="refresh" className="h-4 w-4" />
          {t("ui.retry")}
        </button>
      )}
    </div>
  );
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-hidden className="flex flex-col gap-2">
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className="skeleton h-4 rounded-[var(--radius-sm)]" style={{ width: `${90 - index * 12}%` }} />
      ))}
    </div>
  );
}

/** Seconds as words: "1 min 20 s", "40 s". */
export function duration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return "—";
  const whole = Math.max(0, Math.round(seconds));
  if (whole < 60) return t("ui.seconds", { seconds: whole });
  const minutes = Math.floor(whole / 60);
  if (minutes < 60) return t("ui.minutes", { minutes, seconds: whole % 60 });
  return t("ui.hours", { hours: Math.floor(minutes / 60), minutes: minutes % 60 });
}
