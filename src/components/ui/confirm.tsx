import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

import { t } from "../../i18n";
import { buttonClass, dangerClass, inputClass, primaryClass } from "../controls";
import { Kbd } from "../shortcuts";
import { Dialog } from "./dialog";

// Confirmation before an action that cannot be undone or that reaches other people (publish, send to approval,
// revoke): one dialog for the whole app, asked for with a promise. Cheap deletions prefer a toast with «Deshacer».

export type ConfirmOptions = {
  title: string;
  /** What will happen, in one or two sentences; who is affected. */
  body?: ReactNode;
  /** The verb of the action («Enviar», «Publicar», «Eliminar»); «Confirmar» by default. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red button, and the focus starts on «Cancelar». */
  danger?: boolean;
  /** Asks for a reason: the promise resolves with the text (empty when optional and left blank). */
  reason?: { label: string; required?: boolean; placeholder?: string };
};

type Ask = (options: ConfirmOptions) => Promise<{ confirmed: boolean; reason: string }>;

const ConfirmContext = createContext<Ask>(() => Promise.resolve({ confirmed: false, reason: "" }));

type Pending = { options: ConfirmOptions; resolve: (result: { confirmed: boolean; reason: string }) => void };

/** Mounted once (AppShell does it); `useConfirm()` anywhere inside asks the person and awaits the answer. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [reason, setReason] = useState("");
  const cancelButton = useRef<HTMLButtonElement>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);
  const ask = useCallback<Ask>((options) => {
    setReason("");
    return new Promise((resolve) => setPending({ options, resolve }));
  }, []);
  const value = useMemo(() => ask, [ask]);
  const answer = (confirmed: boolean) => {
    pending?.resolve({ confirmed, reason: reason.trim() });
    setPending(null);
  };
  const options = pending?.options;
  const needsReason = Boolean(options?.reason?.required) && !reason.trim();
  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {options && (
        <Dialog
          open
          title={options.title}
          onClose={() => answer(false)}
          initialFocus={options.danger ? cancelButton : confirmButton}
          footer={
            <>
              <button ref={cancelButton} type="button" onClick={() => answer(false)} className={`${buttonClass} flex items-center gap-1.5`}>
                {options.cancelLabel ?? t("ui.cancel")}
                <span aria-hidden className="contents"><Kbd keys="escape" /></span>
              </button>
              <button ref={confirmButton} type="button" disabled={needsReason} onClick={() => answer(true)} className={`${options.danger ? `${dangerClass} font-medium` : primaryClass} flex items-center gap-1.5`}>
                {options.confirmLabel ?? t("ui.confirm")}
                <span aria-hidden className="contents"><Kbd keys="enter" /></span>
              </button>
            </>
          }
        >
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!needsReason) answer(true);
            }}
          >
            {options.body && <div className="max-w-[65ch] text-[var(--ink)]">{options.body}</div>}
            {options.reason && (
              <label className="flex flex-col gap-1">
                <span className="label" data-required={options.reason.required || undefined}>
                  {options.reason.label}
                </span>
                <input autoFocus value={reason} onChange={(event) => setReason(event.target.value)} placeholder={options.reason.placeholder} className={`${inputClass} w-full`} />
              </label>
            )}
            {/* Enter in the field, or the dialog's footer button, both confirm. */}
            <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
          </form>
        </Dialog>
      )}
    </ConfirmContext.Provider>
  );
}

/** `const ok = await confirm({ title, body, danger })`; resolves false when the person cancels or closes. */
export function useConfirm(): Ask {
  return useContext(ConfirmContext);
}
