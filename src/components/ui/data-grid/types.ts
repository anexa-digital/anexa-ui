import type { ColumnDef, ColumnPinningState, ColumnSizingState, RowData, SortingState, VisibilityState } from "@tanstack/react-table";

export type Density = "compact" | "normal";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Numbers and money: right-aligned, tabular figures. */
    align?: "right";
    /** Hidden until the user shows it from the columns panel. */
    hidden?: boolean;
    /** Plain text of the cell, for the CSV export and the quick search. */
    text?: (row: TData) => string | number | null | undefined;
    /** The code of the record (COT-1041): the figures' face in the second accent, the cell people click to open. */
    code?: boolean;
    /** Long text read in full: the cell wraps (line breaks kept) and its row grows to fit, instead of cutting it. */
    wrap?: boolean;
  }
}

/** A grid column: TanStack's definition with a required id (preferences and views refer to columns by id). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GridColumn<T> = ColumnDef<T, any> & { id: string; header: string };

/** A saved arrangement of a grid: what it shows and how, under a name the user chose. */
export type View = {
  name: string;
  visibility: VisibilityState;
  order: string[];
  pinning: ColumnPinningState;
  sorting: SortingState;
};

/** What a user arranged in one grid, kept in this browser per grid. */
export type Preferences = {
  visibility: VisibilityState;
  order: string[];
  sizing: ColumnSizingState;
  pinning: ColumnPinningState;
  density: Density;
  views: View[];
};
