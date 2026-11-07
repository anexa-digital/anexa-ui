import { useState, type FormEvent } from "react";

import { t } from "../../../i18n";
import { buttonClass, inputClass } from "../../controls";
import { Icon } from "../icons";
import { PopoverPanel, usePopover } from "../popover";
import type { View } from "./types";

/** Named arrangements of a grid: save the current one, apply or delete a saved one. */
export function ViewsPanel({ views, onSave, onApply, onDelete }: { views: View[]; onSave: (name: string) => void; onApply: (view: View) => void; onDelete: (name: string) => void }) {
  const { open, setOpen, box } = usePopover();
  const [name, setName] = useState("");

  function save(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
    setName("");
  }

  return (
    <div ref={box} className="relative">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={`${buttonClass} flex items-center gap-1.5`}>
        <Icon name="eye" className="h-4 w-4 text-[var(--muted)]" />
        {views.length ? t("grid.viewsCount", { count: views.length }) : t("grid.views")}
      </button>
      {open && (
        <PopoverPanel label={t("grid.views")} align="right" className="w-72">
          {views.length === 0 ? (
            <p className="px-1 text-[var(--muted)]">{t("grid.noViews")}</p>
          ) : (
            <ul className="flex flex-col">
              {views.map((view) => (
                <li key={view.name} className="flex h-[var(--control-h)] items-center gap-1 rounded-[var(--radius-sm)] px-1 hover:bg-[var(--row-hover)]">
                  <button
                    type="button"
                    onClick={() => {
                      onApply(view);
                      setOpen(false);
                    }}
                    className="h-[var(--control-h-sm)] min-w-0 flex-1 truncate text-left"
                  >
                    {view.name}
                  </button>
                  <button type="button" aria-label={t("grid.deleteView", { name: view.name })} onClick={() => onDelete(view.name)} className="flex h-[var(--control-h-sm)] w-[var(--control-h-sm)] items-center justify-center rounded-[var(--radius-sm)] text-[var(--muted)] hover:text-[var(--bad)]">
                    <Icon name="close" className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={save} className="flex gap-1 border-t border-[var(--line)] pt-2">
            <input aria-label={t("grid.viewName")} placeholder={t("grid.viewName")} value={name} onChange={(event) => setName(event.target.value)} className={`${inputClass} h-[var(--control-h)] min-w-0 flex-1`} />
            <button type="submit" disabled={!name.trim()} className={buttonClass}>
              {t("grid.saveView")}
            </button>
          </form>
        </PopoverPanel>
      )}
    </div>
  );
}
