import { createFormHook, useStore } from "@tanstack/react-form";
import { useEffect, useRef, type FormEvent, type ReactNode } from "react";

import { t } from "../../i18n";
import { ApiError } from "../../lib/api";
import { errorMessage } from "../../lib/errors";
import { buttonClass, primaryClass } from "../controls";
import { KeyHint, useShortcut } from "../shortcuts";
import { useConfirm } from "../ui/confirm";
import { useDrawerGuard } from "../ui/drawer";
import { fieldContext, formContext, useFormContext } from "./context";
import { DateField, MonthField } from "./date-field";
import { DateTimeField } from "./date-time-field";
import { BASE_FIELD_COMPONENTS } from "./fields";
import { RecordField } from "./record-picker";

export const FIELD_COMPONENTS = { ...BASE_FIELD_COMPONENTS, DateField, DateTimeField, MonthField, RecordField };

// Forms on TanStack Form: `useAppForm` gives a form whose `AppField` renders the kit's fields and whose `AppForm`
// renders its buttons and error; `Form` wraps the <form> with Ctrl/⌘ ⏎ to submit and Esc to cancel; `submitError`
// puts the API's rejection on the field it names, or on the form.

type FormLike = { handleSubmit: () => Promise<void>; store: Parameters<typeof useStore>[0] };

/**
 * The <form>: Enter in a field submits as usual; Ctrl/⌘ ⏎ submits from anywhere in it; Esc calls `onCancel`.
 *
 * The kit's fields validate through TanStack (their `required` is a validator and an `aria-required`, never the
 * attribute), so the browser's bubbles never compete with their messages. Plain controls the app still renders inside
 * (`required`, `min`, `type="email"`…) keep the browser's checks: the form reports them before TanStack submits.
 */
export function Form({ form, onCancel, children, className = "flex flex-col gap-3", id, title }: { form: Pick<FormLike, "handleSubmit">; onCancel?: () => void; children: ReactNode; className?: string; /** For a submit button outside the form (a dialog's footer). */ id?: string; title?: string }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    const element = event.currentTarget;
    if (!element.checkValidity()) {
      element.reportValidity();
      return;
    }
    void form.handleSubmit();
  }
  const formRef = useRef<HTMLFormElement>(null);
  useShortcut("mod+enter", () => formRef.current?.requestSubmit(), { description: t("shortcuts.formSubmit"), group: "form", target: formRef, allowInInput: true });
  useShortcut("escape", () => onCancel?.(), { description: t("shortcuts.formCancel"), group: "form", target: formRef, enabled: Boolean(onCancel), allowInInput: true });
  return (
    <form ref={formRef} id={id} title={title} onSubmit={submit} noValidate className={className}>
      {children}
    </form>
  );
}

/** «Guardar», disabled while the form cannot submit or is submitting; the key hint shows Ctrl/⌘ ⏎. */
function SubmitButton({ label, pendingLabel, className = primaryClass, disabled, keys = "mod+enter", form: formId }: { label?: string; /** While it submits («Ingresando…»); «Guardando…» by default. */ pendingLabel?: string; className?: string; /** Something else that must hold before saving. */ disabled?: boolean; keys?: string | null; /** The `id` of a `Form` rendered elsewhere, when the button sits in a dialog's footer. */ form?: string }) {
  const form = useFormContext();
  const [canSubmit, isSubmitting] = useStore(form.store, (state) => [state.canSubmit, state.isSubmitting]);
  return (
    <button type="submit" form={formId} disabled={disabled || !canSubmit || isSubmitting} className={`${className} flex items-center`}>
      {isSubmitting ? (pendingLabel ?? t("form.saving")) : (label ?? t("form.save"))}
      {keys && <KeyHint keys={keys} className="ml-1.5 kbd-on-accent" />}
    </button>
  );
}

/** «Cancelar» with its key; the form's `onCancel` does the work. */
function CancelButton({ label, onClick, className = buttonClass }: { label?: string; onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`${className} flex items-center`}>
      {label ?? t("form.cancel")}
      <KeyHint keys="escape" />
    </button>
  );
}

