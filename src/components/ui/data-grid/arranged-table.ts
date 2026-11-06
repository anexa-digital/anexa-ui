import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type ColumnDef,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
  type Updater,
  type VisibilityState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { defaultPreferences, usePreferences } from "./preferences";
import type { GridColumn, View } from "./types";

/** The checkbox column of a grid with selection: always first, pinned left, never in the columns panel. */
export const SELECT_COLUMN = "_select";

const apply = <S>(updater: Updater<S>, current: S): S => (typeof updater === "function" ? (updater as (old: S) => S)(current) : updater);

/** The plain text of a cell: its column's `meta.text`, else its value. */
export function cellText<T>(column: GridColumn<T>, row: T): string | number | null | undefined {
  if (column.meta?.text) return column.meta.text(row);
  const accessor = (column as { accessorKey?: string }).accessorKey;
  const value = accessor ? (row as Record<string, unknown>)[accessor] : undefined;
  return typeof value === "string" || typeof value === "number" ? value : undefined;
}

/**
 * A TanStack table arranged as the user left it (columns shown, order, widths, pinning, density, saved views),
 * sorted either here (client) or by the server, optionally filtered by a quick search and paged here.
 */
export function useArrangedTable<T>({
  grid,
  rows,
  columns,
  getRowId,
  server,
  search = "",
  pageSize,
  selection,
}: {
  grid: string;
  rows: T[];
  columns: GridColumn<T>[];
  getRowId?: (row: T, index: number) => string;
  /** Sorting done by the server: the table only shows it and reports changes. */
  server?: { sorting: SortingState; onSortingChange: (sorting: SortingState) => void; sortable: (id: string) => boolean };
  search?: string;
  pageSize?: number;
  /** Rows marked by the user: the checkbox column (built by the caller) and the state it keeps. */
  selection?: { column: ColumnDef<T, unknown>; state: RowSelectionState; onChange: (state: RowSelectionState) => void };
}) {
  const defaults = useMemo(() => defaultPreferences(columns), [columns]);
  const { preferences, change, reset } = usePreferences(grid, defaults);
  const [localSorting, setLocalSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const sorting = server ? server.sorting : localSorting;
  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = apply(updater, sorting);
    if (server) server.onSortingChange(next);
    else setLocalSorting(next);
  };
  // TanStack sorts (and lets a header sort) only columns with a value: a display column takes its plain text.
  const sortable = server?.sortable;
  const selectColumn = selection?.column;
  const shown = useMemo(
    () => [
      ...(selectColumn ? [selectColumn] : []),
      ...columns.map((column) => ({
        ...column,
        ...("accessorFn" in column || "accessorKey" in column ? {} : { accessorFn: (row: T) => cellText(column, row) ?? "" }),
        ...(sortable ? { enableSorting: column.enableSorting !== false && sortable(column.id) } : {}),
      })),
    ],
    [columns, sortable, selectColumn],
  );
  const order = selection ? [SELECT_COLUMN, ...preferences.order] : preferences.order;
  const pinning = selection ? { ...preferences.pinning, left: [SELECT_COLUMN, ...(preferences.pinning.left ?? [])] } : preferences.pinning;

  const table = useReactTable<T>({
    data: rows,
    columns: shown,
    getRowId,
    state: {
      sorting,
      columnVisibility: preferences.visibility,
      columnOrder: order,
      columnSizing: preferences.sizing,
      columnPinning: pinning,
      rowSelection: selection?.state ?? {},
      globalFilter: search,
      ...(pageSize ? { pagination: { pageIndex, pageSize } } : {}),
    },
    onSortingChange,
    onColumnVisibilityChange: (updater) => change({ visibility: apply<VisibilityState>(updater, preferences.visibility) }),
    onColumnOrderChange: (updater) => change({ order: apply<ColumnOrderState>(updater, order).filter((id) => id !== SELECT_COLUMN) }),
    onColumnSizingChange: (updater) => change({ sizing: apply<ColumnSizingState>(updater, preferences.sizing) }),
    onColumnPinningChange: (updater) => {
      const next = apply<ColumnPinningState>(updater, pinning);
      change({ pinning: { left: (next.left ?? []).filter((id) => id !== SELECT_COLUMN), right: next.right ?? [] } });
    },
    onRowSelectionChange: (updater) => selection?.onChange(apply(updater, selection.state)),
    enableRowSelection: Boolean(selection),
    onPaginationChange: (updater) => setPageIndex(apply(updater, { pageIndex, pageSize: pageSize ?? 0 }).pageIndex),
    manualSorting: Boolean(server),
    enableMultiSort: true,
    isMultiSortEvent: (event) => (event as MouseEvent).shiftKey,
    globalFilterFn: (row, _columnId, value: string) => {
      const words = value.toLowerCase().split(/\s+/).filter(Boolean);
      const text = columns.map((column) => String(cellText(column, row.original) ?? "")).join(" ").toLowerCase();
      return words.every((word) => text.includes(word));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: server ? undefined : getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pageSize ? getPaginationRowModel() : undefined,
    autoResetPageIndex: true,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    defaultColumn: { size: 150, minSize: 48, maxSize: 640 },
  });

  const views = {
    list: preferences.views,
    save: (name: string) =>
      change({
        views: [
          ...preferences.views.filter((view) => view.name !== name),
          { name, visibility: preferences.visibility, order: preferences.order, pinning: preferences.pinning, sorting },
        ],
      }),
    apply: (view: View) => {
      change({ visibility: view.visibility, order: view.order, pinning: view.pinning });
      onSortingChange(view.sorting);
    },
    remove: (name: string) => change({ views: preferences.views.filter((view) => view.name !== name) }),
  };

  return { table, preferences, change, reset, views, page: { index: pageIndex, set: setPageIndex } };
}
