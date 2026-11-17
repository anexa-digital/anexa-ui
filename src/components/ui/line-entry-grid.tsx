import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { t } from "../../i18n";
import { nextCell, type Move } from "../../lib/cell-nav";
import { iconButtonClass } from "../controls";
import { Icon } from "./icons";
import { cellClass, headClass, tableClass } from "./layout";

// Lines typed one after another without leaving the keyboard (the detail of an order, the fractions of a load):
// every editable cell is a field, Enter walks them in reading order like a form, the arrows move between lines,
// and the last row is the draft where the next line is written. The DataGrid moves by rows and opens a record;
// this one is for entering many short records fast.

export type EntryOption = { value: string; label: string };

export type EntryColumn<Row> = {
  id: string;
  header: string;
  /** The cell's text: what is shown, and what the field starts with. */
  value: (row: Row) => string;
  /** Shown instead of the raw value in a read-only cell (a formatted number, a badge). */
  render?: (row: Row) => ReactNode;
  /** Whether the person may change it; a function decides per row. Read-only by default. */
  editable?: boolean | ((row: Row) => boolean);
  /** A list to choose from; without it the cell is a text field. */
  options?: EntryOption[];
  /** `decimal` asks the numeric keypad and aligns right. */
  input?: "text" | "decimal";
  align?: "left" | "right";
  /** CSS width of the column ("8rem", "20%"). */
  width?: string;
  /** Part of the draft row. Columns left out show `draftPlaceholder` there (a value the system will fill). */
  draft?: boolean;
  draftPlaceholder?: string;
  placeholder?: string;
};

export type EntryDraft = {
  values: Record<string, string>;
  onChange: (columnId: string, value: string) => void;
  /** Enter on the draft's last field: add the line. */
  onSubmit: () => void;
  /** Says what the draft is waiting for, under the grid («Elige un material»). */
  status?: ReactNode;
  disabled?: boolean;
};

const fieldClass =
  "h-[var(--control-h)] w-full min-w-0 rounded-[var(--radius-sm)] border border-transparent bg-transparent px-1.5 hover:border-[var(--line)] focus:border-[var(--line-strong)] focus:bg-[var(--field)] disabled:opacity-60";

