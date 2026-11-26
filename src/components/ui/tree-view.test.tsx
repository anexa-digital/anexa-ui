import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { TreeView, treeMove, treeRows, type TreeNode } from "./tree-view";

// north ─ plant ─ unit-1, unit-2
//       └ depot (an empty list of children)
// south ─ office ─ printer
const ITEMS: TreeNode[] = [
  {
    id: "north",
    label: "Zona norte",
    children: [
      { id: "plant", label: "Planta", children: [{ id: "unit-1", label: "Equipo 1" }, { id: "unit-2", label: "Equipo 2" }] },
      { id: "depot", label: "Bodega", children: [] },
    ],
  },
  { id: "south", label: "Zona sur", children: [{ id: "office", label: "Oficina", children: [{ id: "printer", label: "Impresora" }] }] },
];

const ids = (expanded: string[]) => treeRows(ITEMS, new Set(expanded)).map((row) => row.node.id);
const move = (expanded: string[], current: string, key: Parameters<typeof treeMove>[2]) => treeMove(treeRows(ITEMS, new Set(expanded)), current, key);
/** The opening tag of every node, in order. */
const nodes = (html: string) => html.match(/<li[^>]*role="treeitem"[^>]*>/g) ?? [];
const attribute = (html: string, name: string) => nodes(html).map((node) => new RegExp(` ${name}="([^"]*)"`).exec(node)?.[1]);

describe("treeRows", () => {
  test("only the children of open branches are on screen, in reading order", () => {
    expect(ids([])).toEqual(["north", "south"]);
    expect(ids(["north"])).toEqual(["north", "plant", "depot", "south"]);
    expect(ids(["north", "plant", "south"])).toEqual(["north", "plant", "unit-1", "unit-2", "depot", "south", "office"]);
    // An open branch under a closed one stays hidden.
    expect(ids(["plant"])).toEqual(["north", "south"]);
  });

  test("each row knows its level, its parent and its place among its siblings", () => {
    const rows = treeRows(ITEMS, new Set(["north", "plant"]));
    expect(rows.find((row) => row.node.id === "unit-2")).toMatchObject({ level: 3, parent: "plant", position: 2, size: 2, branch: false, open: false });
    expect(rows.find((row) => row.node.id === "north")).toMatchObject({ level: 1, parent: null, position: 1, size: 2, branch: true, open: true });
    // An empty list of children is a leaf, open or not.
    expect(treeRows(ITEMS, new Set(["north", "depot"])).find((row) => row.node.id === "depot")).toMatchObject({ branch: false, open: false });
    expect(treeRows([], new Set())).toEqual([]);
  });
});

describe("treeMove", () => {
  test("Up and Down walk the rows on screen and stop at the ends", () => {
    expect(move(["north"], "north", "ArrowDown")).toEqual({ focus: "plant" });
    expect(move(["north"], "depot", "ArrowDown")).toEqual({ focus: "south" });
    expect(move(["north"], "south", "ArrowUp")).toEqual({ focus: "depot" });
    expect(move(["north"], "north", "ArrowUp")).toBeNull();
    expect(move(["north"], "south", "ArrowDown")).toBeNull();
  });

  test("Right opens a closed branch, then steps into it; on a leaf it does nothing", () => {
    expect(move([], "north", "ArrowRight")).toEqual({ toggle: "north" });
    expect(move(["north"], "north", "ArrowRight")).toEqual({ focus: "plant" });
    expect(move(["north"], "depot", "ArrowRight")).toBeNull();
    expect(move(["north", "plant"], "unit-1", "ArrowRight")).toBeNull();
  });

  test("Left closes an open branch, otherwise goes up to the parent; a closed root stays", () => {
    expect(move(["north", "plant"], "plant", "ArrowLeft")).toEqual({ toggle: "plant" });
    expect(move(["north"], "plant", "ArrowLeft")).toEqual({ focus: "north" });
    expect(move(["north", "plant"], "unit-2", "ArrowLeft")).toEqual({ focus: "plant" });
    expect(move([], "south", "ArrowLeft")).toBeNull();
  });

  test("Home and End are the first and last rows on screen", () => {
    expect(move(["north", "plant"], "unit-2", "Home")).toEqual({ focus: "north" });
    expect(move(["north", "south"], "plant", "End")).toEqual({ focus: "office" });
    expect(move([], "north", "Home")).toBeNull();
    expect(move([], "south", "End")).toBeNull();
  });

  test("a node that is not on screen has no moves", () => {
    expect(move([], "unit-1", "ArrowDown")).toBeNull();
    expect(treeMove([], "north", "Home")).toBeNull();
  });
});

