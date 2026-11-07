import { useState } from "react";

import { t } from "../../../i18n";
import { errorMessage } from "../../../lib/errors";
import { buttonClass, dangerClass, inputClass, primaryClass } from "../../controls";
import { Dialog } from "../dialog";

/**
 * An action over the selected rows. It runs row by row through the same endpoint a single row uses, so every rule
 * and permission of the server still applies to each one; rows it does not apply to are skipped, not failed.
 */
export type BulkAction<T> = {
  label: string;
  danger?: boolean;
  /** The rows the action makes sense for (a draft can be deleted, a cancelled request cannot be cancelled). */
  applies?: (row: T) => boolean;
  /** The question asked before running, with how many rows it will touch. */
  confirm: (count: number) => string;
  /** Asks for an optional reason, kept by each change. */
  reason?: boolean;
  run: (row: T, reason: string | null) => Promise<unknown>;
};

type Outcome<T> = { done: number; skipped: number; failed: { row: T; error: unknown }[] };

/** The buttons of the bulk actions in the selection bar, with their confirmation, progress and outcome. */
export function BulkActions<T>({
  actions,
  rows,
  all,
  rowLabel,
  onDone,
}: {
  actions: BulkAction<T>[];
  rows: T[];
  /** «All that match» is a filter, not rows: actions work only on rows marked one by one. */
  all: boolean;
  rowLabel: (row: T) => string;
  onDone: () => void;
}) {
  const [chosen, setChosen] = useState<BulkAction<T> | null>(null);
  const [reason, setReason] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<Outcome<T> | null>(null);
  const targets = chosen ? rows.filter((row) => chosen.applies?.(row) ?? true) : [];

  async function run() {
    if (!chosen) return;
    const result: Outcome<T> = { done: 0, skipped: rows.length - targets.length, failed: [] };
    for (const [index, row] of targets.entries()) {
      setProgress(index);
      try {
        await chosen.run(row, reason.trim() || null);
        result.done += 1;
      } catch (error) {
        result.failed.push({ row, error });
      }
    }
    setProgress(null);
    setOutcome(result);
    onDone();
  }

  function close() {
    setChosen(null);
    setReason("");
    setOutcome(null);
    setProgress(null);
  }

  return (
    <>
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          disabled={all}
          title={all ? t("grid.bulkNeedsRows") : undefined}
          onClick={() => setChosen(action)}
          className={action.danger ? dangerClass : buttonClass}
        >
          {action.label}
        </button>
      ))}
      <Dialog
        open={chosen !== null}
        title={chosen?.label ?? ""}
        onClose={() => progress === null && close()}
        footer={
          outcome ? (
            <button type="button" onClick={close} className={primaryClass}>
              {t("ui.close")}
            </button>
          ) : (
            <>
              <button type="button" disabled={progress !== null} onClick={close} className={buttonClass}>
                {t("ui.cancel")}
              </button>
              <button type="button" disabled={progress !== null || targets.length === 0} onClick={() => void run()} className={chosen?.danger ? dangerClass : primaryClass}>
                {t("grid.bulkApply")}
              </button>
            </>
          )
        }
      >
        {chosen && !outcome && (
          <div className="flex flex-col gap-2">
            <p>{chosen.confirm(targets.length)}</p>
            {targets.length < rows.length && <p className="text-[var(--muted)]">{t("grid.bulkSkipped", { count: rows.length - targets.length })}</p>}
            {chosen.reason && (
              <label className="flex flex-col gap-1">
                <span className="text-[var(--muted)]">{t("grid.bulkReason")}</span>
                <textarea rows={2} maxLength={4000} value={reason} onChange={(event) => setReason(event.target.value)} className={inputClass} />
              </label>
            )}
            {progress !== null && <p role="status">{t("grid.bulkProgress", { done: progress + 1, total: targets.length })}</p>}
          </div>
        )}
        {outcome && (
          <div role="status" className="flex flex-col gap-2">
            <p className="text-[var(--ok)]">{t("grid.bulkDone", { count: outcome.done })}</p>
            {outcome.skipped > 0 && <p className="text-[var(--muted)]">{t("grid.bulkSkipped", { count: outcome.skipped })}</p>}
            {outcome.failed.length > 0 && (
              <ul className="flex max-h-48 flex-col gap-1 overflow-auto text-[var(--bad)]">
                {outcome.failed.map(({ row, error }) => (
                  <li key={rowLabel(row)}>
                    <span className="num">{rowLabel(row)}</span>: {errorMessage(error)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}
