import { useState, type ReactNode } from "react";

import { t } from "../../../i18n";
import { inputClass } from "../../controls";
import { Pager } from "../pager";
import { cellText, useArrangedTable } from "./arranged-table";
import { ColumnsPanel } from "./columns-panel";
import { download, toCsv, toXlsx } from "./csv";
import { GridTable } from "./grid-table";
import type { GridColumn } from "./types";
import { ExportMenu } from "./export-menu";
import { ViewsPanel } from "./views-panel";

type RowEvents<T> = {
  onOpen?: (row: T) => void;
  onRowClick?: (row: T) => void;
  isActive?: (row: T) => boolean;
  rowClass?: (row: T) => string;
};

export type ExportFormat = "xlsx" | "csv";

/** The visible columns of some rows as a file to save: a typed Excel workbook (built by the API) or CSV. */
export async function exportFile<T>(format: ExportFormat, name: string, columns: GridColumn<T>[], visible: Set<string>, rows: T[]) {
  const shown = columns.filter((column) => visible.has(column.id));
  const head = shown.map((column) => column.header);
  const cells = rows.map((row) => shown.map((column) => cellText(column, row)));
  if (format === "csv") download(`${name}.csv`, toCsv(head, cells));
  else download(`${name}.xlsx`, await toXlsx(name, head, cells));
}

/**
 * A grid over rows already in memory: sort by any column (Shift adds a second), quick search, paging here, columns
 * the user arranges, saved views, density and CSV of what the search leaves. `grid` names it for its preferences.
 */
export function DataGrid<T>({
  grid,
  rows,
  columns,
  getRowId,
  empty,
  search = false,
  pageSize,
  exportName,
  toolbar,
  maxHeight,
  ...events
}: {
  grid: string;
  rows: T[];
  columns: GridColumn<T>[];
  getRowId?: (row: T, index: number) => string;
  empty: string;
  /** A quick search box over every column's text. */
  search?: boolean;
  /** Pages of this size here; without it every row shows. */
  pageSize?: number;
  /** File name of the CSV export; without it there is no export. */
  exportName?: string;
  toolbar?: ReactNode;
  maxHeight?: string;
} & RowEvents<T>) {
  const [text, setText] = useState("");
  const { table, preferences, change, reset, views, page } = useArrangedTable({ grid, rows, columns, getRowId, search: text, pageSize });
  const filtered = table.getFilteredRowModel().rows.length;
  const visible = new Set(table.getVisibleLeafColumns().map((column) => column.id));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {toolbar}
        {search && (
          <input
            type="search"
            aria-label={t("grid.search")}
            placeholder={t("grid.search")}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className={`${inputClass} h-7 w-56`}
          />
        )}
        <div className="ml-auto flex items-center gap-2">
          {exportName && (
            <ExportMenu
              label={t("grid.export")}
              detail={t("grid.exportAll", { total: filtered.toLocaleString("es-CO") })}
              disabled={filtered === 0}
              onExport={(format) => exportFile(format, exportName, columns, visible, table.getPrePaginationRowModel().rows.map((row) => row.original))}
            />
          )}
          <ViewsPanel views={views.list} onSave={views.save} onApply={views.apply} onDelete={views.remove} />
          <ColumnsPanel columns={columns} preferences={preferences} onChange={change} onReset={reset} />
        </div>
      </div>
      {filtered === 0 ? (
        <p className="text-[var(--muted)]">{rows.length === 0 ? empty : t("grid.noMatches")}</p>
      ) : (
        <GridTable table={table} density={preferences.density} maxHeight={maxHeight} {...events} />
      )}
      {pageSize && filtered > pageSize && <Pager page={page.index + 1} pageSize={pageSize} total={filtered} onPage={(next) => page.set(next - 1)} />}
    </div>
  );
}
