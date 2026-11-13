import { useId, type ReactNode } from "react";

import { t } from "../../i18n";
import type { Editor } from "../../lib/schema";
import { inputClass, selectClass } from "../controls";
import { ComboBox, PercentInput, type ComboOption } from "../ui/widgets";
import { TokenEditor, type TokenGroup, type TokenOption } from "../ui/token-editor";
import { ValueInput } from "../ui/value-input";
import { useFieldContext } from "./context";

// The fields of a kit form: each one is a TanStack field bound to the kit's controls, with its caption, help, the
// errors of its validators and the error the server named for it. Used through form.AppField (see form.tsx).

/** The errors of a field as one text: validators may return strings or objects with a message. */
export function errorText(errors: unknown[]): string | null {
  const texts = errors.filter((error) => error !== undefined && error !== null && error !== false).map((error) => (typeof error === "string" ? error : typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message) : String(error)));
  return texts.length ? texts.join(" ") : null;
}

/** What every field takes: its caption and help, whether it is required or disabled, whether it spans two columns of
 * a grid, and extra classes for the control itself (a width, `num` for figures). */
type Common = { label: string; help?: string; required?: boolean; disabled?: boolean; wide?: boolean; className?: string };

/** The frame of a field: caption (with the required mark), the control, help and error. */
export function FieldFrame({ id, label, help, required, error, wide, children }: Common & { id: string; error: string | null; children: ReactNode }) {
  return (
    <div className={`flex flex-col gap-1 ${wide ? "md:col-span-2" : ""}`}>
      <label htmlFor={id} data-required={required || undefined} className="label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-[var(--bad)]">
          {error}
        </p>
      ) : help ? (
        <p id={`${id}-help`} className="text-xs text-[var(--muted)]">
          {help}
        </p>
      ) : null}
    </div>
  );
}

