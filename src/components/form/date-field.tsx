import { useEffect, useId, useMemo, useRef, useState } from "react";

import { t } from "../../i18n";
import { addDays, formatDate, parseDateInput, todayIso } from "../../lib/format";
import { NARROW, useMediaQuery } from "../../lib/media";
import { usePreferences, type DateFormat } from "../../lib/preferences";
import { buttonClass, iconButtonClass, inputClass } from "../controls";
import { Icon } from "../ui/icons";
import { PopoverPanel, usePopover } from "../ui/popover";
import { FieldFrame, errorText } from "./fields";
import { useFieldContext } from "./context";

// A date, typed or picked. The value is always "YYYY-MM-DD" (what the API speaks); what the person sees and types
// follows their date format (lib/preferences.ts), and the ISO form is accepted whatever the format. The calendar
// opens from the button or with Alt ↓; on a phone the native picker takes over.

const WEEK_DAYS = 7;

/** Monday 1 … Sunday 7, as the locale starts its week (Intl when it knows; Monday otherwise). */
function weekStart(locale: string): number {
  try {
    const info = (new Intl.Locale(locale) as unknown as { weekInfo?: { firstDay: number }; getWeekInfo?: () => { firstDay: number } });
    return info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay ?? 1;
  } catch {
    return 1;
  }
}

