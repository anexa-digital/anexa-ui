import { useState, type DragEvent, type ReactNode } from "react";

import { t } from "../../i18n";
import { formatNumber } from "../../lib/format";
import { iconButtonClass } from "../controls";
import { Badge, type Tone } from "./badge";
import { Icon } from "./icons";
import { MenuList, useMenu, type MenuItem } from "./menu";
import { Skeleton, type Empty, EmptyState } from "./widgets";

// Records in columns by stage (a pipeline, a kanban). A card moves by dragging it (native drag events: no drag
// library) or, from the keyboard, with its «Mover a…» menu. The board never moves a card by itself: `onMove` asks
// the app, which saves and refetches; `canDrop` says which columns accept a card, so the rest dim while dragging.

export type StageColumn = {
  id: string;
  label: string;
  /** Total of the stage when the board shows only some cards (the server's count). */
  count?: number;
  tone?: Tone;
  /** A line under the title: what the stage waits for. */
  hint?: string;
};

export type StageBoardProps<T> = {
  columns: StageColumn[];
  cards: T[];
  getId: (card: T) => string;
  getColumn: (card: T) => string;
  renderCard: (card: T) => ReactNode;
  /** The accessible name of a card (its menu and its drag say it). */
  cardLabel: (card: T) => string;
  canDrop?: (card: T, column: string) => boolean;
  onMove?: (card: T, column: string) => void | Promise<void>;
  onOpen?: (card: T) => void;
  loading?: boolean;
  empty?: Empty;
  /** What a column says when it has no cards. */
  columnEmpty?: string;
  label: string;
};

export function StageBoard<T>({ columns, cards, getId, getColumn, renderCard, cardLabel, canDrop, onMove, onOpen, loading, empty, columnEmpty, label }: StageBoardProps<T>) {
  const [dragging, setDragging] = useState<T | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const accepts = (card: T, column: string) => column !== getColumn(card) && (canDrop ? canDrop(card, column) : true);
  if (!loading && cards.length === 0 && empty) return <EmptyState {...empty} />;

  function drop(event: DragEvent<HTMLElement>, column: string) {
    event.preventDefault();
    setOver(null);
    const card = dragging;
    setDragging(null);
    if (card && accepts(card, column)) void onMove?.(card, column);
  }

  return (
    <div role="list" aria-label={label} className="flex min-h-0 flex-1 gap-[var(--gap)] overflow-x-auto pb-2">
      {columns.map((column) => {
        const own = cards.filter((card) => getColumn(card) === column.id);
        const target = dragging !== null && accepts(dragging, column.id);
        const dimmed = dragging !== null && !target && getColumn(dragging) !== column.id;
        return (
          <section
            key={column.id}
            role="listitem"
            aria-label={column.label}
            onDragOver={(event) => {
              if (!target) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setOver(column.id);
            }}
            onDragLeave={() => setOver((current) => (current === column.id ? null : current))}
            onDrop={(event) => drop(event, column.id)}
            className={`flex w-64 shrink-0 flex-col rounded-[var(--radius-md)] border bg-[var(--surface)] transition-opacity ${over === column.id ? "border-[var(--accent)] shadow-[inset_0_0_0_1px_var(--accent)]" : "border-[var(--line)]"} ${dimmed ? "opacity-40" : ""}`}
          >
            <header className="flex flex-col gap-0.5 border-b border-[var(--line)] px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-medium [font-family:var(--font-display)]">{column.label}</h3>
                <Badge tone={column.tone ?? "neutral"}>
                  <span className="num">{formatNumber(column.count ?? own.length)}</span>
                </Badge>
              </div>
              {column.hint && <p className="truncate text-xs text-[var(--muted)]">{column.hint}</p>}
            </header>
            <ul className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto p-2">
              {loading && Array.from({ length: 3 }, (_, index) => <li key={index} className="rounded-[var(--radius-sm)] border border-[var(--line)] p-2"><Skeleton lines={2} /></li>)}
              {!loading && own.length === 0 && <li className="px-1 py-3 text-center text-xs text-[var(--muted)]">{columnEmpty ?? t("board.columnEmpty")}</li>}
              {own.map((card) => (
                <Card key={getId(card)} card={card} label={cardLabel(card)} columns={columns} current={column.id} accepts={accepts} onMove={onMove} onOpen={onOpen} onDragStart={() => setDragging(card)} onDragEnd={() => { setDragging(null); setOver(null); }}>
                  {renderCard(card)}
                </Card>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Card<T>({ card, label, columns, current, accepts, onMove, onOpen, onDragStart, onDragEnd, children }: { card: T; label: string; columns: StageColumn[]; current: string; accepts: (card: T, column: string) => boolean; onMove?: (card: T, column: string) => void | Promise<void>; onOpen?: (card: T) => void; onDragStart: () => void; onDragEnd: () => void; children: ReactNode }) {
  const { open, setOpen, box } = useMenu();
  const items: MenuItem[] = columns
    .filter((column) => column.id !== current)
    .map((column) => ({ id: column.id, label: column.label, disabled: !accepts(card, column.id), run: () => { setOpen(false); void onMove?.(card, column.id); } }));
  const movable = Boolean(onMove) && items.some((item) => !item.disabled);
  return (
    <li
      draggable={movable}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", label);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`group relative rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--raised)] ${movable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <button type="button" aria-label={label} onClick={() => onOpen?.(card)} className="block h-auto w-full p-2 pr-8 text-left focus-visible:outline-2 focus-visible:outline-[var(--accent)]">
        {children}
      </button>
      {movable && (
        <div ref={box} className="absolute right-1 top-1">
          <button type="button" aria-label={t("board.moveCard", { card: label })} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} className={`${iconButtonClass} opacity-60 group-hover:opacity-100`}>
            <Icon name="more" className="h-4 w-4" />
          </button>
          {open && <MenuList items={items} label={t("board.moveTo")} align="right" onClose={() => setOpen(false)} />}
        </div>
      )}
    </li>
  );
}
