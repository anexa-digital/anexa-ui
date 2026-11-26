import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { t } from "../../i18n";
import { Icon, type IconName } from "./icons";
import { EmptyState, type Empty } from "./widgets";

// A hierarchy to look through: what contains what, a few levels deep and a few hundred nodes at most (every open
// node is in the page; nothing is virtualized). The screen gives the nodes already nested and decides what a
// choice means; the kit draws the levels, keeps one node in the Tab order and moves through them with the arrows.

export type TreeNode<T = unknown> = {
  id: string;
  label: ReactNode;
  /** What it contains. None, or an empty list, makes it a leaf. */
  children?: TreeNode<T>[];
  icon?: IconName;
  /** At the right end of its row: a light, a count, a badge. */
  trailing?: ReactNode;
  /** Whatever the screen wants back in `onSelect`. */
  data?: T;
};

export type TreeRow<T = unknown> = {
  node: TreeNode<T>;
  /** 1 for the roots. */
  level: number;
  parent: string | null;
  /** Its place among its siblings, from 1, and how many they are. */
  position: number;
  size: number;
  branch: boolean;
  open: boolean;
};

export type TreeKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Home" | "End";

/** What a key asks for: the focus on another node, or a branch opened or closed. */
export type TreeMove = { focus: string } | { toggle: string };

/** The nodes that are on screen, in reading order: the children of a branch follow it only while it is open. */
export function treeRows<T>(items: readonly TreeNode<T>[], expanded: ReadonlySet<string>): TreeRow<T>[] {
  const rows: TreeRow<T>[] = [];
  const walk = (nodes: readonly TreeNode<T>[], level: number, parent: string | null) => {
    nodes.forEach((node, index) => {
      const branch = (node.children?.length ?? 0) > 0;
      const open = branch && expanded.has(node.id);
      rows.push({ node, level, parent, position: index + 1, size: nodes.length, branch, open });
      if (open) walk(node.children ?? [], level + 1, node.id);
    });
  };
  walk(items, 1, null);
  return rows;
}

/**
 * Where a key leads from the node `current`, over the rows on screen. Up and Down walk the rows; Right opens a
 * closed branch and then steps into it; Left closes an open branch and otherwise goes up to the parent; Home and
 * End are the first and last rows. Null when the key has nothing to do there.
 */
export function treeMove<T>(rows: readonly TreeRow<T>[], current: string, key: TreeKey): TreeMove | null {
  const index = rows.findIndex((row) => row.node.id === current);
  const row = rows[index];
  if (!row) return null;
  const focus = (target: TreeRow<T> | undefined): TreeMove | null => (target && target.node.id !== current ? { focus: target.node.id } : null);
  switch (key) {
    case "ArrowDown":
      return focus(rows[index + 1]);
    case "ArrowUp":
      return index > 0 ? focus(rows[index - 1]) : null;
    case "Home":
      return focus(rows[0]);
    case "End":
      return focus(rows.at(-1));
    case "ArrowRight":
      if (!row.branch) return null;
      return row.open ? focus(rows[index + 1]) : { toggle: row.node.id };
    case "ArrowLeft":
      if (row.open) return { toggle: row.node.id };
      return row.parent === null ? null : { focus: row.parent };
  }
}

const MOVES: readonly string[] = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"] satisfies TreeKey[];

/**
 * `label` names the tree for readers. Which branches are open belongs to the screen (`expanded` /
 * `onExpandedChange`) or, without `expanded`, to the tree itself starting from `defaultExpanded`. With `onSelect` a
 * node is chosen by a click, Enter or Space and `selected` marks it; without it those open and close the branch.
 * The arrow at the left of a branch always opens and closes it.
 */
