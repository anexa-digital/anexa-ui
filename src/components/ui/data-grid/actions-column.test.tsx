import { describe, expect, test } from "bun:test";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { isValidElement, useState, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { MenuItem } from "../menu";
import { useActionsColumn } from "./data-grid";
import { ServerGrid } from "./server-grid";

type Part = { code: string };
const item = (id: string): MenuItem => ({ id, label: id, run: () => undefined });

/** Renders twice in one pass (a state change during render), each time with a `rowActions` written inline. */
function Probe({ seen }: { seen: (ColumnDef<Part, unknown> | undefined)[] }) {
  const [pass, setPass] = useState(0);
  seen.push(useActionsColumn<Part>((row) => [item(`${row.code}-${pass}`)]));
  if (pass === 0) setPass(1);
  return null;
}

/** The items the menu of a row would show, read from what the column's cell draws. */
function itemsOf(column: ColumnDef<Part, unknown>, code: string): string[] {
  const cell = column.cell as (context: { row: Row<Part> }) => ReactElement<{ children: ReactElement<{ items: MenuItem[] }> }> | null;
  const drawn = cell({ row: { original: { code } } as Row<Part> });
  return isValidElement(drawn) ? drawn.props.children.props.items.map((entry) => entry.id) : [];
}

describe("row actions", () => {
  test("the «⋯» column survives a rowActions function written inline", () => {
    const seen: (ColumnDef<Part, unknown> | undefined)[] = [];
    renderToStaticMarkup(<Probe seen={seen} />);
    expect(seen.length).toBe(2);
    // The same cell component in both renders: React keeps the row menus mounted, and an open one stays open.
    expect(seen[1]).toBe(seen[0]);
    expect(seen[1]!.cell).toBe(seen[0]!.cell);
    // And it draws what the latest function says.
    expect(itemsOf(seen[0]!, "P-1")).toEqual(["P-1-1"]);
  });

  test("the report of a bulk action is not a child of the selection bar", () => {
    // Nothing is marked, so the bar is not drawn; the dialog that asks and reports must be there anyway, or it
    // goes away with the selection as soon as the action clears it.
    const html = renderToStaticMarkup(
      <ServerGrid<Part>
        grid="test-bulk"
        rows={[]}
        total={0}
        columns={[{ id: "code", header: "Código", accessorKey: "code" }]}
        getRowId={(row) => row.code}
        empty="Sin partes"
        sorting={[]}
        onSortingChange={() => undefined}
        sortable={() => false}
        page={1}
        pageSize={25}
        onPage={() => undefined}
        selectable
        actions={[{ label: "Eliminar", danger: true, confirm: (count) => `¿Eliminar ${count}?`, run: async () => undefined }]}
      />,
    );
    expect(html).not.toContain('role="status"');
    expect(html).toContain("<dialog");
  });
});
