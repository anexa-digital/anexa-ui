// Where the focus goes in a grid of editable cells. Pure: the grid tells which cells can take focus, this answers
// the next one. Rows and columns are indexes; the draft row (where a new line is typed) is the last row.

export type Cell = { row: number; column: number };
export type Move = "next" | "previous" | "up" | "down";

/** `editable(row, column)` says whether that cell takes focus. `rows` and `columns` are the grid's sizes. */
export function nextCell(from: Cell, move: Move, rows: number, columns: number, editable: (row: number, column: number) => boolean): Cell | null {
  if (move === "up" || move === "down") {
    const step = move === "up" ? -1 : 1;
    for (let row = from.row + step; row >= 0 && row < rows; row += step) {
      if (editable(row, from.column)) return { row, column: from.column };
    }
    return null;
  }
  // Reading order, wrapping to the next (or previous) row: Enter walks the grid like a form.
  const step = move === "next" ? 1 : -1;
  let index = from.row * columns + from.column + step;
  for (; index >= 0 && index < rows * columns; index += step) {
    const row = Math.floor(index / columns);
    const column = index % columns;
    if (editable(row, column)) return { row, column };
  }
  return null;
}
