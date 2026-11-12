import { matchesKeyboardEvent } from "@tanstack/react-hotkeys";
import { flexRender, type Column, type Header, type Row, type Table } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState, type CSSProperties, type DragEvent, type KeyboardEvent } from "react";

import { t } from "../../../i18n";
import { NARROW, useMediaQuery } from "../../../lib/media";
import { toHotkey } from "../../../lib/shortcuts";
import { useTokenPx } from "../../../lib/tokens";
import { iconButtonClass } from "../../controls";
import { Icon } from "../icons";
import { Menu, MenuList, useMenu, type MenuItem } from "../menu";
import { ACTIONS_COLUMN, SELECT_COLUMN } from "./arranged-table";
import type { Density } from "./types";

/** Row heights come from the skin and the density (--row-h, --row-h-lg); these are the fallbacks. */
const ROW_FALLBACK: Record<Density, number> = { compact: 30, normal: 38 };
/** Fields a card shows under its title; the rest stay in the table of a wider screen. */
const CARD_FIELDS = 6;
/** From here on rows are virtualized; below it every row stays in the DOM, simpler and fully accessible. */
const VIRTUAL_FROM = 80;
const SPECIAL = new Set([SELECT_COLUMN, ACTIONS_COLUMN]);

export type RowActions<T> = (row: T) => MenuItem[];