/** The month grid: arrows move a day or a week, PgUp/PgDn a month, Enter picks, «Hoy» jumps. */
export function Calendar({ value, onChange, min, max, locale, timeZone }: { value: string | null; onChange: (iso: string) => void; min?: string; max?: string; locale: string; timeZone: string }) {
  const today = todayIso(timeZone);
  const [cursor, setCursor] = useState(value ?? today);
  useEffect(() => {
    if (value) setCursor(value);
  }, [value]);
  const [year, month] = cursor.split("-").map(Number) as [number, number, number];
  const first = new Date(Date.UTC(year, month - 1, 1));
  const start = weekStart(locale);
  const monthName = useMemo(() => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(first), [locale, first]);
  const dayNames = useMemo(() => {
    const format = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
    return Array.from({ length: WEEK_DAYS }, (_, index) => format.format(new Date(Date.UTC(2024, 0, 1 + ((start - 1 + index) % 7)))).replace(".", ""));
  }, [locale, start]);
  const lead = (first.getUTCDay() - (start % 7) + 7) % 7;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = [...Array.from({ length: lead }, () => null), ...Array.from({ length: days }, (_, index) => `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`)];
  while (cells.length % WEEK_DAYS) cells.push(null);
  const grid = useRef<HTMLDivElement>(null);
  const allowed = (iso: string) => (!min || iso >= min) && (!max || iso <= max);
  const shiftMonth = (delta: number) => {
    const date = new Date(Date.UTC(year, month - 1 + delta, 1));
    setCursor(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`);
  };
  function keyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in moves) setCursor(addDays(cursor, moves[event.key]!));
    else if (event.key === "PageUp") shiftMonth(-1);
    else if (event.key === "PageDown") shiftMonth(1);
    else if (event.key === "Home") setCursor(`${cursor.slice(0, 8)}01`);
    else if (event.key === "End") setCursor(`${cursor.slice(0, 8)}${String(days).padStart(2, "0")}`);
    else if (event.key === "Enter" || event.key === " ") allowed(cursor) && onChange(cursor);
    else return;
    event.preventDefault();
    requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>("[data-cursor=true]")?.focus());
  }
  return (
    <div className="flex w-64 flex-col gap-2 select-none" onKeyDown={keyDown}>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => shiftMonth(-1)} aria-label={t("ui.previousMonth")} className={iconButtonClass}>
          <Icon name="chevronLeft" className="h-4 w-4" />
        </button>
        <span className="flex-1 text-center font-medium capitalize [font-family:var(--font-display)]">{monthName}</span>
        <button type="button" onClick={() => shiftMonth(1)} aria-label={t("ui.nextMonth")} className={iconButtonClass}>
          <Icon name="chevronRight" className="h-4 w-4" />
        </button>
      </div>
      <div ref={grid} role="grid" aria-label={monthName} className="grid grid-cols-7 gap-px text-center text-xs">
        {dayNames.map((name) => (
          <span key={name} role="columnheader" className="label py-1 normal-case tracking-normal">
            {name}
          </span>
        ))}
        {cells.map((iso, index) =>
          iso ? (
            <button
              key={iso}
              type="button"
              role="gridcell"
              tabIndex={iso === cursor ? 0 : -1}
              data-cursor={iso === cursor || undefined}
              aria-selected={iso === value}
              aria-current={iso === today ? "date" : undefined}
              disabled={!allowed(iso)}
              onClick={() => onChange(iso)}
              className={`num h-8 rounded-[var(--radius-sm)] hover:bg-[var(--row-hover)] disabled:opacity-30 ${iso === value ? "bg-[var(--accent)] font-semibold text-[var(--on-accent)] hover:bg-[var(--accent)]" : iso === today ? "font-semibold text-[var(--accent)] shadow-[inset_0_-2px_0_var(--accent)]" : ""}`}
            >
              {Number(iso.slice(8))}
            </button>
          ) : (
            <span key={`blank-${index}`} aria-hidden />
          ),
        )}
      </div>
      <div className="flex items-center justify-between border-t border-[var(--line)] pt-2">
        <button type="button" onClick={() => allowed(today) && onChange(today)} className={`${buttonClass} h-[var(--control-h-sm)] text-xs`}>
          {t("ui.today")}
        </button>
        <span className="text-xs text-[var(--muted)]">{formatDate(today)}</span>
      </div>
    </div>
  );
}

export type DateInputProps = {
  id?: string;
  value: string | null;
  onChange: (iso: string | null) => void;
  onBlur?: () => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  /** Marks the box as invalid (the field's own error). */
  invalid?: boolean;
  describedBy?: string;
  /** What the person typed that is not a date (so the field can say so). */
  onInvalidText?: (text: string | null) => void;
};

/** The box of a date: text in the person's format (ISO always accepted) plus the calendar button. */
export function DateInput({ id, value, onChange, onBlur, min, max, disabled, required, placeholder, className, invalid, describedBy, onInvalidText }: DateInputProps) {
  const { dateFormat, locale, timeZone } = usePreferences();
  const narrow = useMediaQuery(NARROW);
  const [text, setText] = useState(() => (value ? formatDate(value, { dateFormat }) : ""));
  const [editing, setEditing] = useState(false);
  const { open, setOpen, box } = usePopover();
  // What is shown follows the value and the format while the person is not typing.
  useEffect(() => {
    if (!editing) setText(value ? formatDate(value, { dateFormat }) : "");
  }, [value, dateFormat, editing]);
  if (narrow) {
    return <input id={id} type="date" value={value ?? ""} min={min} max={max} disabled={disabled} aria-required={required || undefined} aria-invalid={invalid || undefined} aria-describedby={describedBy} onChange={(event) => onChange(event.target.value || null)} onBlur={onBlur} className={`${inputClass} ${className ?? "w-full"} ${invalid ? "border-[var(--bad)]" : ""}`} />;
  }
  function commit(raw: string) {
    const clean = raw.trim();
    if (!clean) {
      onChange(null);
      onInvalidText?.(null);
      return;
    }
    const iso = parseDateInput(clean, dateFormat);
    if (iso) {
      onChange(iso);
      onInvalidText?.(null);
    } else onInvalidText?.(clean);
  }
  return (
    <div ref={box} className={`relative flex items-center ${className ?? "w-full"}`}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={text}
        placeholder={placeholder ?? dateFormat}
        disabled={disabled}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onFocus={() => setEditing(true)}
        onChange={(event) => {
          setText(event.target.value);
          const iso = parseDateInput(event.target.value, dateFormat);
          if (iso) {
            onChange(iso);
            onInvalidText?.(null);
          }
        }}
        onBlur={() => {
          setEditing(false);
          commit(text);
          onBlur?.();
        }}
        onKeyDown={(event) => {
          if (event.altKey && event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          } else if (event.key === "Enter") {
            commit(text);
          }
        }}
        className={`${inputClass} num w-full pr-8 ${invalid ? "border-[var(--bad)]" : ""}`}
      />
      <button type="button" tabIndex={-1} disabled={disabled} aria-label={t("ui.calendar")} aria-expanded={open} onClick={() => setOpen(!open)} className={`${iconButtonClass} absolute right-0.5 h-[calc(var(--control-h)-4px)] w-7`}>
        <Icon name="calendarDays" className="h-4 w-4" />
      </button>
      {open && (
        <PopoverPanel label={t("ui.calendar")} align="right" className="w-auto p-3">
          <Calendar
            value={value}
            min={min}
            max={max}
            locale={locale}
            timeZone={timeZone}
            onChange={(iso) => {
              onChange(iso);
              onInvalidText?.(null);
              setText(formatDate(iso, { dateFormat }));
              setOpen(false);
            }}
          />
        </PopoverPanel>
      )}
    </div>
  );
}

type Common = { label: string; help?: string; required?: boolean; disabled?: boolean; wide?: boolean; className?: string };

/** A TanStack field whose value is "YYYY-MM-DD" or "" (never a Date): `form.AppField name="valid_from" children={(f) => <f.DateField label="Desde" />}`. */
export function DateField({ min, max, placeholder, ...common }: Common & { min?: string; max?: string; placeholder?: string }) {
  const field = useFieldContext<string>();
  const id = useId();
  const [badText, setBadText] = useState<string | null>(null);
  const { dateFormat } = usePreferences();
  const touched = field.state.meta.isTouched || field.form.state.isSubmitted;
  const error = badText ? t("ui.invalidDate", { format: dateFormat }) : touched ? errorText(field.state.meta.errors) : null;
  return (
    <FieldFrame id={id} error={error} {...common}>
      <DateInput
        id={id}
        value={field.state.value || null}
        min={min}
        max={max}
        placeholder={placeholder}
        disabled={common.disabled}
        required={common.required}
        invalid={Boolean(error)}
        describedBy={error ? `${id}-error` : undefined}
        className={common.className}
        onInvalidText={setBadText}
        onChange={(iso) => {
          field.handleChange(iso ?? "");
          if (field.state.meta.errorMap.onServer) field.setErrorMap({ onServer: undefined } as never);
        }}
        onBlur={field.handleBlur}
      />
    </FieldFrame>
  );
}

/** A month, "YYYY-MM": the native picker where it exists (every evergreen browser), a text box otherwise. */
export function MonthField({ min, max, ...common }: Common & { min?: string; max?: string }) {
  const field = useFieldContext<string>();
  const id = useId();
  const touched = field.state.meta.isTouched || field.form.state.isSubmitted;
  const error = touched ? errorText(field.state.meta.errors) : null;
  return (
    <FieldFrame id={id} error={error} {...common}>
      <input id={id} type="month" value={field.state.value ?? ""} min={min} max={max} disabled={common.disabled} aria-required={common.required || undefined} aria-invalid={error ? true : undefined} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} className={`${inputClass} num ${common.className ?? "w-full"} ${error ? "border-[var(--bad)]" : ""}`} />
    </FieldFrame>
  );
}

export type { DateFormat };
