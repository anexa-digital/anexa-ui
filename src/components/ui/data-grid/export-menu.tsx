import { useState } from "react";

import { t } from "../../../i18n";
import { errorMessage } from "../../../lib/errors";
import { buttonClass } from "../../controls";
import { PopoverPanel, usePopover } from "../popover";
import type { ExportFormat } from "./data-grid";

/** «Exportar» with its two formats: Excel (typed, built by the API) and CSV. `detail` says what goes in the file. */
export function ExportMenu({ label, detail, disabled, onExport }: { label: string; detail: string; disabled?: boolean; onExport: (format: ExportFormat) => Promise<void> }) {
  const { open, setOpen, box } = usePopover();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function run(format: ExportFormat) {
    setOpen(false);
    setBusy(true);
    setError(null);
    try {
      await onExport(format);
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={box} className="relative">
      <button type="button" aria-expanded={open} disabled={disabled || busy} onClick={() => setOpen(!open)} className={buttonClass}>
        {busy ? t("grid.exporting") : label}
      </button>
      {open && (
        <PopoverPanel label={label} align="right" className="w-56">
          {(["xlsx", "csv"] as const).map((format) => (
            <button key={format} type="button" onClick={() => void run(format)} className="flex h-auto flex-col items-start rounded px-2 py-1 text-left hover:bg-[var(--row-hover)]">
              <span>{t(format === "xlsx" ? "grid.excel" : "grid.csv")}</span>
              <span className="text-xs text-[var(--muted)]">{detail}</span>
            </button>
          ))}
        </PopoverPanel>
      )}
      {error ? <p className="absolute right-0 top-full mt-1 w-64 text-xs text-[var(--bad)]">{errorMessage(error)}</p> : null}
    </div>
  );
}
