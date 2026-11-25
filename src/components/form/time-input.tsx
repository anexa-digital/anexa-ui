import { t } from "../../i18n";
import { timeInputClass } from "../controls";

// A clock: the browser's own time field (it writes 12 or 24 hours as the person's system says), at a width that
// fits its longest text. The value is always `HH:MM` in 24 hours, or "" when empty.

export type TimeInputProps = {
  id?: string;
  value: string;
  onChange: (time: string) => void;
  onBlur?: () => void;
  /** Minutes between the clock's steps (5 → 08:00, 08:05…). */
  step?: number;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  /** Its name when no `<label>` points at it («Hora» by default). */
  ariaLabel?: string;
  className?: string;
};

export function TimeInput({ id, value, onChange, onBlur, step = 5, min, max, disabled, required, invalid, describedBy, ariaLabel, className = "" }: TimeInputProps) {
  return (
    <input
      id={id}
      type="time"
      aria-label={id ? ariaLabel : (ariaLabel ?? t("ui.time"))}
      step={step * 60}
      min={min}
      max={max}
      value={value}
      disabled={disabled}
      aria-required={required || undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onChange={(event) => onChange(event.target.value.slice(0, 5))}
      onBlur={onBlur}
      className={`${timeInputClass} ${invalid ? "border-[var(--bad)]" : ""} ${className}`}
    />
  );
}