describe("TreeView", () => {
  test("a named tree: levels, places, open and closed branches, groups", () => {
    const html = renderToStaticMarkup(<TreeView label="Equipos por zona" items={ITEMS} expanded={new Set(["north"])} />);
    expect(html).toContain('role="tree"');
    expect(html).toContain('aria-label="Equipos por zona"');
    expect(nodes(html).length).toBe(4);
    expect(attribute(html, "aria-level")).toEqual(["1", "2", "2", "1"]);
    expect(attribute(html, "aria-expanded")).toEqual(["true", "false", undefined, "false"]);
    expect(attribute(html, "aria-posinset")).toEqual(["1", "1", "2", "2"]);
    expect(attribute(html, "aria-setsize")).toEqual(["2", "2", "2", "2"]);
    expect(html.match(/role="group"/g)?.length).toBe(1);
    expect(html).toContain("Planta");
    expect(html).not.toContain("Equipo 1");
    // Without selection nothing claims to be chosen.
    expect(html).not.toContain("aria-selected");
  });

  test("one node in the Tab order: the first, or the chosen one while it is on screen", () => {
    const plain = renderToStaticMarkup(<TreeView label="Equipos" items={ITEMS} defaultExpanded={["north"]} />);
    expect(attribute(plain, "tabindex")).toEqual(["0", "-1", "-1", "-1"]);
    const chosen = renderToStaticMarkup(<TreeView label="Equipos" items={ITEMS} defaultExpanded={["north"]} selected="depot" onSelect={() => undefined} />);
    expect(attribute(chosen, "tabindex")).toEqual(["-1", "-1", "0", "-1"]);
    expect(attribute(chosen, "aria-selected")).toEqual(["false", "false", "true", "false"]);
    // The chosen node is inside a closed branch: the stop falls back to the first row.
    const hidden = renderToStaticMarkup(<TreeView label="Equipos" items={ITEMS} selected="unit-1" onSelect={() => undefined} />);
    expect(attribute(hidden, "tabindex")).toEqual(["0", "-1"]);
    expect(attribute(hidden, "aria-selected")).toEqual(["false", "false"]);
  });

  test("the screen's expansion wins over the default, and the default opens without it", () => {
    expect(nodes(renderToStaticMarkup(<TreeView label="Equipos" items={ITEMS} />)).length).toBe(2);
    expect(nodes(renderToStaticMarkup(<TreeView label="Equipos" items={ITEMS} defaultExpanded={["north", "plant"]} />)).length).toBe(6);
    expect(nodes(renderToStaticMarkup(<TreeView label="Equipos" items={ITEMS} expanded={new Set()} defaultExpanded={["north"]} />)).length).toBe(2);
  });

  test("icon and trailing are drawn in the row", () => {
    const html = renderToStaticMarkup(<TreeView label="Equipos" items={[{ id: "a", label: "Zona", icon: "folder", trailing: <span>3 equipos</span> }]} />);
    expect(html).toContain("3 equipos");
    expect(html.match(/<svg/g)?.length).toBe(1);
    expect(html).not.toContain("aria-expanded");
  });

  test("no nodes show the empty state", () => {
    expect(renderToStaticMarkup(<TreeView label="Equipos" items={[]} />)).toContain("Nada que mostrar");
    const html = renderToStaticMarkup(<TreeView label="Equipos" items={[]} empty="Aún no hay equipos" />);
    expect(html).toContain("Aún no hay equipos");
    expect(html).not.toContain('role="tree"');
  });
});
