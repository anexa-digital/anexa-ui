import { useState, type FormEvent } from "react";

import { t, type MessageKey } from "../../../i18n";
import { getJson } from "../../../lib/api";
import { buttonClass, inputClass, primaryClass, selectClass } from "../../controls";
import { Chip } from "../widgets";
import { PopoverPanel, usePopover } from "../popover";

// The description of a server list (GET /v1/lists/{name}) and the filters it takes.
export type FieldKind = "text" | "number" | "date" | "enum";
export type ListField = { key: string; kind: FieldKind; sortable: boolean; filterable: boolean; groupable: boolean; operators: string[]; options: string[] };
export type ListMeta = { name: string; fields: ListField[]; max_groups: number };
export type ListFilter = { field: string; op: string; value?: unknown };
export type ListGroup = { value: string | null; total: number };

export const listMeta = (name: string) => getJson<ListMeta>(`/v1/lists/${name}`);

/** Filters as they travel in the URL and to the API: JSON, absent when there are none. */
export const filtersParam = (filters: ListFilter[]) => (filters.length ? JSON.stringify(filters) : undefined);
export function parseFilters(value: unknown): ListFilter[] {
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is ListFilter => typeof item?.field === "string" && typeof item?.op === "string") : [];
  } catch {
    return [];
  }
}

type Naming = { label: (field: string) => string; optionLabel: (field: string, value: string) => string };

function describe(filter: ListFilter, naming: Naming): string {
  const op = t(`grid.op.${filter.op}` as MessageKey);
  const value = filter.value;
  if (filter.op === "empty") return `${naming.label(filter.field)} ${op}`;
  if (filter.op === "in" && Array.isArray(value)) return `${naming.label(filter.field)}: ${value.map((item) => naming.optionLabel(filter.field, String(item))).join(", ")}`;
  if (filter.op === "between" && Array.isArray(value)) return `${naming.label(filter.field)} ${value[0] ?? "…"} – ${value[1] ?? "…"}`;
  return `${naming.label(filter.field)} ${op} «${String(value)}»`;
}

function FilterEditor({ fields, onAdd, naming }: { fields: ListField[]; onAdd: (filter: ListFilter) => void } & { naming: Naming }) {
  const [key, setKey] = useState(fields[0]?.key ?? "");
  const field = fields.find((item) => item.key === key);
  // «Is one of» needs a list to choose from: a free text field keeps it only for the groups of the grid.
  const operators = (item: ListField | undefined) => (item?.operators ?? []).filter((op) => op !== "in" || item?.options.length);
  const [op, setOp] = useState(operators(field)[0] ?? "");
  const [text, setText] = useState("");
  const [range, setRange] = useState<[string, string]>(["", ""]);
  const [chosen, setChosen] = useState<string[]>([]);
  if (!field) return null;
  const inputType = field.kind === "number" ? "number" : field.kind === "date" ? "date" : "text";
  const ready = op === "empty" || (op === "in" ? chosen.length > 0 : op === "between" ? Boolean(range[0] || range[1]) : Boolean(text.trim()));

  function pick(next: string) {
    const nextField = fields.find((item) => item.key === next);
    setKey(next);
    setOp(operators(nextField)[0] ?? "");
    setText("");
    setRange(["", ""]);
    setChosen([]);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    const value = op === "empty" ? undefined : op === "in" ? chosen : op === "between" ? range.map((item) => item || null) : text.trim();
    onAdd({ field: key, op, value });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <select aria-label={t("grid.filterField")} value={key} onChange={(event) => pick(event.target.value)} className={selectClass}>
        {fields.map((item) => (
          <option key={item.key} value={item.key}>
            {naming.label(item.key)}
          </option>
        ))}
      </select>
      <select aria-label={t("grid.filterOperator")} value={op} onChange={(event) => setOp(event.target.value)} className={selectClass}>
        {operators(field).map((item) => (
          <option key={item} value={item}>
            {t(`grid.op.${item}` as MessageKey)}
          </option>
        ))}
      </select>
      {op === "in" ? (
        <div className="flex max-h-48 flex-col gap-1 overflow-auto">
          {field.options.map((option) => (
            <label key={option} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={chosen.includes(option)}
                onChange={(event) => setChosen(event.target.checked ? [...chosen, option] : chosen.filter((item) => item !== option))}
              />
              {naming.optionLabel(key, option)}
            </label>
          ))}
        </div>
      ) : op === "between" ? (
        <div className="flex gap-1">
          <input type={inputType} aria-label={t("grid.from")} value={range[0]} onChange={(event) => setRange([event.target.value, range[1]])} className={`${inputClass} h-7 min-w-0 flex-1`} />
          <input type={inputType} aria-label={t("grid.to")} value={range[1]} onChange={(event) => setRange([range[0], event.target.value])} className={`${inputClass} h-7 min-w-0 flex-1`} />
        </div>
      ) : op !== "empty" ? (
        <input type={inputType} aria-label={t("grid.filterValue")} value={text} onChange={(event) => setText(event.target.value)} className={`${inputClass} h-7`} />
      ) : null}
      <button type="submit" disabled={!ready} className={primaryClass}>
        {t("grid.applyFilter")}
      </button>
    </form>
  );
}