/** The rows as cards: the selection box, the first column as the title and the next ones as label and value. */
function GridCards<T>({ table, onOpen, onRowClick, isActive, rowActions }: { table: Table<T>; onOpen?: (row: T) => void; onRowClick?: (row: T) => void; isActive?: (row: T) => boolean; rowActions?: RowActions<T> }) {
  const open = onRowClick ?? onOpen;
  return (
    <ul className="flex flex-col gap-2">
      {table.getRowModel().rows.map((row) => {
        const cells = row.getVisibleCells();
        const select = cells.find((cell) => cell.column.id === SELECT_COLUMN);
        const [title, ...fields] = cells.filter((cell) => !SPECIAL.has(cell.column.id));
        const marked = row.getIsSelected() || (isActive?.(row.original) ?? false);
        const actions = rowActions?.(row.original) ?? [];
        return (
          <li key={row.id} className={`flex items-start gap-2 rounded-[var(--radius-sm)] border bg-[var(--surface)] p-2.5 ${marked ? "border-[var(--accent)] bg-[var(--row-active)]" : "border-[var(--line)]"}`}>
            {select && <div className="pt-0.5">{flexRender(select.column.columnDef.cell, select.getContext())}</div>}
            <div className={`flex min-w-0 flex-1 flex-col gap-1 ${open ? "cursor-pointer" : ""}`} onClick={open ? () => open(row.original) : undefined}>
              {title && <div className="font-semibold">{flexRender(title.column.columnDef.cell, title.getContext())}</div>}
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-xs">
                {fields
                  // A card shows what the record has: an empty field is not a line.
                  .filter((cell) => {
                    const value = cell.getValue();
                    return value !== null && value !== undefined && value !== "";
                  })
                  .slice(0, CARD_FIELDS)
                  .map((cell) => (
                  <div key={cell.id} className="contents">
                    <dt className="text-[var(--muted)]">{typeof cell.column.columnDef.header === "string" ? cell.column.columnDef.header : cell.column.id}</dt>
                    <dd className="truncate">{flexRender(cell.column.columnDef.cell, cell.getContext())}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {actions.length > 0 && <Menu label={t("grid.rowActions")} items={actions} align="right" />}
          </li>
        );
      })}
    </ul>
  );
}

/** Moves `id` next to `target` in the order (before it when dragging from the right, after when from the left). */
export function moveColumn(order: string[], id: string, target: string): string[] {
  if (id === target || !order.includes(id) || !order.includes(target)) return order;
  const from = order.indexOf(id);
  const rest = order.filter((item) => item !== id);
  const to = rest.indexOf(target) + (from < order.indexOf(target) ? 1 : 0);
  rest.splice(to, 0, id);
  return rest;
}

/** The order of the leaf columns as the table shows them (its state, or the definitions when nothing was arranged). */
function currentOrder<T>(table: Table<T>): string[] {
  const state = table.getState().columnOrder;
  const all = table.getAllLeafColumns().map((column) => column.id);
  return state.length ? [...state.filter((id) => all.includes(id)), ...all.filter((id) => !state.includes(id))] : all;
}

/** The menu of a column header: order, pin, hide and width. */
function HeaderMenu<T>({ header, table, onAutosize }: { header: Header<T, unknown>; table: Table<T>; onAutosize: (column: Column<T>) => void }) {
  const column = header.column;
  const sorted = column.getIsSorted();
  const pinned = column.getIsPinned();
  const label = typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;
  const items: MenuItem[] = [
    ...(column.getCanSort()
      ? [
          { id: "asc", label: t("grid.sortAsc"), icon: "arrowUp" as const, checked: sorted === "asc", run: () => column.toggleSorting(false) },
          { id: "desc", label: t("grid.sortDesc"), icon: "arrowDown" as const, checked: sorted === "desc", run: () => column.toggleSorting(true) },
          ...(sorted ? [{ id: "clear", label: t("grid.sortClear"), run: () => column.clearSorting() }] : []),
        ]
      : []),
    ...(column.getCanPin()
      ? [
          { id: "pinLeft", label: t("grid.pinLeft", { column: label }), icon: "pin" as const, separator: true, checked: pinned === "left", run: () => column.pin(pinned === "left" ? false : "left") },
          { id: "pinRight", label: t("grid.pinRight", { column: label }), icon: "pin" as const, checked: pinned === "right", run: () => column.pin(pinned === "right" ? false : "right") },
        ]
      : []),
    { id: "autosize", label: t("grid.autosize"), icon: "columns" as const, separator: true, run: () => onAutosize(column) },
    ...(column.getCanHide() ? [{ id: "hide", label: t("grid.hideColumn"), icon: "eyeOff" as const, run: () => column.toggleVisibility(false) }] : []),
    { id: "reset", label: t("grid.resetColumns"), icon: "undo" as const, separator: true, run: () => (table.resetColumnOrder(), table.resetColumnSizing(), table.resetColumnPinning(), table.resetColumnVisibility()) },
  ];
  const { open, setOpen, box } = useMenu();
  return (
    <div ref={box} className="relative ml-auto flex shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        // Named without the column's caption, so a label query for a field («Precio final») never finds it.
        aria-label={t("grid.columnMenuShort")}
        title={t("grid.columnMenu", { column: label })}
        onClick={() => setOpen(!open)}
        className={`${iconButtonClass} h-5 w-5 opacity-0 group-hover/head:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100`}
      >
        <Icon name="chevronDown" className="h-3.5 w-3.5" />
      </button>
      {open && <MenuList items={items} onClose={() => setOpen(false)} label={t("grid.columnMenu", { column: label })} align="right" className="normal-case tracking-normal" />}
    </div>
  );
}

/**
 * The body every grid shares: a header that stays on top, sortable headers (the arrows always show the way), widths
 * the user drags, columns dragged by their header to reorder them (or Alt ← → on the keyboard), columns pinned to
 * either side, striped rows, long lists virtualized and a menu per column. Keyboard on a row: arrows, Home / End,
 * Enter opens, Space marks, and the keys of its actions (F2, Supr…) run them. It renders a real <table>, so rows,
 * cells and their links are what assistive technology and tests expect.
 */
export function GridTable<T>({
  table,
  density,
  onOpen,
  onRowClick,
  isActive,
  rowClass,
  rowActions,
  onPageKey,
  maxHeight,
  bare,
  fill,
}: {
  table: Table<T>;
  density: Density;
  onOpen?: (row: T) => void;
  onRowClick?: (row: T) => void;
  isActive?: (row: T) => boolean;
  rowClass?: (row: T) => string;
  /** The actions of a row (its «⋯» menu); an action with `keys` also runs from the keyboard on the focused row. */
  rowActions?: RowActions<T>;
  /** PgUp / PgDn on a row: the previous or next page. */
  onPageKey?: (delta: -1 | 1) => void;
  /** The grid scrolls inside this height (its header stays visible); without it the page scrolls. */
  maxHeight?: string;
  /** Without its own border: the card of `ServerGrid`/`DataGrid` draws it. */
  bare?: boolean;
  /** Scrolls inside whatever height its card gives it (the card fills the page). */
  fill?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  // On a phone a grid shows cards instead of a table (V1 did the same): nothing to scroll sideways.
  const narrow = useMediaQuery(NARROW);
  const rows = table.getRowModel().rows;
  const height = useTokenPx(density === "compact" ? "--row-h" : "--row-h-lg", ROW_FALLBACK[density]);
  const virtual = rows.length > VIRTUAL_FROM && (Boolean(maxHeight) || Boolean(fill));
  const virtualizer = useVirtualizer({ count: rows.length, getScrollElement: () => box.current, estimateSize: () => height, overscan: 12, enabled: virtual });
  const shown = virtual ? virtualizer.getVirtualItems() : rows.map((_, index) => ({ index, start: index * height }));
  const top = virtual ? (shown[0]?.start ?? 0) : 0;
  const bottom = virtual ? virtualizer.getTotalSize() - ((shown.at(-1)?.start ?? 0) + height) : 0;
  const columns = [...table.getLeftVisibleLeafColumns(), ...table.getCenterVisibleLeafColumns(), ...table.getRightVisibleLeafColumns()];
  const width = columns.reduce((sum, column) => sum + column.getSize(), 0);
  const [focused, setFocused] = useState(0);
  const [dragged, setDragged] = useState<string | null>(null);
  const [over, setOver] = useState<{ id: string; side: "before" | "after" } | null>(null);

  function focusRow(index: number) {
    if (index < 0 || index >= rows.length) return;
    if (virtual) virtualizer.scrollToIndex(index);
    requestAnimationFrame(() => box.current?.querySelector<HTMLElement>(`tr[data-index="${index}"]`)?.focus());
  }

  function keyDown(event: KeyboardEvent<HTMLTableRowElement>, row: Row<T>, index: number) {
    if (event.target !== event.currentTarget) return; // a link or a control inside the row keeps its own keys
    if (event.key === "ArrowDown") focusRow(index + 1);
    else if (event.key === "ArrowUp") focusRow(index - 1);
    else if (event.key === "Home") focusRow(0);
    else if (event.key === "End") focusRow(rows.length - 1);
    else if (event.key === "PageDown" && onPageKey) onPageKey(1);
    else if (event.key === "PageUp" && onPageKey) onPageKey(-1);
    else if (event.key === "Enter" && (onOpen || onRowClick)) (onOpen ?? onRowClick)?.(row.original);
    else if (event.key === " " && row.getCanSelect()) row.toggleSelected();
    else {
      const action = rowActions?.(row.original).find((item) => item.keys && !item.disabled && matchesStep(event.nativeEvent, item.keys));
      if (!action) return;
      action.run();
    }
    event.preventDefault();
  }

  function move(id: string, target: string) {
    table.setColumnOrder(moveColumn(currentOrder(table), id, target));
  }

  function headerKeys(event: KeyboardEvent<HTMLTableCellElement>, column: Column<T>) {
    if (!event.altKey || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    const order = currentOrder(table).filter((id) => !SPECIAL.has(id) && table.getColumn(id)?.getIsVisible());
    const index = order.indexOf(column.id);
    const target = order[event.key === "ArrowLeft" ? index - 1 : index + 1];
    if (!target) return;
    event.preventDefault();
    move(column.id, target);
    requestAnimationFrame(() => box.current?.querySelector<HTMLElement>(`th[data-col="${column.id}"] button`)?.focus());
  }

  function dragOver(event: DragEvent<HTMLTableCellElement>, column: Column<T>) {
    if (!dragged || dragged === column.id || SPECIAL.has(column.id)) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const side = event.clientX < rect.left + rect.width / 2 ? "before" : "after";
    if (over?.id !== column.id || over.side !== side) setOver({ id: column.id, side });
  }

  function drop(column: Column<T>) {
    if (dragged && dragged !== column.id && !SPECIAL.has(column.id)) {
      const order = currentOrder(table).filter((id) => id !== dragged);
      const at = order.indexOf(column.id) + (over?.side === "after" ? 1 : 0);
      order.splice(at, 0, dragged);
      table.setColumnOrder(order);
    }
    setDragged(null);
    setOver(null);
  }

  /** The widest cell of the column, as measured on the rows shown. */
  function autosize(column: Column<T>) {
    const cells = box.current?.querySelectorAll<HTMLElement>(`td[data-col="${column.id}"] > *, td[data-col="${column.id}"]`) ?? [];
    let widest = 0;
    for (const cell of cells) widest = Math.max(widest, cell.scrollWidth);
    const head = box.current?.querySelector<HTMLElement>(`th[data-col="${column.id}"] .head-label`);
    widest = Math.max(widest, (head?.scrollWidth ?? 0) + 44);
    table.setColumnSizing((sizing) => ({ ...sizing, [column.id]: Math.max(column.columnDef.minSize ?? 48, Math.min(column.columnDef.maxSize ?? 640, widest + 22)) }));
  }

  if (narrow) return <GridCards table={table} onOpen={onOpen} onRowClick={onRowClick} isActive={isActive} rowActions={rowActions} />;
  return (
    <div ref={box} className={`overflow-auto bg-[var(--surface)] ${bare ? "" : "rounded-[var(--radius-sm)] border border-[var(--line)]"} ${fill ? "min-h-0 flex-1" : ""}`} style={maxHeight ? { maxHeight } : undefined}>
      <table className="border-separate border-spacing-0 text-left tabular-nums" style={{ tableLayout: "fixed", width, minWidth: "100%" }}>
        <colgroup>
          {columns.map((column) => (
            <col key={column.id} style={{ width: column.getSize() }} />
          ))}
        </colgroup>
        <thead className="sticky top-0 z-20">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => {
                const column = header.column;
                const sorted = column.getIsSorted();
                const right = column.columnDef.meta?.align === "right";
                const special = SPECIAL.has(column.id);
                const dropSide = over?.id === column.id ? over.side : null;
                return (
                  <th
                    key={header.id}
                    scope="col"
                    data-col={column.id}
                    aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                    draggable={!special}
                    onDragStart={special ? undefined : (event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", column.id);
                      setDragged(column.id);
                    }}
                    onDragOver={(event) => dragOver(event, column)}
                    onDragLeave={() => over?.id === column.id && setOver(null)}
                    onDrop={() => drop(column)}
                    onDragEnd={() => (setDragged(null), setOver(null))}
                    onKeyDown={special ? undefined : (event) => headerKeys(event, column)}
                    title={special ? undefined : t("grid.dragColumn")}
                    className={`label group/head relative h-[var(--control-h)] border-b border-[var(--line-strong)] bg-[var(--head)] px-2.5 whitespace-nowrap ${special ? "" : "cursor-grab"} ${dragged === column.id ? "opacity-40" : ""} ${dropSide === "before" ? "shadow-[inset_2px_0_0_var(--accent)]" : dropSide === "after" ? "shadow-[inset_-2px_0_0_var(--accent)]" : ""}`}
                    style={pinned(column, "head")}
                  >
                    <div className={`flex h-full items-center gap-1 ${right ? "flex-row-reverse" : ""}`}>
                      {header.isPlaceholder ? null : column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={column.getToggleSortingHandler()}
                          title={t("grid.sortHint")}
                          className={`head-label inline-flex h-full min-w-0 items-center gap-1 hover:text-[var(--ink)] ${right ? "flex-row-reverse" : ""} ${sorted ? "text-[var(--ink)]" : ""}`}
                        >
                          <span className="truncate">{flexRender(column.columnDef.header, header.getContext())}</span>
                          <span aria-hidden className={`inline-flex shrink-0 ${sorted ? "text-[var(--accent)]" : "opacity-30"}`}>
                            <Icon name={sorted === "asc" ? "arrowUp" : sorted === "desc" ? "arrowDown" : "sortNone"} className="h-3.5 w-3.5" />
                          </span>
                          {sorted && table.getState().sorting.length > 1 && <span className="num text-[10px] text-[var(--accent)]">{column.getSortIndex() + 1}</span>}
                        </button>
                      ) : (
                        <span className="head-label min-w-0 truncate">{flexRender(column.columnDef.header, header.getContext())}</span>
                      )}
                      {!special && <HeaderMenu header={header} table={table} onAutosize={autosize} />}
                    </div>
                    {column.getCanResize() && (
                      <span
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={t("grid.resize")}
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onDoubleClick={() => autosize(column)}
                        className={`absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none hover:bg-[var(--accent)] ${column.getIsResizing() ? "bg-[var(--accent)]" : ""}`}
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {top > 0 && <tr aria-hidden style={{ height: top }} />}
          {shown.map(({ index }) => {
            const row = rows[index];
            if (!row) return null;
            const active = (isActive?.(row.original) ?? false) || row.getIsSelected();
            const striped = index % 2 === 1;
            return (
              <tr
                key={row.id}
                data-index={index}
                tabIndex={index === focused ? 0 : -1}
                onFocus={(event) => event.target === event.currentTarget && setFocused(index)}
                aria-selected={isActive || row.getCanSelect() ? active : undefined}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                onDoubleClick={onOpen ? () => onOpen(row.original) : undefined}
                onKeyDown={(event) => keyDown(event, row, index)}
                className={`group outline-none ${onRowClick ? "cursor-pointer" : ""} ${active ? "bg-[var(--row-active)] [&>td:first-child]:shadow-[inset_2px_0_0_var(--accent)]" : striped ? "bg-[var(--row-alt)]" : ""} hover:bg-[var(--row-hover)] focus-visible:shadow-[inset_2px_0_0_var(--accent)] ${rowClass?.(row.original) ?? ""}`}
                style={{ height }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    data-col={cell.column.id}
                    className={`truncate border-b border-[var(--line)] px-2.5 [border-bottom-style:var(--row-border-style)] ${cell.column.columnDef.meta?.align === "right" ? "num text-right" : ""} ${cell.column.columnDef.meta?.code ? "code" : ""}`}
                    style={pinned(cell.column, active ? "active" : striped ? "striped" : "row")}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
          {bottom > 0 && <tr aria-hidden style={{ height: bottom }} />}
        </tbody>
      </table>
    </div>
  );
}

/** Whether a key event is the kit's text of a key ("f2", "del", "d"), through TanStack's matcher. */
function matchesStep(event: globalThis.KeyboardEvent, keys: string): boolean {
  const hotkey = toHotkey(keys);
  return typeof hotkey === "string" && matchesKeyboardEvent(event, hotkey as never);
}

const PINNED_GROUND = { head: "var(--head)", row: "var(--surface)", striped: "var(--row-alt)", active: "var(--row-active)" };

/** Pinned columns stick to their side over the row's own ground, so nothing shows through while scrolling. */
function pinned<T>(column: Column<T>, ground: keyof typeof PINNED_GROUND): CSSProperties | undefined {
  const side = column.getIsPinned();
  if (!side) return undefined;
  const edge = side === "left" ? column.getIsLastColumn("left") : column.getIsFirstColumn("right");
  return {
    position: "sticky",
    left: side === "left" ? column.getStart("left") : undefined,
    right: side === "right" ? column.getAfter("right") : undefined,
    zIndex: ground === "head" ? 21 : 10,
    background: PINNED_GROUND[ground],
    boxShadow: edge ? (side === "left" ? "inset -1px 0 0 var(--line-strong)" : "inset 1px 0 0 var(--line-strong)") : undefined,
  };
}
