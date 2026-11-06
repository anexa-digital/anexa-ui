import { useState, type FormEvent } from "react";

import { t } from "../../../i18n";
import { buttonClass, inputClass } from "../../controls";
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
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={buttonClass}>
        {views.length ? t("grid.viewsCount", { count: views.length }) : t("grid.views")}
      </button>
      {open && (
        <PopoverPanel label={t("grid.views")} align="right" className="w-72">
          {views.length === 0 ? (
            <p className="px-1 text-[var(--muted)]">{t("grid.noViews")}</p>
          ) : (
            <ul className="flex flex-col">
              {views.map((view) => (
                <li key={view.name} className="flex h-7 items-center gap-1 rounded px-1 hover:bg-[var(--row-hover)]">
                  <button
                    type="button"
                    onClick={() => {
                      onApply(view);
                      setOpen(false);
                    }}
                    className="h-6 min-w-0 flex-1 truncate text-left"
                  >
                    {view.name}
                  </button>
                  <button type="button" aria-label={t("grid.deleteView", { name: view.name })} onClick={() => onDelete(view.name)} className="h-6 w-6 rounded text-[var(--muted)] hover:text-[var(--bad)]">
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={save} className="flex gap-1 border-t border-[var(--line)] pt-2">
            <input aria-label={t("grid.viewName")} placeholder={t("grid.viewName")} value={name} onChange={(event) => setName(event.target.value)} className={`${inputClass} h-7 min-w-0 flex-1`} />
            <button type="submit" disabled={!name.trim()} className={buttonClass}>
              {t("grid.saveView")}
            </button>
          </form>
        </PopoverPanel>
      )}
    </div>
  );
}
