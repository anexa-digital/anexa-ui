import { expect, test } from "bun:test";

import { nextCell } from "./cell-nav";

// 3 rows × 4 columns; column 0 is never editable, and row 1 has column 2 locked.
const editable = (row: number, column: number) => column !== 0 && !(row === 1 && column === 2);
const move = (row: number, column: number, direction: Parameters<typeof nextCell>[1]) => nextCell({ row, column }, direction, 3, 4, editable);

test("next walks the row and wraps to the first editable cell of the next one", () => {
  expect(move(0, 1, "next")).toEqual({ row: 0, column: 2 });
  expect(move(0, 3, "next")).toEqual({ row: 1, column: 1 });
});

test("next skips a locked cell", () => {
  expect(move(1, 1, "next")).toEqual({ row: 1, column: 3 });
});

test("previous mirrors next", () => {
  expect(move(1, 1, "previous")).toEqual({ row: 0, column: 3 });
  expect(move(1, 3, "previous")).toEqual({ row: 1, column: 1 });
});

test("the ends of the grid answer null", () => {
  expect(move(2, 3, "next")).toBeNull();
  expect(move(0, 1, "previous")).toBeNull();
  expect(move(0, 2, "up")).toBeNull();
  expect(move(2, 2, "down")).toBeNull();
});

test("up and down stay in the column and jump over a locked cell", () => {
  expect(move(0, 2, "down")).toEqual({ row: 2, column: 2 });
  expect(move(2, 2, "up")).toEqual({ row: 0, column: 2 });
  expect(move(0, 1, "down")).toEqual({ row: 1, column: 1 });
});
