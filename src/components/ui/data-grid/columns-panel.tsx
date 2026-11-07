import { useState } from "react";

import { t, type MessageKey } from "../../../i18n";
import { buttonClass } from "../../controls";
import { PopoverPanel, usePopover } from "../popover";
import type { Density, Preferences } from "./types";

const ICON_BUTTON = "h-[var(--control-h-sm)] w-[var(--control-h-sm)] rounded-[var(--radius-sm)] text-[var(--muted)] hover:text-[var(--ink)] disabled:opacity-30 aria-pressed:text-[var(--accent)]";

/** Show or hide, reorder (drag or arrows), pin to a side, and the row density of one grid. */
export function ColumnsPanel({
  columns,
  preferences,
  onChange,
  onReset,
}: {
  columns: { id: string; header: string }[];
  preferences: Preferences;
  onChange: (change: Partial<Preferences>) => void;
  onReset: () => void;
}) {
  const { open, setOpen, box } = usePopover();
  const [dragged, setDragged] = useState<string | null>(null);
  const order = preferences.order.filter((id) => columns.some((column) => column.id === id));
  const hidden = columns.filter((column) => preferences.visibility[column.id] === false).length;

  function move(id: string, to: number) {
    const rest = order.filter((other) => other !== id);
    rest.splice(Math.max(0, Math.min(to, rest.length)), 0, id);
    onChange({ order: rest });
  }

  function pin(id: string, side: "left" | "right" | null) {
    const left = (preferences.pinning.left ?? []).filter((other) => other !== id);
    const right = (preferences.pinning.right ?? []).filter((other) => other !== id);
    if (side === "left") left.push(id);
    if (side === "right") right.push(id);
    onChange({ pinning: { left, right } });
  }

  return (
    <div ref={box} className="relative">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={buttonClass}>
        {hidden > 0 ? t("grid.columnsHidden", { count: hidden }) : t("grid.columns")}
      </button>
      {open && (
        <PopoverPanel label={t("grid.columns")} align="right" className="w-80">
          <div role="radiogroup" aria-label={t("grid.density")} className="flex items-center gap-1">
            <span className="mr-auto text-xs text-[var(--muted)]">{t("grid.density")}</span>
            {(["compact", "normal"] as Density[]).map((density) => (
              <button
                key={density}
                type="button"
                role="radio"
                aria-checked={preferences.density === density}
                onClick={() => onChange({ density })}
                className={`h-[var(--control-h-sm)] rounded-[var(--radius-sm)] px-2 text-xs ${preferences.density === density ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)]"}`}
              >
                {t(`grid.density.${density}` as MessageKey)}
              </button>
            ))}
          </div>
          <ul className="flex max-h-80 flex-col overflow-auto border-t border-[var(--line)] pt-1">
            {order.map((id, index) => {
              const column = columns.find((item) => item.id === id);
              if (!column) return null;
              const side = preferences.pinning.left?.includes(id) ? "left" : preferences.pinning.right?.includes(id) ? "right" : null;
              return (
                <li
                  key={id}
                  draggable
                  onDragStart={() => setDragged(id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragged && dragged !== id) move(dragged, order.indexOf(id));
                    setDragged(null);
                  }}
                  className={`flex h-[var(--control-h)] items-center gap-1 rounded-[var(--radius-sm)] px-1 hover:bg-[var(--row-hover)] ${dragged === id ? "opacity-40" : ""}`}
                >
                  <span aria-hidden className="cursor-grab text-[var(--muted)]">
                    ⠿
                  </span>
                  <label className="flex min-w-0 flex-1 items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={preferences.visibility[id] !== false}
                      onChange={(event) => onChange({ visibility: { ...preferences.visibility, [id]: event.target.checked } })}
                    />
                    {column.header}
                  </label>
                  <button type="button" aria-label={t("grid.moveUp", { column: column.header })} disabled={index === 0} onClick={() => move(id, index - 1)} className={ICON_BUTTON}>
                    ↑
                  </button>
                  <button type="button" aria-label={t("grid.moveDown", { column: column.header })} disabled={index === order.length - 1} onClick={() => move(id, index + 1)} className={ICON_BUTTON}>
                    ↓
                  </button>
                  <button type="button" aria-label={t("grid.pinLeft", { column: column.header })} aria-pressed={side === "left"} onClick={() => pin(id, side === "left" ? null : "left")} className={ICON_BUTTON}>
                    ⇤
                  </button>
                  <button type="button" aria-label={t("grid.pinRight", { column: column.header })} aria-pressed={side === "right"} onClick={() => pin(id, side === "right" ? null : "right")} className={ICON_BUTTON}>
                    ⇥
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end border-t border-[var(--line)] pt-2">
            <button type="button" onClick={onReset} className={buttonClass}>
              {t("grid.resetColumns")}
            </button>
          </div>
        </PopoverPanel>
      )}
    </div>
  );
}
