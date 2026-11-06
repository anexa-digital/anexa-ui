import { useEffect, useRef, type ReactNode } from "react";

import { t } from "../../i18n";

/** A modal dialog on the native <dialog>: focus stays inside, Esc closes it, the page behind is inert. */
export function Dialog({
  open,
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={`m-auto rounded-lg border border-[var(--line)] bg-[var(--raised)] p-0 text-[var(--ink)] shadow-2xl backdrop:bg-black/50 ${wide ? "w-[min(56rem,92vw)]" : "w-[min(32rem,92vw)]"}`}
    >
      {open && (
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-start gap-2">
            <h2 className="text-base font-semibold">{title}</h2>
            <button type="button" onClick={onClose} aria-label={t("ui.close")} className="ml-auto h-7 w-7 rounded text-[var(--muted)]">
              &times;
            </button>
          </div>
          {children}
          {footer && <div className="flex flex-wrap justify-end gap-2 pt-1">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
