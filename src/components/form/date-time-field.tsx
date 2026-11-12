import { useEffect, useId, useState } from "react";

import { t } from "../../i18n";
import { usePreferences } from "../../lib/preferences";
import { civilFromInstant, instantFromCivil } from "../../lib/zoned";
import { inputClass } from "../controls";
import { DateInput } from "./date-field";
import { FieldFrame, errorText } from "./fields";
import { useFieldContext } from "./context";

// An instant: a date (the kit's DateInput) and a clock, read in a time zone. The value is an ISO instant in UTC
// (what the API stores) or null; what the person sees is the civil date and clock of `timeZone`, the person's own
// by default. When the zone is not theirs, the hint names it, so «08:30» is never ambiguous.

export type DateTimeInputProps = {
  id?: string;
  value: string | null;
  onChange: (iso: string | null) => void;
  onBlur?: () => void;
  /** IANA zone the clock is read in (an appointment in the participant's zone); the person's by default. */
  timeZone?: string;
  /** Minutes between the clock's steps (5 → 08:00, 08:05…). */
  step?: number;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
};

/** The pair of boxes of an instant: date and clock in one zone. */
export function DateTimeInput({ id, value, onChange, onBlur, timeZone, step = 5, min, max, disabled, required, invalid, describedBy, className }: DateTimeInputProps) {
  const preferences = usePreferences();
  const zone = timeZone ?? preferences.timeZone;
  const civil = civilFromInstant(value, zone);
  const [date, setDate] = useState<string | null>(civil?.date ?? null);
  const [time, setTime] = useState<string>(civil?.time ?? "");
  // Follow the value (and the zone) when it changes from outside.
  useEffect(() => {
    const next = civilFromInstant(value, zone);
    setDate(next?.date ?? null);
    setTime(next?.time ?? "");
  }, [value, zone]);
  const minDate = civilFromInstant(min, zone)?.date;
  const maxDate = civilFromInstant(max, zone)?.date;
  function emit(nextDate: string | null, nextTime: string) {
    if (!nextDate && !nextTime) return onChange(null);
    if (!nextDate || !/^\d{2}:\d{2}$/.test(nextTime)) return;
    onChange(instantFromCivil(nextDate, nextTime, zone));
  }
  return (
    <div className={`flex items-center gap-2 ${className ?? "w-full"}`}>
      <DateInput
        id={id}
        value={date}
        min={minDate}
        max={maxDate}
        disabled={disabled}
        required={required}
        invalid={invalid}
        describedBy={describedBy}
        className="min-w-0 flex-1"
        onChange={(next) => {
          setDate(next);
          emit(next, time);
        }}
        onBlur={onBlur}
      />
      <input
        type="time"
        aria-label={t("ui.time")}
        step={step * 60}
        value={time}
        disabled={disabled}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(event) => {
          setTime(event.target.value);
          emit(date, event.target.value);
        }}
        onBlur={onBlur}
        className={`${inputClass} num w-28 ${invalid ? "border-[var(--bad)]" : ""}`}
      />
    </div>
  );
}

type Common = { label: string; help?: string; required?: boolean; disabled?: boolean; wide?: boolean; className?: string };

/** A TanStack field whose value is an ISO instant or "": `<f.DateTimeField label="Cita" timeZone={zone} />`. */
export function DateTimeField({ timeZone, step, min, max, help, ...common }: Common & { timeZone?: string; step?: number; min?: string; max?: string }) {
  const field = useFieldContext<string>();
  const id = useId();
  const preferences = usePreferences();
  const zone = timeZone ?? preferences.timeZone;
  const touched = field.state.meta.isTouched || field.form.state.isSubmitted;
  const error = touched ? errorText(field.state.meta.errors) : null;
  const zoneHint = zone !== preferences.timeZone ? t("ui.inTimeZone", { zone: zone.replace(/_/g, " ") }) : undefined;
  return (
    <FieldFrame id={id} error={error} help={[help, zoneHint].filter(Boolean).join(" · ") || undefined} {...common}>
      <DateTimeInput
        id={id}
        value={field.state.value || null}
        timeZone={zone}
        step={step}
        min={min}
        max={max}
        disabled={common.disabled}
        required={common.required}
        invalid={Boolean(error)}
        describedBy={error ? `${id}-error` : undefined}
        className={common.className}
        onChange={(iso) => {
          field.handleChange(iso ?? "");
          if (field.state.meta.errorMap.onServer) field.setErrorMap({ onServer: undefined } as never);
        }}
        onBlur={field.handleBlur}
      />
    </FieldFrame>
  );
}
