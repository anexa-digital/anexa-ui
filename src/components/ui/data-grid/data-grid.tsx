import type { ColumnDef, Row } from "@tanstack/react-table";
import { useMemo, useRef, useState, type ReactNode } from "react";

import { t } from "../../../i18n";
import { buttonClass, inputClass } from "../../controls";
import { useShortcut } from "../../shortcuts";
import { Icon } from "../icons";
import { Menu } from "../menu";
import { Pager } from "../pager";
import { Toolbar } from "../toolbar";
import { EmptyState, GridSkeleton, LoadError, type Empty } from "../widgets";
import { KeysHint } from "./keys-hint";
import { ACTIONS_COLUMN, cellText, useArrangedTable } from "./arranged-table";
import { ColumnsPanel } from "./columns-panel";
import { download, toCsv, toXlsx } from "./csv";
import { GridTable, type RowActions } from "./grid-table";
import type { Density, GridColumn } from "./types";
import { ExportMenu } from "./export-menu";
import { ViewsPanel } from "./views-panel";

type RowEvents<T> = {
  onOpen?: (row: T) => void;
  onRowClick?: (row: T) => void;
  isActive?: (row: T) => boolean;
  rowClass?: (row: T) => string;
  /** The «⋯» menu of each row (edit, duplicate, delete…); an item with `keys` also runs on the focused row. */
  rowActions?: RowActions<T>;
};

/** The «⋯» column of a grid with row actions: last, pinned right, out of the panels and the export. */
export function actionsColumn<T>(rowActions: RowActions<T>): ColumnDef<T, unknown> {
  return {
    id: ACTIONS_COLUMN,
    size: 40,
    enableSorting: false,
    enableResizing: false,
    enableHiding: false,
    enablePinning: false,
    header: () => <span className="sr-only">{t("grid.rowActions")}</span>,
    cell: ({ row }: { row: Row<T> }) => {
      const items = rowActions(row.original);
      return items.length ? (
        <span className="flex justify-center" onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}>
          <Menu label={t("grid.rowActions")} items={items} align="right" />
        </span>
      ) : null;
    },
  };
}

/** «Compacta» / «Cómoda»: the row height of this grid, toggled from its toolbar. */
export function DensityButton({ density, onChange }: { density: Density; onChange: (density: Density) => void }) {
  return (
    <button type="button" aria-label={t("grid.density")} title={t("grid.density")} aria-pressed={density === "normal"} onClick={() => onChange(density === "compact" ? "normal" : "compact")} className={`${buttonClass} hidden items-center gap-1.5 lg:flex`}>
      <Icon name="list" className="h-4 w-4 text-[var(--muted)]" />
      {t(density === "compact" ? "grid.compact" : "grid.comfortable")}
    </button>
  );
}

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
  fill,
  loading,
  error,
  onRetry,
  createKeys,
  ...events
}: {
  grid: string;
  rows: T[];
  columns: GridColumn<T>[];
  getRowId?: (row: T, index: number) => string;
  /** What the list says when it has no rows: a title, or a title with a body and an action. */
  empty: string | Empty;
  /** A quick search box over every column's text. */
  search?: boolean;
  /** Pages of this size here; without it every row shows. */
  pageSize?: number;
  /** File name of the CSV export; without it there is no export. */
  exportName?: string;
  toolbar?: ReactNode;
  maxHeight?: string;
  /** The card takes the height the page leaves it (the page is a `flex h-full flex-col`) and the rows scroll inside. */
  fill?: boolean;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  createKeys?: boolean;
} & RowEvents<T>) {
  const [text, setText] = useState("");
  const searchBox = useRef<HTMLInputElement>(null);
  useShortcut("/", () => searchBox.current?.focus(), { description: t("shortcuts.listSearch"), group: "list", enabled: search });
  const { rowActions } = events;
  const actions = useMemo(() => (rowActions ? actionsColumn<T>(rowActions) : undefined), [rowActions]);
  const { table, preferences, change, reset, views, page } = useArrangedTable({ grid, rows, columns, getRowId, search: text, pageSize, actions });
  const filtered = table.getFilteredRowModel().rows.length;
  const visible = new Set(table.getVisibleLeafColumns().map((column) => column.id).filter((id) => id !== ACTIONS_COLUMN));
  const hasEdit = Boolean(rowActions && rows[0] && rowActions(rows[0]).some((item) => item.keys?.toLowerCase() === "f2"));
  return (
    <section className={`flex min-w-0 flex-col rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] ${fill ? "min-h-0 flex-1" : ""}`}>
      <Toolbar
        className="border-b border-[var(--line)] px-2.5 py-2"
        right={
          <>
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
            <DensityButton density={preferences.density} onChange={(density) => change({ density })} />
          </>
        }
      >
        {search && <SearchBox ref={searchBox} value={text} onChange={setText} />}
        {toolbar}
      </Toolbar>
      {error ? (
        <LoadError error={error} onRetry={onRetry} />
      ) : loading && rows.length === 0 ? (
        <GridSkeleton />
      ) : filtered === 0 ? (
        <div className="p-3">
          {rows.length === 0 ? <EmptyState {...(typeof empty === "string" ? { title: empty } : empty)} /> : <EmptyState title={t("grid.noMatches")} />}
        </div>
      ) : (
        <GridTable table={table} density={preferences.density} maxHeight={maxHeight} bare fill={fill} onPageKey={pageSize ? (delta) => page.set(Math.max(0, Math.min(Math.ceil(filtered / pageSize) - 1, page.index + delta))) : undefined} {...events} />
      )}
      {pageSize && filtered > pageSize && (
        <div className="border-t border-[var(--line)] px-2.5 py-1.5">
          <Pager page={page.index + 1} pageSize={pageSize} total={filtered} onPage={(next) => page.set(next - 1)} hint={<KeysHint open={Boolean(events.onOpen || events.onRowClick)} edit={hasEdit} create={createKeys} />} />
        </div>
      )}
    </section>
  );
}

/** The quick search of a list: a magnifier, the text and the «/» key that focuses it (the design's search box). */
export function SearchBox({ ref, value, onChange, placeholder, label, className = "w-60" }: { ref?: React.Ref<HTMLInputElement>; value: string; onChange: (value: string) => void; placeholder?: string; /** Its name for readers and tests; the placeholder by default. */ label?: string; className?: string }) {
  return (
    <span className={`relative flex items-center ${className}`}>
      <Icon name="search" className="pointer-events-none absolute left-2 h-4 w-4 text-[var(--muted)]" />
      <input ref={ref} type="search" aria-label={label ?? placeholder ?? t("grid.search")} placeholder={placeholder ?? t("grid.search")} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} w-full pl-7 pr-8`} />
      <kbd className="kbd pointer-events-none absolute right-2 hidden md:inline-flex">/</kbd>
    </span>
  );
}