function useFrame<T>() {
  const field = useFieldContext<T>();
  const id = useId();
  const touched = field.state.meta.isTouched || field.form.state.isSubmitted;
  const error = touched ? errorText(field.state.meta.errors) : null;
  const change = (value: T) => {
    field.handleChange(value);
    if (field.state.meta.errorMap.onServer) field.setErrorMap({ onServer: undefined } as never);
  };
  const aria = { "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${id}-error` : undefined };
  return { field, id, error, change, aria };
}

const fieldInput = (error: string | null, className?: string) => `${inputClass} ${className ?? "w-full"} ${error ? "border-[var(--bad)]" : ""}`;

type TextProps = {
  type?: "text" | "email" | "url" | "password" | "date" | "month" | "search" | "tel";
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  inputMode?: "text" | "decimal" | "numeric" | "email" | "url" | "search" | "tel";
  /** Applied to what is typed before it is kept: upper case for a code, a comma turned into a point. */
  transform?: (value: string) => string;
  title?: string;
};

export function TextField({ type = "text", placeholder, autoComplete, maxLength, inputMode, transform, title, ...common }: Common & TextProps) {
  const { field, id, error, change, aria } = useFrame<string>();
  return (
    <FieldFrame id={id} error={error} {...common}>
      <input
        id={id}
        type={type}
        value={field.state.value ?? ""}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        inputMode={inputMode}
        title={title}
        disabled={common.disabled}
        aria-required={common.required || undefined}
        onBlur={field.handleBlur}
        onChange={(event) => change(transform ? transform(event.target.value) : event.target.value)}
        className={fieldInput(error, common.className)}
        {...aria}
      />
    </FieldFrame>
  );
}

export function TextareaField({ rows = 3, placeholder, maxLength, ...common }: Common & { rows?: number; placeholder?: string; maxLength?: number }) {
  const { field, id, error, change, aria } = useFrame<string>();
  return (
    <FieldFrame id={id} error={error} {...common}>
      <textarea id={id} rows={rows} value={field.state.value ?? ""} placeholder={placeholder} maxLength={maxLength} disabled={common.disabled} aria-required={common.required || undefined} onBlur={field.handleBlur} onChange={(event) => change(event.target.value)} className={`${fieldInput(error, common.className)} h-auto py-1`} {...aria} />
    </FieldFrame>
  );
}

/** Free text with tags inserted from lists at the caret (see TokenEditor): the value keeps each tag as its token. */
export function TokenField({ groups, rows = 6, placeholder, extra, ...common }: Common & { groups: TokenGroup[]; rows?: number; placeholder?: string; extra?: TokenOption[] }) {
  const { field, id, error, change, aria } = useFrame<string>();
  return (
    <FieldFrame id={id} error={error} {...common}>
      <TokenEditor id={id} label={common.label} value={field.state.value ?? ""} onChange={change} onBlur={field.handleBlur} groups={groups} rows={rows} placeholder={placeholder} extra={extra} disabled={common.disabled} invalid={Boolean(error)} describedBy={aria["aria-describedby"]} />
    </FieldFrame>
  );
}

/** A number kept as text (decimals travel as strings, never as floats); `unit` shows after the box. With
 * `decimal` the box is plain text with a decimal keyboard (a comma is kept as typed) instead of a number input. */
export function NumberField({ unit, min, max, step = "any", placeholder, decimal, ...common }: Common & { unit?: string; min?: number; max?: number; step?: number | "any"; placeholder?: string; decimal?: boolean }) {
  const { field, id, error, change, aria } = useFrame<string>();
  return (
    <FieldFrame id={id} error={error} {...common}>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type={decimal ? "text" : "number"}
          inputMode="decimal"
          min={min}
          max={max}
          step={decimal ? undefined : step}
          placeholder={placeholder}
          value={field.state.value ?? ""}
          disabled={common.disabled}
          aria-required={common.required || undefined}
          onBlur={field.handleBlur}
          onChange={(event) => change(event.target.value)}
          className={`${fieldInput(error, common.className)} num text-right`}
          {...aria}
        />
        {unit && <span className="shrink-0 text-[var(--muted)]">{unit}</span>}
      </div>
    </FieldFrame>
  );
}

export type SelectOption = { value: string; label: string; disabled?: boolean; /** A line under the label (radios and checkboxes only): what choosing it means. */ help?: string };

/** A radio or a checkbox with its label; its help (when it has one) sits under it, outside the label, so readers
 * announce it as the description and the option keeps its short name. */
function Option({ option, children }: { option: SelectOption; children: (describedBy: string | undefined) => ReactNode }) {
  const help = useId();
  if (!option.help) return <label className="flex min-h-[var(--control-h)] items-center gap-1.5">{children(undefined)}{option.label}</label>;
  return (
    <span className="flex flex-col py-1">
      <label className="flex items-center gap-1.5">
        {children(help)}
        {option.label}
      </label>
      <span id={help} className="pl-5 text-xs text-[var(--muted)]">
        {option.help}
      </span>
    </span>
  );
}

export function SelectField({ options, empty, ...common }: Common & { options: SelectOption[]; empty?: string }) {
  const { field, id, error, change, aria } = useFrame<string>();
  return (
    <FieldFrame id={id} error={error} {...common}>
      <select id={id} value={field.state.value ?? ""} disabled={common.disabled} aria-required={common.required || undefined} onBlur={field.handleBlur} onChange={(event) => change(event.target.value)} className={`${selectClass} ${common.className ?? "w-full"} ${error ? "border-[var(--bad)]" : ""}`} {...aria}>
        {empty !== undefined && <option value="">{empty}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}

/** One of a few values, each a radio button in a row (or a column with `column`). */
export function RadioField({ options, column, ...common }: Common & { options: SelectOption[]; column?: boolean }) {
  const { field, id, error, change } = useFrame<string>();
  return (
    <div role="radiogroup" aria-labelledby={`${id}-label`} className={`flex flex-col gap-1 ${common.wide ? "md:col-span-2" : ""}`}>
      <span id={`${id}-label`} className="label">
        {common.label}
      </span>
      <div className={`flex gap-3 ${column ? "flex-col gap-1" : "flex-wrap"}`}>
        {options.map((option) => (
          <Option key={option.value} option={option}>
            {(describedBy) => <input type="radio" name={id} value={option.value} checked={field.state.value === option.value} disabled={common.disabled || option.disabled} aria-describedby={describedBy} onBlur={field.handleBlur} onChange={() => change(option.value)} />}
          </Option>
        ))}
      </div>
      {error ? <p role="alert" className="text-xs text-[var(--bad)]">{error}</p> : common.help ? <p className="text-xs text-[var(--muted)]">{common.help}</p> : null}
    </div>
  );
}

/** Several of many values, each a checkbox (the value is the list of the chosen ones). */
export function CheckboxesField({ options, column, ...common }: Common & { options: SelectOption[]; column?: boolean }) {
  const { field, id, error, change } = useFrame<string[]>();
  const chosen = field.state.value ?? [];
  return (
    <div role="group" aria-labelledby={`${id}-label`} className={`flex flex-col gap-1 ${common.wide ? "md:col-span-2" : ""}`}>
      <span id={`${id}-label`} className="label">
        {common.label}
      </span>
      <div className={`flex gap-3 ${column ? "flex-col gap-1" : "flex-wrap"}`}>
        {options.map((option) => (
          <Option key={option.value} option={option}>
            {(describedBy) => (
              <input
              type="checkbox"
              checked={chosen.includes(option.value)}
              disabled={common.disabled || option.disabled}
              aria-describedby={describedBy}
              onBlur={field.handleBlur}
              onChange={(event) => change(event.target.checked ? [...chosen, option.value] : chosen.filter((item) => item !== option.value))}
            />
            )}
          </Option>
        ))}
      </div>
      {error ? <p role="alert" className="text-xs text-[var(--bad)]">{error}</p> : common.help ? <p className="text-xs text-[var(--muted)]">{common.help}</p> : null}
    </div>
  );
}

export function CheckboxField({ label, help, disabled, className = "" }: { label: string; help?: string; disabled?: boolean; className?: string }) {
  const { field, id, error, change } = useFrame<boolean>();
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="flex min-h-[var(--control-h)] items-center gap-2">
        <input id={id} type="checkbox" checked={Boolean(field.state.value)} disabled={disabled} onBlur={field.handleBlur} onChange={(event) => change(event.target.checked)} className="h-4 w-4" />
        {label}
      </label>
      {error ? <p role="alert" className="text-xs text-[var(--bad)]">{error}</p> : help ? <p className="text-xs text-[var(--muted)]">{help}</p> : null}
    </div>
  );
}

/** One or several values from a long list (the kit's ComboBox); the value is the list of chosen values. */
export function ComboField({ options, onSearch, placeholder, single, ...common }: Common & { options: ComboOption[]; onSearch?: (text: string) => void; placeholder?: string; single?: boolean }) {
  const { field, error, change } = useFrame<string[]>();
  return (
    <div className={`flex flex-col gap-1 ${common.wide ? "md:col-span-2" : ""}`}>
      <ComboBox label={common.label} options={options} selected={field.state.value ?? []} onChange={change} onSearch={onSearch} placeholder={placeholder} single={single} />
      {error ? <p role="alert" className="text-xs text-[var(--bad)]">{error}</p> : common.help ? <p className="text-xs text-[var(--muted)]">{common.help}</p> : null}
    </div>
  );
}

/** A percentage with a slider and an exact box (the kit's PercentInput). */
export function PercentField({ min, max, ...common }: Common & { min?: number; max?: number }) {
  const { field, error, change } = useFrame<string>();
  return (
    <div className={`flex flex-col gap-1 ${common.wide ? "md:col-span-2" : ""}`}>
      <PercentInput label={common.label} value={field.state.value ?? ""} onChange={change} min={min} max={max} />
      {error ? <p role="alert" className="text-xs text-[var(--bad)]">{error}</p> : common.help ? <p className="text-xs text-[var(--muted)]">{common.help}</p> : null}
    </div>
  );
}

/** A value described by a JSON schema editor (settings): the kit's ValueInput. */
export function SchemaField({ editor, ...common }: Common & { editor: Editor }) {
  const { field, id, error, change } = useFrame<string>();
  return (
    <FieldFrame id={id} error={error} {...common}>
      <ValueInput id={id} editor={editor} text={field.state.value ?? ""} onChange={change} disabled={common.disabled} />
    </FieldFrame>
  );
}

/** One file to send (the value is the `File`, or null): an import, an attachment. `accept` filters the picker. */
export function FileField({ accept, ...common }: Common & { accept?: string }) {
  const { field, id, error, change, aria } = useFrame<File | null>();
  return (
    <FieldFrame id={id} error={error} {...common}>
      <input
        id={id}
        type="file"
        accept={accept}
        disabled={common.disabled}
        aria-required={common.required || undefined}
        onBlur={field.handleBlur}
        onChange={(event) => change(event.target.files?.[0] ?? null)}
        className={`${fieldInput(error, common.className)} py-1 file:mr-2 file:border-0 file:bg-transparent file:font-medium file:text-[var(--accent)]`}
        {...aria}
      />
    </FieldFrame>
  );
}

export const BASE_FIELD_COMPONENTS = { TextField, TextareaField, TokenField, NumberField, SelectField, RadioField, CheckboxesField, CheckboxField, ComboField, PercentField, SchemaField, FileField };

/** The text of the required mark, for apps that draw their own captions. */
export const requiredText = () => t("form.required");