/** What the server said about the form as a whole (submitError put it there), or that fields are marked. */
function FormError() {
  const form = useFormContext();
  const [server, submitted, valid] = useStore(form.store, (state) => [state.errorMap.onServer, state.isSubmitted, state.isValid]);
  const text = server ? String(typeof server === "object" && server && "message" in server ? (server as { message: unknown }).message : server) : submitted && !valid ? t("form.invalid") : null;
  return text ? (
    <p role="alert" className="text-[var(--bad)]">
      {text}
    </p>
  ) : null;
}

/** The buttons of a form, right-aligned, wrapping on a phone. */
function FormActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-end gap-2 pt-1">{children}</div>;
}

export const FORM_COMPONENTS = { SubmitButton, CancelButton, FormError, FormActions };

export const { useAppForm, withForm, withFieldGroup } = createFormHook({ fieldComponents: FIELD_COMPONENTS, formComponents: FORM_COMPONENTS, fieldContext, formContext });

/** The validator of a field that must have a value: `validators={{ onSubmit: required }}`. Empty text, null and
 * undefined fail; a list fails when it is empty. */
export const required = ({ value }: { value: unknown }): string | undefined =>
  value === null || value === undefined || value === "" || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && value.length === 0) ? t("form.required") : undefined;

/** Which field an API rejection names, if any: `detail.field`, or the last element of a FastAPI `loc`. */
export function errorField(error: unknown, fields: string[]): string | null {
  if (!(error instanceof ApiError) || !error.detail) return null;
  const detail = error.detail;
  if (typeof detail === "object" && !Array.isArray(detail) && typeof (detail as { field?: unknown }).field === "string") {
    const field = (detail as { field: string }).field;
    return fields.includes(field) ? field : null;
  }
  if (Array.isArray(detail)) {
    for (const item of detail as { loc?: unknown[] }[]) {
      const last = item.loc?.at(-1);
      if (typeof last === "string" && fields.includes(last)) return last;
    }
  }
  return null;
}

type ErrorTarget = { setErrorMap: (map: never) => void; setFieldMeta: (field: never, updater: never) => void; state: { values: Record<string, unknown> } };

/** Puts an API rejection where it belongs: on the field it names (shown under it) or on the form (FormError). */
export function submitError(form: ErrorTarget, error: unknown): void {
  const message = errorMessage(error);
  const field = errorField(error, Object.keys(form.state.values));
  if (field) {
    form.setFieldMeta(field as never, ((meta: { errorMap: Record<string, unknown> }) => ({ ...meta, errorMap: { ...meta.errorMap, onServer: message } })) as never);
  } else {
    form.setErrorMap({ onServer: message } as never);
  }
}

type DirtyForm = { store: Parameters<typeof useStore>[0]; reset: () => void };

/**
 * Closing a form with changes asks first: `const close = useDirtyGuard(form, onClose)`; `close()` leaves at once when
 * nothing changed, otherwise it confirms («Descartar cambios» / «Seguir editando») and resets the form on leaving.
 */
export function useDirtyGuard(form: DirtyForm, onClose: () => void): () => Promise<void> {
  const confirm = useConfirm();
  const drawer = useDrawerGuard();
  const dirty = useStore(form.store, (state) => (state as { isDirty: boolean }).isDirty);
  const close = async () => {
    if (!dirty) return onClose();
    const { confirmed } = await confirm({ title: t("ui.unsavedTitle"), body: t("ui.unsavedBody"), confirmLabel: t("ui.discard"), cancelLabel: t("ui.keepEditing"), danger: true });
    if (!confirmed) return;
    form.reset();
    onClose();
  };
  // Inside a drawer, its × and Esc leave through this guard too.
  const latest = useRef(close);
  latest.current = close;
  useEffect(() => {
    drawer?.set(() => latest.current());
    return () => drawer?.set(null);
  }, [drawer]);
  return close;
}
