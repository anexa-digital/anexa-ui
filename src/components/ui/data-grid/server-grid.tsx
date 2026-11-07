import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, Row, RowSelectionState, SortingState, Table } from "@tanstack/react-table";
import { useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";

import { t } from "../../../i18n";
import { errorMessage } from "../../../lib/errors";
import { buttonClass } from "../../controls";
import { Pager } from "../pager";
import { Toolbar } from "../toolbar";
import { EmptyState } from "../widgets";
import { KeysHint } from "./keys-hint";
import { SELECT_COLUMN, useArrangedTable } from "./arranged-table";
import { ColumnsPanel } from "./columns-panel";
import { BulkActions, type BulkAction } from "./bulk-actions";
import { exportFile } from "./data-grid";
import { ExportMenu } from "./export-menu";
import { GridTable } from "./grid-table";
import type { ListGroup } from "./list-filters";
import type { GridColumn } from "./types";
import { ViewsPanel } from "./views-panel";

/** What the user marked: rows of any page, or every row the filters match (`all`; actions then use the filters). */
export type Selection<T> = { rows: T[]; all: boolean; total: number; clear: () => void };

/** Grouping of a server list: the groups of the whole filtered list, and how to load one group's first rows. */
export type Grouping<T> = {
  field: string;
  fieldLabel: string;
  groups: ListGroup[];
  label: (value: string | null) => string;
  /** The first rows of a group (the page asks the server for that group's filter). */
  load: (value: string | null) => Promise<T[]>;
  /** Changes whenever the list's filters or order change, so the open groups reload. */
  key: string;
  /** Leave grouping and keep only this group, as a filter of the flat list. */
  onSeeAll: (value: string | null) => void;
};

/** Rows a group shows before sending the user to the flat list (filtered by that group). */
export const PER_GROUP = 100;
/** The most rows an export of the whole filtered list carries (the page reads them 200 at a time). */
export const EXPORT_LIMIT = 5000;
const MAX_GROUPS = 200;

type RowEvents<T> = { onOpen?: (row: T) => void; onRowClick?: (row: T) => void; isActive?: (row: T) => boolean; rowClass?: (row: T) => string };

/** The checkbox of a row: Shift+click marks the range from the last checkbox touched. */
function checkboxColumn<T>(last: { current: number | null }): ColumnDef<T, unknown> {
  return {
    id: SELECT_COLUMN,
    size: 34,
    enableSorting: false,
    enableResizing: false,
    enableHiding: false,
    header: ({ table }: { table: Table<T> }) => (
      <input
        type="checkbox"
        aria-label={t("grid.selectPage")}
        className="h-3.5 w-3.5 align-middle"
        checked={table.getIsAllPageRowsSelected()}
        ref={(box) => {
          if (box) box.indeterminate = table.getIsSomePageRowsSelected();
        }}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
      />
    ),
    cell: ({ row, table }: { row: Row<T>; table: Table<T> }) => {
      function click(event: MouseEvent<HTMLInputElement>) {
        const rows = table.getRowModel().rows;
        const here = rows.findIndex((item) => item.id === row.id);
        if (event.shiftKey && last.current !== null && last.current !== here) {
          const [from, to] = [Math.min(last.current, here), Math.max(last.current, here)];
          const value = !row.getIsSelected();
          table.setRowSelection((previous) => {
            const next = { ...previous };
            for (const item of rows.slice(from, to + 1)) {
              if (value) next[item.id] = true;
              else delete next[item.id];
            }
            return next;
          });
        } else {
          row.toggleSelected();
        }
        last.current = here;
      }
      return (
        <input
          type="checkbox"
          aria-label={t("grid.selectRow")}
          className="h-3.5 w-3.5 align-middle"
          checked={row.getIsSelected()}
          onClick={click}
          onChange={() => undefined}
          onKeyDown={(event) => event.stopPropagation()}
        />
      );
    },
  };
}

/** One group, folded or open; open, it loads its first rows and shows them with the grid's own columns and order. */
function GroupSection<T>({
  grid,
  grouping,
  group,
  columns,
  getRowId,
  sorting,
  onSortingChange,
  sortable,
  events,
}: {
  grid: string;
  grouping: Grouping<T>;
  group: ListGroup;
  columns: GridColumn<T>[];
  getRowId: (row: T, index: number) => string;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  sortable: (id: string) => boolean;
  events: RowEvents<T>;
}) {
  const rows = useQuery({
    queryKey: [grid, "group", grouping.field, group.value, grouping.key],
    queryFn: () => grouping.load(group.value),
  });
  const { table, preferences } = useArrangedTable({ grid, rows: rows.data ?? [], columns, getRowId, server: { sorting, onSortingChange, sortable } });
  if (rows.isPending) return <p className="px-6 py-2 text-[var(--muted)]">{t("common.loading")}</p>;
  if (rows.isError) return <p className="px-6 py-2 text-[var(--bad)]">{errorMessage(rows.error)}</p>;
  return (
    <div className="flex flex-col gap-1 py-1 pl-6">
      <GridTable table={table} density={preferences.density} maxHeight="420px" {...events} />
      {group.total > PER_GROUP && (
        <button type="button" onClick={() => grouping.onSeeAll(group.value)} className="h-[var(--control-h)] self-start text-xs text-[var(--accent)] hover:underline">
          {t("grid.groupShown", { shown: PER_GROUP, total: group.total.toLocaleString("es-CO") })}
        </button>
      )}
    </div>
  );
}

function GroupSections<T>(props: Omit<Parameters<typeof GroupSection<T>>[0], "group">) {
  const { grouping } = props;
  const [open, setOpen] = useState<Set<string>>(new Set());
  const key = (group: ListGroup) => group.value ?? "\u0000";
  const toggle = (group: ListGroup) =>
    setOpen((previous) => {
      const next = new Set(previous);
      if (next.has(key(group))) next.delete(key(group));
      else next.add(key(group));
      return next;
    });
  if (grouping.groups.length === 0) return <p className="text-[var(--muted)]">{t("grid.noMatches")}</p>;
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)]">
      <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--head)] px-3 py-1.5 text-xs text-[var(--muted)]">
        <span>
          {grouping.groups.length >= MAX_GROUPS
            ? t("grid.groupsTop", { count: MAX_GROUPS, field: grouping.fieldLabel.toLowerCase() })
            : grouping.groups.length === 1
              ? t("grid.groupsOne", { field: grouping.fieldLabel.toLowerCase() })
              : t("grid.groupsCount", { count: grouping.groups.length, field: grouping.fieldLabel.toLowerCase() })}
        </span>
        <button type="button" onClick={() => setOpen(new Set(grouping.groups.map(key)))} className="h-5 text-[var(--accent)] hover:underline">
          {t("grid.expandAll")}
        </button>
        <button type="button" onClick={() => setOpen(new Set())} className="h-5 text-[var(--accent)] hover:underline">
          {t("grid.collapseAll")}
        </button>
      </div>
      {grouping.groups.map((group) => {
        const expanded = open.has(key(group));
        return (
          <section key={key(group)} className="border-b border-[var(--line)] last:border-b-0">
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => toggle(group)}
              className="flex h-[var(--control-h)] w-full items-center gap-2 px-3 text-left hover:bg-[var(--row-hover)]"
            >
              <span aria-hidden className="w-3 text-[var(--muted)]">
                {expanded ? "▾" : "▸"}
              </span>
              <span className="font-semibold">{grouping.label(group.value)}</span>
              <span className="rounded-[var(--radius-pill)] bg-[var(--head)] px-1.5 text-xs tabular-nums text-[var(--muted)]">{group.total.toLocaleString("es-CO")}</span>
            </button>
            {expanded && <GroupSection {...props} group={group} />}
          </section>
        );
      })}
    </div>
  );
}

