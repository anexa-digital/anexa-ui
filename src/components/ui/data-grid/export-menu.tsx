import { useState } from "react";

import { t } from "../../../i18n";
import { errorMessage } from "../../../lib/errors";
import { buttonClass } from "../../controls";
import { Icon } from "../icons";
import { Menu } from "../menu";
import type { ExportFormat } from "./data-grid";

/** «Exportar» with its two formats: Excel (typed, built by the API) and CSV. `detail` says what goes in the file. */
export function ExportMenu({ label, detail, disabled, onExport }: { label: string; detail: string; disabled?: boolean; onExport: (format: ExportFormat) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function run(format: ExportFormat) {
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

  const items = (["xlsx", "csv"] as const).map((format) => ({ id: format, label: `${t(format === "xlsx" ? "grid.excel" : "grid.csv")} · ${detail}`, icon: "download" as const, disabled: disabled || busy, run: () => void run(format) }));
  return (
    <div className="relative">
      <Menu label={label} items={items} align="right" className={`${buttonClass} flex items-center gap-1.5`}>
        <Icon name="download" className="h-4 w-4 text-[var(--muted)]" />
        {busy ? t("grid.exporting") : label}
      </Menu>
      {error ? <p className="absolute right-0 top-full mt-1 w-64 text-xs text-[var(--bad)]">{errorMessage(error)}</p> : null}
    </div>
  );
}
