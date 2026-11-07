import { useId, type ReactNode } from "react";

import { t } from "../../i18n";
import type { Editor } from "../../lib/schema";
import { inputClass, selectClass } from "../controls";
import { ComboBox, PercentInput, type ComboOption } from "../ui/widgets";
import { ValueInput } from "../ui/value-input";
import { useFieldContext } from "./context";

// The fields of a kit form: each one is a TanStack field bound to the kit's controls, with its caption, help, the
// errors of its validators and the error the server named for it. Used through form.AppField (see form.tsx).

/** The errors of a field as one text: validators may return strings or objects with a message. */
export function errorText(errors: unknown[]): string | null {
  const texts = errors.filter((error) => error !== undefined && error !== null && error !== false).map((error) => (typeof error === "string" ? error : typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message) : String(error)));
  return texts.length ? texts.join(" ") : null;
}

type Common = { label: string; help?: string; required?: boolean; disabled?: boolean; wide?: boolean };

/** The frame of a field: caption (with the required mark), the control, help and error. */
export function FieldFrame({ id, label, help, required, error, wide, children }: Common & { id: string; error: string | null; children: ReactNode }) {
  return (
    <div className={`flex flex-col gap-1 ${wide ? "md:col-span-2" : ""}`}>
      <label htmlFor={id} className="label">
        {label}
        {required && (
          <span aria-hidden className="text-[var(--bad)]">
            {" "}
            *
          </span>
        )}
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
  const aria = { "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${id}-error` : undefined, "aria-required": undefined as boolean | undefined };
  return { field, id, error, change, aria };
}

const fieldInput = (error: string | null) => `${inputClass} w-full ${error ? "border-[var(--bad)]" : ""}`;

export function TextField({ type = "text", placeholder, ...common }: Common & { type?: "text" | "email" | "url" | "password" | "date"; placeholder?: string }) {
  const { field, id, error, change, aria } = useFrame<string>();
  return (
    <FieldFrame id={id} error={error} {...common}>
      <input id={id} type={type} value={field.state.value ?? ""} placeholder={placeholder} disabled={common.disabled} required={common.required} onBlur={field.handleBlur} onChange={(event) => change(event.target.value)} className={fieldInput(error)} {...aria} />
    </FieldFrame>
  );
}

export function TextareaField({ rows = 3, placeholder, ...common }: Common & { rows?: number; placeholder?: string }) {
  const { field, id, error, change, aria } = useFrame<string>();
  return (
    <FieldFrame id={id} error={error} {...common}>
      <textarea id={id} rows={rows} value={field.state.value ?? ""} placeholder={placeholder} disabled={common.disabled} required={common.required} onBlur={field.handleBlur} onChange={(event) => change(event.target.value)} className={`${fieldInput(error)} h-auto py-1`} {...aria} />
    </FieldFrame>
  );
}

/** A number kept as text (decimals travel as strings, never as floats); `unit` shows after the box. */
export function NumberField({ unit, min, max, step = "any", ...common }: Common & { unit?: string; min?: number; max?: number; step?: number | "any" }) {
  const { field, id, error, change, aria } = useFrame<string>();
  return (
    <FieldFrame id={id} error={error} {...common}>
      <div className="flex items-center gap-2">
        <input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={field.state.value ?? ""} disabled={common.disabled} required={common.required} onBlur={field.handleBlur} onChange={(event) => change(event.target.value)} className={`${fieldInput(error)} num text-right`} {...aria} />
        {unit && <span className="shrink-0 text-[var(--muted)]">{unit}</span>}
      </div>
    </FieldFrame>
  );
}

export function SelectField({ options, empty, ...common }: Common & { options: { value: string; label: string }[]; empty?: string }) {
  const { field, id, error, change, aria } = useFrame<string>();
  return (
    <FieldFrame id={id} error={error} {...common}>
      <select id={id} value={field.state.value ?? ""} disabled={common.disabled} required={common.required} onBlur={field.handleBlur} onChange={(event) => change(event.target.value)} className={`${selectClass} w-full ${error ? "border-[var(--bad)]" : ""}`} {...aria}>
        {empty !== undefined && <option value="">{empty}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}

export function CheckboxField({ label, help, disabled }: { label: string; help?: string; disabled?: boolean }) {
  const { field, id, error, change } = useFrame<boolean>();
  return (
    <div className="flex flex-col gap-1">
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

export const FIELD_COMPONENTS = { TextField, TextareaField, NumberField, SelectField, CheckboxField, ComboField, PercentField, SchemaField };

/** The text of the required mark, for apps that draw their own captions. */
export const requiredText = () => t("form.required");