/**
 * A grid over one page of a server list: the server sorts and pages, the grid shows the order and lets the
 * user change it from the headers, arranges the columns and, as V1's grid did, marks rows (Shift for a range, every
 * row the filters match) and shows a grouped list as sections that load when opened. Filters live in the toolbar.
 */
export function ServerGrid<T>({
  grid,
  rows,
  total,
  columns,
  getRowId,
  empty,
  sorting,
  onSortingChange,
  sortable,
  page,
  pageSize,
  onPage,
  onPageSize,
  exportName,
  exportAll,
  selectable = false,
  bulkActions,
  actions,
  rowLabel,
  onActionsDone,
  grouping,
  onRefresh,
  updatedAt,
  refreshing,
  toolbar,
  maxHeight,
  ...events
}: {
  grid: string;
  rows: T[];
  total: number;
  columns: GridColumn<T>[];
  getRowId: (row: T, index: number) => string;
  empty: string;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  sortable: (id: string) => boolean;
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
  exportName?: string;
  /** Every row of the filtered list, for the CSV export (the page caps it). */
  exportAll?: () => Promise<T[]>;
  /** A checkbox per row, a «mark the page» box and a selection bar. */
  selectable?: boolean;
  /** Anything else for the selection bar, given the selection. */
  bulkActions?: (selection: Selection<T>) => ReactNode;
  /** Actions over the selected rows, run row by row with confirmation and a report (see BulkAction). */
  actions?: BulkAction<T>[];
  /** How a row is named in the report of an action (its code). */
  rowLabel?: (row: T) => string;
  /** After an action: reload the list. */
  onActionsDone?: () => void;
  /** When the list is grouped: sections instead of pages. */
  grouping?: Grouping<T> | null;
  onRefresh?: () => void;
  updatedAt?: number;
  refreshing?: boolean;
  toolbar?: ReactNode;
  maxHeight?: string;
} & RowEvents<T>) {
  const last = useRef<number | null>(null);
  const remembered = useRef(new Map<string, T>());
  const [marked, setMarked] = useState<RowSelectionState>({});
  const [all, setAll] = useState(false);
  const column = useMemo(() => checkboxColumn<T>(last), []);
  for (const [index, row] of rows.entries()) if (marked[getRowId(row, index)]) remembered.current.set(getRowId(row, index), row);
  const { table, preferences, change, reset, views } = useArrangedTable({
    grid,
    rows,
    columns,
    getRowId,
    server: { sorting, onSortingChange, sortable },
    selection: selectable && !grouping ? { column, state: marked, onChange: (next) => (setMarked(next), setAll(false)) } : undefined,
  });
  const visible = new Set(table.getVisibleLeafColumns().map((item) => item.id));
  const count = Object.keys(marked).length;
  const clear = () => {
    setMarked({});
    setAll(false);
    remembered.current.clear();
  };
  const selection: Selection<T> = {
    rows: Object.keys(marked).flatMap((id) => {
      const row = remembered.current.get(id);
      return row ? [row] : [];
    }),
    all,
    total: all ? total : count,
    clear,
  };

  const allDetail =
    total > EXPORT_LIMIT
      ? t("grid.exportFirst", { count: EXPORT_LIMIT.toLocaleString("es-CO"), total: total.toLocaleString("es-CO") })
      : t("grid.exportAll", { total: total.toLocaleString("es-CO") });

  return (
    <section className="flex flex-col rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)]">
      <Toolbar
        className="border-b border-[var(--line)] px-2.5 py-2"
        right={
          <>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              aria-label={t("grid.refresh")}
              title={updatedAt ? t("grid.updatedAt", { time: new Date(updatedAt).toLocaleTimeString("es-CO") }) : t("grid.refresh")}
              className={`${buttonClass} flex items-center gap-1.5`}
            >
              <span aria-hidden className={refreshing ? "inline-block animate-spin" : "inline-block"}>
                ↻
              </span>
              {updatedAt ? <span className="hidden text-xs text-[var(--muted)] lg:inline">{new Date(updatedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</span> : null}
            </button>
          )}
          {exportName && exportAll && (
            <ExportMenu
              label={t("grid.export")}
              detail={allDetail}
              disabled={total === 0}
              onExport={async (format) => exportFile(format, exportName, columns, visible, await exportAll())}
            />
          )}
          <ViewsPanel views={views.list} onSave={views.save} onApply={views.apply} onDelete={views.remove} />
          <ColumnsPanel columns={columns} preferences={preferences} onChange={change} onReset={reset} />
          </>
        }
      >
        {toolbar}
      </Toolbar>
      {selectable && (count > 0 || all) && (
        <div role="status" className="flex flex-wrap items-center gap-3 border-b border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1.5">
          <strong className="text-[var(--accent)]">
            {all ? t("grid.allMatching", { count: total.toLocaleString("es-CO") }) : t("grid.selected", { count })}
          </strong>
          {!all && total > count && (
            <button type="button" onClick={() => setAll(true)} className="text-[var(--accent)] hover:underline">
              {t("grid.markAll", { count: total.toLocaleString("es-CO") })}
            </button>
          )}
          {exportName && (
            <ExportMenu
              label={t("grid.exportSelection")}
              detail={all ? allDetail : t("grid.exportSelected", { count })}
              onExport={async (format) => exportFile(format, `${exportName}-seleccion`, columns, visible, all && exportAll ? await exportAll() : selection.rows)}
            />
          )}
          {actions && actions.length > 0 && (
            <BulkActions
              actions={actions}
              rows={selection.rows}
              all={all}
              rowLabel={rowLabel ?? ((row) => getRowId(row, 0))}
              onDone={() => {
                clear();
                onActionsDone?.();
              }}
            />
          )}
          {bulkActions?.(selection)}
          <button type="button" onClick={clear} className="ml-auto text-[var(--muted)] hover:text-[var(--ink)]">
            {t("grid.clearSelection")}
          </button>
        </div>
      )}
      {grouping ? (
        <div className="p-2">
          <GroupSections grid={grid} grouping={grouping} columns={columns} getRowId={getRowId} sorting={sorting} onSortingChange={onSortingChange} sortable={sortable} events={events} />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-3">
          <EmptyState title={empty} />
        </div>
      ) : (
        <GridTable table={table} density={preferences.density} maxHeight={maxHeight} bare {...events} />
      )}
      {!grouping && total > 0 && (
        <div className="border-t border-[var(--line)] px-2.5 py-1.5">
          <Pager page={page} pageSize={pageSize} total={total} onPage={onPage} onPageSize={onPageSize} hint={<KeysHint open={Boolean(events.onOpen || events.onRowClick)} />} />
        </div>
      )}
    </section>
  );
}
