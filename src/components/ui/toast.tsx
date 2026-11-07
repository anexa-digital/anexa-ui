import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { t } from "../../i18n";

export type Toast = { id: string; tone: "ok" | "bad" | "info"; title: string; body?: string; action?: { label: string; run: () => void } };
type Push = (toast: Omit<Toast, "id">) => void;

const ToastContext = createContext<Push>(() => {});

const TONE: Record<Toast["tone"], string> = {
  ok: "border-[var(--ok)]",
  bad: "border-[var(--bad)]",
  info: "border-[var(--accent)]",
};

/** Short notices in a corner (a task ended): they go away after a while or when closed; never block anything. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const close = useCallback((id: string) => setToasts((all) => all.filter((item) => item.id !== id)), []);
  const push = useCallback<Push>(
    (toast) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((all) => [...all.slice(-3), { ...toast, id }]);
      window.setTimeout(() => close(id), 9000);
    },
    [close],
  );
  const value = useMemo(() => push, [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2 print:hidden">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`toast-in pointer-events-auto flex flex-col gap-1 rounded-[var(--radius-lg)] border-l-4 bg-[var(--raised)] p-3 shadow-[var(--shadow)] ${TONE[toast.tone]}`}
          >
            <div className="flex items-start gap-2">
              <p className="font-medium">{toast.title}</p>
              <button type="button" onClick={() => close(toast.id)} aria-label={t("ui.close")} className="ml-auto h-[var(--control-h-sm)] w-[var(--control-h-sm)] text-[var(--muted)]">
                &times;
              </button>
            </div>
            {toast.body && <p className="text-[var(--muted)]">{toast.body}</p>}
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.run();
                  close(toast.id);
                }}
                className="h-[var(--control-h)] self-start rounded-[var(--radius-sm)] bg-[var(--accent)] px-3 text-[var(--on-accent)]"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
