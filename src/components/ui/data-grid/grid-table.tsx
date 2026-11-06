import { flexRender, type Column, type Row, type Table } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, type CSSProperties, type KeyboardEvent } from "react";

import { t } from "../../../i18n";
import { NARROW, useMediaQuery } from "../../../lib/media";
import type { Density } from "./types";

const ROW_HEIGHT: Record<Density, number> = { compact: 30, normal: 38 };
/** Fields a card shows under its title; the rest stay in the table of a wider screen. */
const CARD_FIELDS = 6;


/** The rows as cards: the selection box, the first column as the title and the next ones as label and value. */
function GridCards<T>({ table, onOpen, onRowClick, isActive }: { table: Table<T>; onOpen?: (row: T) => void; onRowClick?: (row: T) => void; isActive?: (row: T) => boolean }) {
  const open = onRowClick ?? onOpen;
  return (
    <ul className="flex flex-col gap-2">
      {table.getRowModel().rows.map((row) => {
        const cells = row.getVisibleCells();
        const select = cells.find((cell) => cell.column.id === "_select");
        const [title, ...fields] = cells.filter((cell) => cell.column.id !== "_select");
        const marked = row.getIsSelected() || (isActive?.(row.original) ?? false);
        return (
          <li key={row.id} className={`flex items-start gap-2 rounded border bg-[var(--surface)] p-2.5 ${marked ? "border-[var(--accent)] bg-[var(--row-active)]" : "border-[var(--line)]"}`}>
            {select && <div className="pt-0.5">{flexRender(select.column.columnDef.cell, select.getContext())}</div>}
            <div className={`flex min-w-0 flex-1 flex-col gap-1 ${open ? "cursor-pointer" : ""}`} onClick={open ? () => open(row.original) : undefined}>
              {title && <div className="font-semibold">{flexRender(title.column.columnDef.cell, title.getContext())}</div>}
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-xs">
                {fields.slice(0, CARD_FIELDS).map((cell) => (
                  <div key={cell.id} className="contents">
                    <dt className="text-[var(--muted)]">{typeof cell.column.columnDef.header === "string" ? cell.column.columnDef.header : cell.column.id}</dt>
                    <dd className="truncate">{flexRender(cell.column.columnDef.cell, cell.getContext())}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
/** From here on rows are virtualized; below it every row stays in the DOM, simpler and fully accessible. */
const VIRTUAL_FROM = 80;

/**
 * The body every grid shares: a header that stays on top, sortable headers, widths the user drags, columns pinned to
 * either side, striped rows and long lists virtualized. Keyboard: arrows between rows, Enter opens, Home / End.
 * It renders a real <table>, so rows, cells and their links are what assistive technology and tests expect.
 */
export function GridTable<T>({
  table,
  density,
  onOpen,
  onRowClick,
  isActive,
  rowClass,
  maxHeight,
}: {
  table: Table<T>;
  density: Density;
  onOpen?: (row: T) => void;
  onRowClick?: (row: T) => void;
  isActive?: (row: T) => boolean;
  rowClass?: (row: T) => string;
  /** The grid scrolls inside this height (its header stays visible); without it the page scrolls. */
  maxHeight?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  // On a phone a grid shows cards instead of a table (V1 did the same): nothing to scroll sideways.
  const narrow = useMediaQuery(NARROW);
  const rows = table.getRowModel().rows;
  const height = ROW_HEIGHT[density];
  const virtual = rows.length > VIRTUAL_FROM && Boolean(maxHeight);
  const virtualizer = useVirtualizer({ count: rows.length, getScrollElement: () => box.current, estimateSize: () => height, overscan: 12, enabled: virtual });
  const shown = virtual ? virtualizer.getVirtualItems() : rows.map((_, index) => ({ index, start: index * height }));
  const top = virtual ? (shown[0]?.start ?? 0) : 0;
  const bottom = virtual ? virtualizer.getTotalSize() - ((shown.at(-1)?.start ?? 0) + height) : 0;
  const columns = [...table.getLeftVisibleLeafColumns(), ...table.getCenterVisibleLeafColumns(), ...table.getRightVisibleLeafColumns()];
  const width = columns.reduce((sum, column) => sum + column.getSize(), 0);

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
    else if (event.key === "Enter" && (onOpen || onRowClick)) (onOpen ?? onRowClick)?.(row.original);
    else return;
    event.preventDefault();
  }

  if (narrow) return <GridCards table={table} onOpen={onOpen} onRowClick={onRowClick} isActive={isActive} />;
  return (
    <div ref={box} className="overflow-auto rounded border border-[var(--line)] bg-[var(--surface)]" style={maxHeight ? { maxHeight } : undefined}>
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
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                    className={`relative h-8 border-b border-[var(--line-strong)] bg-[var(--head)] px-2.5 font-semibold whitespace-nowrap text-[var(--muted)] ${right ? "text-right" : ""}`}
                    style={pinned(column, "head")}
                  >
                    {header.isPlaceholder ? null : column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={column.getToggleSortingHandler()}
                        title={t("grid.sortHint")}
                        className={`inline-flex h-full max-w-full items-center gap-1 hover:text-[var(--ink)] ${right ? "flex-row-reverse" : ""} ${sorted ? "text-[var(--ink)]" : ""}`}
                      >
                        <span className="truncate">{flexRender(column.columnDef.header, header.getContext())}</span>
                        <span aria-hidden className={sorted ? "text-[var(--accent)]" : "opacity-30"}>
                          {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : "↕"}
                        </span>
                        {sorted && table.getState().sorting.length > 1 && <span className="text-[10px] text-[var(--accent)]">{column.getSortIndex() + 1}</span>}
                      </button>
                    ) : (
                      flexRender(column.columnDef.header, header.getContext())
                    )}
                    {column.getCanResize() && (
                      <span
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={t("grid.resize")}
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onDoubleClick={() => column.resetSize()}
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
            const active = isActive?.(row.original) ?? false;
            const striped = index % 2 === 1;
            return (
              <tr
                key={row.id}
                data-index={index}
                tabIndex={index === 0 ? 0 : -1}
                aria-selected={isActive ? active : undefined}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                onDoubleClick={onOpen ? () => onOpen(row.original) : undefined}
                onKeyDown={(event) => keyDown(event, row, index)}
                className={`group outline-none ${onRowClick ? "cursor-pointer" : ""} ${active ? "bg-[var(--row-active)]" : striped ? "bg-[var(--row-alt)]" : ""} hover:bg-[var(--row-hover)] focus-visible:shadow-[inset_2px_0_0_var(--accent)] ${rowClass?.(row.original) ?? ""}`}
                style={{ height }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`truncate border-b border-[var(--line)] px-2.5 ${cell.column.columnDef.meta?.align === "right" ? "text-right" : ""}`}
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