export function TreeView<T = unknown>({
  items,
  label,
  expanded,
  onExpandedChange,
  defaultExpanded,
  selected,
  onSelect,
  empty,
  className = "",
}: {
  items: readonly TreeNode<T>[];
  label: string;
  expanded?: ReadonlySet<string>;
  onExpandedChange?: (expanded: Set<string>) => void;
  defaultExpanded?: Iterable<string>;
  selected?: string | null;
  onSelect?: (id: string, node: TreeNode<T>) => void;
  /** What it says with no nodes: a title, or a title with a body and an action. */
  empty?: string | Empty;
  className?: string;
}) {
  const [own, setOwn] = useState<ReadonlySet<string>>(() => new Set(defaultExpanded));
  const open = expanded ?? own;
  const rows = useMemo(() => treeRows(items, open), [items, open]);
  const [active, setActive] = useState<string | null>(null);
  const elements = useRef(new Map<string, HTMLElement>());

  if (items.length === 0) return <EmptyState {...(typeof empty === "string" ? { title: empty } : (empty ?? { title: t("tree.empty") }))} />;

  const selectable = onSelect !== undefined || selected !== undefined;
  const onScreen = (id: string | null | undefined) => id !== null && id !== undefined && rows.some((row) => row.node.id === id);
  // One stop in the Tab order: where the person last was, else the chosen node, else the first row.
  const stop = onScreen(active) ? active : onScreen(selected) ? selected : rows[0]?.node.id;

  const toggle = (id: string) => {
    const next = new Set(open);
    if (!next.delete(id)) next.add(id);
    if (expanded === undefined) setOwn(next);
    onExpandedChange?.(next);
  };
  const activate = (row: TreeRow<T>) => {
    setActive(row.node.id);
    if (onSelect) onSelect(row.node.id, row.node);
    else if (row.branch) toggle(row.node.id);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLLIElement>, row: TreeRow<T>) => {
    // A key pressed on something inside the row (a button in `trailing`) is not for the tree.
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate(row);
      return;
    }
    if (!MOVES.includes(event.key)) return;
    event.preventDefault();
    const move = treeMove(rows, row.node.id, event.key as TreeKey);
    if (!move) return;
    if ("toggle" in move) return toggle(move.toggle);
    setActive(move.focus);
    elements.current.get(move.focus)?.focus();
  };

  const rowOf = new Map(rows.map((row) => [row.node.id, row]));
  const draw = (nodes: readonly TreeNode<T>[]): ReactNode[] =>
    nodes.map((node) => {
      const row = rowOf.get(node.id);
      if (!row) return null;
      const chosen = selectable && selected === node.id;
      return (
        <li
          key={node.id}
          ref={(element) => {
            if (element) elements.current.set(node.id, element);
            else elements.current.delete(node.id);
          }}
          role="treeitem"
          aria-level={row.level}
          aria-setsize={row.size}
          aria-posinset={row.position}
          aria-expanded={row.branch ? row.open : undefined}
          aria-selected={selectable ? chosen : undefined}
          tabIndex={node.id === stop ? 0 : -1}
          onKeyDown={(event) => onKeyDown(event, row)}
          onFocus={(event) => event.target === event.currentTarget && setActive(node.id)}
          // The ring goes around the row, not around everything the branch holds.
          className="outline-none [&:focus-visible>[data-tree-row]]:[outline:var(--focus-outline)] [&:focus-visible>[data-tree-row]]:[outline-offset:-2px]"
        >
          <div
            data-tree-row
            onClick={() => activate(row)}
            style={{ paddingInlineStart: `calc(${row.level - 1} * 1.25rem + 0.25rem)` }}
            className={`flex min-h-[var(--control-h)] cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] pr-2 hover:bg-[var(--row-hover)] ${chosen ? "bg-[var(--accent-soft)] font-medium" : ""}`}
          >
            <span
              aria-hidden
              onClick={
                row.branch
                  ? (event) => {
                      event.stopPropagation();
                      setActive(node.id);
                      toggle(node.id);
                    }
                  : undefined
              }
              className="flex h-[var(--control-h-sm)] w-5 shrink-0 items-center justify-center text-[var(--muted)]"
            >
              {row.branch && <Icon name={row.open ? "chevronDown" : "chevronRight"} className="h-3.5 w-3.5" />}
            </span>
            {node.icon && (
              <span className="flex shrink-0 text-[var(--muted)]">
                <Icon name={node.icon} className="h-4 w-4" />
              </span>
            )}
            <span className="min-w-0 flex-1 truncate">{node.label}</span>
            {node.trailing !== undefined && node.trailing !== null && <span className="flex shrink-0 items-center gap-2 font-normal">{node.trailing}</span>}
          </div>
          {row.open && (
            <ul role="group" className="m-0 flex list-none flex-col p-0">
              {draw(node.children ?? [])}
            </ul>
          )}
        </li>
      );
    });

  return (
    <ul role="tree" aria-label={label} className={`m-0 flex list-none flex-col p-0 ${className}`}>
      {draw(items)}
    </ul>
  );
}