export function LineEntryGrid<Row>({
  label,
  rows,
  columns,
  rowKey,
  onCommit,
  onRemove,
  draft,
  readOnly = false,
  empty,
  className = "",
}: {
  /** The grid's accessible name. */
  label: string;
  rows: Row[];
  columns: EntryColumn<Row>[];
  rowKey: (row: Row) => string;
  /** A cell was changed and left. Rejecting keeps the typed text in the cell so it can be corrected. */
  onCommit?: (row: Row, columnId: string, value: string) => void | Promise<void>;
  /** Ctrl/⌘ ⌫ on a line, or its button. */
  onRemove?: (row: Row) => void;
  draft?: EntryDraft;
  readOnly?: boolean;
  /** Shown when there are no lines and no draft. */
  empty?: ReactNode;
  className?: string;
}) {
  const body = useRef<HTMLTableSectionElement>(null);
  // Text being typed in a cell, by "rowKey:columnId", until it is committed or abandoned.
  const [editing, setEditing] = useState<Record<string, string>>({});
  const rowCount = rows.length + (draft ? 1 : 0);

  const canEdit = (rowIndex: number, columnIndex: number) => {
    const column = columns[columnIndex];
    if (!column || readOnly) return false;
    if (rowIndex === rows.length) return Boolean(draft && column.draft && !draft.disabled);
    const row = rows[rowIndex];
    if (row === undefined) return false;
    return typeof column.editable === "function" ? column.editable(row) : Boolean(column.editable);
  };

  const focusCell = (row: number, column: number) => {
    const field = body.current?.querySelector<HTMLElement>(`[data-cell="${row}:${column}"]`);
    field?.focus();
    if (field instanceof HTMLInputElement) field.select();
  };

  const commit = async (row: Row, column: EntryColumn<Row>) => {
    const key = `${rowKey(row)}:${column.id}`;
    const typed = editing[key];
    if (typed === undefined) return;
    if (typed.trim() === column.value(row).trim()) {
      setEditing(({ [key]: _same, ...rest }) => rest);
      return;
    }
    try {
      await onCommit?.(row, column.id, typed.trim());
      setEditing(({ [key]: _done, ...rest }) => rest);
    } catch {
      // The app reports the reason (a toast, a message); the text stays so the person can fix it.
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>, rowIndex: number, columnIndex: number) => {
    const isDraft = rowIndex === rows.length;
    const row = rows[rowIndex];
    let move: Move | null = null;
    if (event.key === "Enter") move = event.shiftKey ? "previous" : "next";
    // A list keeps its own arrows: they change the choice.
    else if (event.key === "ArrowDown" && !(event.target instanceof HTMLSelectElement)) move = "down";
    else if (event.key === "ArrowUp" && !(event.target instanceof HTMLSelectElement)) move = "up";
    else if (event.key === "Escape" && row !== undefined) {
      const column = columns[columnIndex];
      if (column) setEditing(({ [`${rowKey(row)}:${column.id}`]: _dropped, ...rest }) => rest);
      return;
    } else if (event.key === "Backspace" && (event.ctrlKey || event.metaKey) && row !== undefined && onRemove) {
      event.preventDefault();
      onRemove(row);
      return;
    }
    if (move === null) return;
    event.preventDefault();
    const target = nextCell({ row: rowIndex, column: columnIndex }, move, rowCount, columns.length, canEdit);
    if (isDraft && move === "next" && (target === null || target.row !== rowIndex)) {
      draft?.onSubmit();
      return;
    }
    if (target) focusCell(target.row, target.column);
  };

  const field = (rowIndex: number, columnIndex: number, column: EntryColumn<Row>, value: string, change: (value: string) => void, blur?: () => void) => {
    const shared = {
      "data-cell": `${rowIndex}:${columnIndex}`,
      "aria-label": column.header,
      value,
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => onKeyDown(event, rowIndex, columnIndex),
      onBlur: blur,
    };
    if (column.options) {
      return (
        <select {...shared} onChange={(event) => change(event.target.value)} className={fieldClass}>
          <option value="">{column.placeholder ?? "—"}</option>
          {column.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }
    const numeric = column.input === "decimal";
    return (
      <input
        {...shared}
        type="text"
        inputMode={numeric ? "decimal" : undefined}
        autoComplete="off"
        placeholder={column.placeholder}
        onChange={(event) => change(event.target.value)}
        className={`${fieldClass} ${numeric || column.align === "right" ? "num text-right" : ""}`}
      />
    );
  };

  const alignOf = (column: EntryColumn<Row>) => (column.align === "right" || column.input === "decimal" ? "text-right" : "text-left");

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--line)]">
        <table aria-label={label} className={`${tableClass} w-full`}>
          <thead>
            <tr>
              <th scope="col" className={`${headClass} w-10 text-right`}>
                #
              </th>
              {columns.map((column) => (
                <th key={column.id} scope="col" style={{ width: column.width }} className={`${headClass} ${alignOf(column)}`}>
                  {column.header}
                </th>
              ))}
              {onRemove && !readOnly && <th scope="col" className={`${headClass} w-10`} aria-label={t("ui.remove")} />}
            </tr>
          </thead>
          <tbody ref={body}>
            {rows.map((row, rowIndex) => (
              <tr key={rowKey(row)} className="border-t border-[var(--line)]">
                <td className={`${cellClass} num text-right text-[var(--muted)]`}>{rowIndex + 1}</td>
                {columns.map((column, columnIndex) => {
                  const key = `${rowKey(row)}:${column.id}`;
                  return (
                    <td key={column.id} className={`${canEdit(rowIndex, columnIndex) ? "p-0.5" : cellClass} ${alignOf(column)}`}>
                      {canEdit(rowIndex, columnIndex)
                        ? field(
                            rowIndex,
                            columnIndex,
                            column,
                            editing[key] ?? column.value(row),
                            (value) => {
                              // A choice is complete the moment it is made; a text is committed on leaving.
                              if (column.options) void Promise.resolve(onCommit?.(row, column.id, value)).catch(() => undefined);
                              else setEditing((all) => ({ ...all, [key]: value }));
                            },
                            column.options ? undefined : () => void commit(row, column),
                          )
                        : (column.render?.(row) ?? <span className={column.input === "decimal" ? "num" : ""}>{column.value(row)}</span>)}
                    </td>
                  );
                })}
                {onRemove && !readOnly && (
                  <td className="p-0.5 text-center">
                    <button type="button" onClick={() => onRemove(row)} aria-label={t("entry.removeLine", { line: rowIndex + 1 })} title={t("entry.removeLine", { line: rowIndex + 1 })} className={iconButtonClass}>
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {draft && !readOnly && (
              <tr className="border-t border-[var(--line-strong)] bg-[var(--row-alt)]" data-draft>
                <td className={`${cellClass} text-right text-[var(--accent)]`} aria-label={t("entry.newLine")}>
                  +
                </td>
                {columns.map((column, columnIndex) => (
                  <td key={column.id} className={`${column.draft ? "p-0.5" : cellClass} ${alignOf(column)}`}>
                    {column.draft ? (
                      field(rows.length, columnIndex, column, draft.values[column.id] ?? "", (value) => draft.onChange(column.id, value))
                    ) : (
                      <span className="text-[var(--muted)]">{column.draftPlaceholder ?? ""}</span>
                    )}
                  </td>
                ))}
                {onRemove && <td />}
              </tr>
            )}
            {rowCount === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className={`${cellClass} py-6 text-center text-[var(--muted)]`}>
                  {empty ?? t("entry.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {draft?.status && !readOnly && (
        <p role="status" className="text-xs text-[var(--muted)]">
          {draft.status}
        </p>
      )}
    </div>
  );
}
