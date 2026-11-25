import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";

import { t } from "../../i18n";

// What can take the focus: a control that is enabled, shown to readers and in the tab order.
const CONTROL = ':is(input:not([type="hidden"]), select, textarea, button, a[href], [tabindex], [contenteditable="true"]):not([disabled]):not([aria-hidden="true"]):not([tabindex="-1"])';

/**
 * Where the focus lands when a dialog opens, in order of preference: the control the screen marked with
 * `data-autofocus`, the first control of the body (the first field), the first button of the footer, and the «×»
 * only when there is nothing else. The browser alone picks the first control in the markup, which is the «×».
 */
export const INITIAL_FOCUS: readonly string[] = ["[data-autofocus]:not([disabled])", `[data-dialog-body] ${CONTROL}`, `[data-dialog-footer] ${CONTROL}`, "[data-close]"];

/** The element of an open dialog that takes the focus; null leaves it where the browser put it. */
export function focusTarget(dialog: Pick<ParentNode, "querySelector">): HTMLElement | null {
  for (const selector of INITIAL_FOCUS) {
    const found = dialog.querySelector<HTMLElement>(selector);
    if (found) return found;
  }
  return null;
}

/** A modal dialog on the native <dialog>: focus stays inside, Esc closes it, the page behind is inert and its
 * shortcuts are suspended (the dialog owns the keyboard; only global ones, like the palette, keep working). */
export function Dialog({
  open,
  title,
  onClose,
  children,
  footer,
  wide,
  size,
  initialFocus,
  description,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** 56rem instead of 32rem (same as `size="lg"`). */
  wide?: boolean;
  /** sm 24rem (a confirmation), md 32rem, lg 56rem, xl 72rem (a search over a grid). */
  size?: "sm" | "md" | "lg" | "xl";
  /** The control that takes the focus when the dialog opens (the cancel button of a dangerous confirmation). Without
   * it: the control marked `data-autofocus`, else the first field of the body, else the footer's first button. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** A line under the title, in the muted color. */
  description?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const scope = `dialog-${useId()}`;
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      (initialFocus?.current ?? focusTarget(dialog))?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, initialFocus]);
  const width = { sm: "w-[min(24rem,92vw)]", md: "w-[min(32rem,92vw)]", lg: "w-[min(56rem,92vw)]", xl: "w-[min(72rem,94vw)]" }[size ?? (wide ? "lg" : "md")];
  return (
    <dialog
      ref={ref}
      // Closed, it is not named: a label query for a field never finds a dialog that is not there.
      aria-label={open ? title : undefined}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={`dialog-in m-auto rounded-[var(--radius-lg)] border border-[var(--line-strong)] bg-[var(--raised)] p-0 text-[var(--ink)] shadow-[var(--shadow)] backdrop:bg-[var(--overlay)] max-md:m-0 max-md:h-dvh max-md:max-h-dvh max-md:w-screen max-md:max-w-none max-md:rounded-none ${width}`}
    >
      {open && (
        <HotkeysProvider scope={scope} exclusive={{ allow: ["global"] }}>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-start gap-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 className="text-base font-semibold [font-family:var(--font-display)]">{title}</h2>
              {description && <p className="max-w-[65ch] text-[var(--muted)]">{description}</p>}
            </div>
            <button type="button" data-close onClick={onClose} aria-label={t("ui.close")} className="ml-auto flex h-[var(--touch)] w-[var(--touch)] items-center justify-center rounded-[var(--radius-sm)] text-[var(--muted)]">
              &times;
            </button>
          </div>
          {/* `contents`: the children stay items of the column; the wrapper only says where the body is. */}
          <div data-dialog-body className="contents">
            {children}
          </div>
          {footer && <div data-dialog-footer className="flex flex-wrap justify-end gap-2 pt-1">{footer}</div>}
        </div>
        </HotkeysProvider>
      )}
    </dialog>
  );
}
