import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";

import { t } from "../../i18n";

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
  /** The control that takes the focus when the dialog opens (the cancel button of a dangerous confirmation). */
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
      if (initialFocus?.current) initialFocus.current.focus();
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
            <button type="button" onClick={onClose} aria-label={t("ui.close")} className="ml-auto flex h-[var(--touch)] w-[var(--touch)] items-center justify-center rounded-[var(--radius-sm)] text-[var(--muted)]">
              &times;
            </button>
          </div>
          {children}
          {footer && <div className="flex flex-wrap justify-end gap-2 pt-1">{footer}</div>}
        </div>
        </HotkeysProvider>
      )}
    </dialog>
  );
}