/** The active filters as chips (each one removable) and a «Filtro» button that adds one, from the list's whitelist. */
export function FilterBar({ meta, filters, onChange, ...naming }: { meta: ListMeta | undefined; filters: ListFilter[]; onChange: (filters: ListFilter[]) => void } & Naming) {
  const { open, setOpen, box } = usePopover();
  const fields = (meta?.fields ?? []).filter((field) => field.filterable);
  if (fields.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div ref={box} className="relative">
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={buttonClass}>
          {t("grid.addFilter")}
        </button>
        {open && (
          <PopoverPanel label={t("grid.addFilter")} className="w-64">
            <FilterEditor
              fields={fields}
              naming={naming}
              onAdd={(filter) => {
                onChange([...filters.filter((item) => item.field !== filter.field), filter]);
                setOpen(false);
              }}
            />
          </PopoverPanel>
        )}
      </div>
      {filters.map((filter) => (
        <Chip key={filter.field} onRemove={() => onChange(filters.filter((item) => item.field !== filter.field))} removeLabel={t("grid.removeFilter", { filter: naming.label(filter.field) })}>
          {describe(filter, naming)}
        </Chip>
      ))}
      {filters.length > 1 && (
        <button type="button" onClick={() => onChange([])} className="h-6 px-1 text-xs text-[var(--muted)] hover:text-[var(--ink)]">
          {t("grid.clearFilters")}
        </button>
      )}
    </div>
  );
}

/** «Agrupar por» a groupable field of the list; the grid then shows the groups as sections. */
export function GroupBar({
  meta,
  groupBy,
  onGroupBy,
  label,
}: {
  meta: ListMeta | undefined;
  groupBy: string | undefined;
  onGroupBy: (field: string | undefined) => void;
  label: (field: string) => string;
}) {
  const fields = (meta?.fields ?? []).filter((field) => field.groupable);
  if (fields.length === 0) return null;
  return (
    <label className="flex items-center gap-2 text-[var(--muted)]">
      {t("grid.groupBy")}
      <select value={groupBy ?? ""} onChange={(event) => onGroupBy(event.target.value || undefined)} className={selectClass}>
        <option value="">{t("grid.noGrouping")}</option>
        {fields.map((field) => (
          <option key={field.key} value={field.key}>
            {label(field.key)}
          </option>
        ))}
      </select>
    </label>
  );
}

/** The filter that keeps only one group of a field: its value, or the rows where it is empty. */
export const groupFilter = (field: string, value: string | null): ListFilter => (value === null ? { field, op: "empty" } : { field, op: "in", value: [value] });
