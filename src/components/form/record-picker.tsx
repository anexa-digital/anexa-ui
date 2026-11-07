import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { t } from "../../i18n";
import { buttonClass, iconButtonClass, inputClass } from "../controls";
import { DataGrid } from "../ui/data-grid/data-grid";
import type { GridColumn } from "../ui/data-grid/types";
import { Dialog } from "../ui/dialog";
import { Icon } from "../ui/icons";
import { RecordLink } from "../record-link";
import { FieldFrame, errorText } from "./fields";
import { useFieldContext } from "./context";

// The lookup of a related record (the customer of a quotation, the product of a line): type to search on the server,
// pick with the arrows, open «Buscar más…» for a wider search over a grid, or create the record right there. The value
// is the record's id; what the person reads is `CODE · Nombre`. With a value, the chip links to the record.

export type RecordOption = { id: string; code?: string | null; label: string; hint?: string | null };

export type RecordPickerProps<T extends RecordOption = RecordOption> = {
  id?: string;
  value: string | null;
  onChange: (id: string | null, option: T | null) => void;
  /** The server search; "" asks for the first records (recent or most used). */
  search: (text: string) => Promise<T[]>;
  /** The record behind a value the search did not return (a stored id, when the page loads). */
  resolve?: (id: string) => Promise<T | null>;
  /** What the value shows before `resolve` answers (the page often already has the label). */
  initial?: T | null;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onBlur?: () => void;
  className?: string;
  /** Where a chosen record opens (its screen), drawn as a link beside the value. */
  recordLink?: (option: T) => { to: string; params?: Record<string, string>; search?: Record<string, unknown> } | null;
  /** «Crear «texto»…»: the app opens its own form and resolves with the new record (null when cancelled). */
  onCreate?: (text: string) => Promise<T | null>;
  /** «Buscar más…»: a dialog with a grid of the results; `columns` says what it shows. */
  more?: { title: string; columns: GridColumn<T>[]; search?: (text: string) => Promise<T[]> };
  /** How many rows the dropdown shows. */
  limit?: number;
  /** The name of what is picked, for the dialog and the empty texts («cliente»). */
  noun?: string;
  /** A free text is a valid value too (a prospect that is not a customer yet): called when the person types and leaves. */
  onFreeText?: (text: string) => void;
};

const DEBOUNCE = 250;

export const optionText = (option: RecordOption): string => (option.code ? `${option.code} · ${option.label}` : option.label);

export function RecordPicker<T extends RecordOption = RecordOption>({ id: givenId, value, onChange, search, resolve, initial, placeholder, disabled, required, invalid, describedBy, onBlur, className, recordLink, onCreate, more, limit = 8, noun, onFreeText }: RecordPickerProps<T>) {
  const generated = useId();
  const id = givenId ?? generated;
  const [text, setText] = useState("");
  const [typed, setTyped] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [chosen, setChosen] = useState<T | null>(initial ?? null);
  const [moreOpen, setMoreOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const searchKey = useRef(Math.random().toString(36).slice(2));

  useEffect(() => {
    const timer = window.setTimeout(() => setTyped(text), DEBOUNCE);
    return () => window.clearTimeout(timer);
  }, [text]);
  useEffect(() => {
    if (initial && initial.id === value) setChosen(initial);
  }, [initial, value]);
  // A value whose record we do not know yet: ask the app for it.
  const resolved = useQuery({ queryKey: ["record-picker", searchKey.current, "resolve", value], queryFn: () => (value && resolve ? resolve(value) : Promise.resolve(null)), enabled: Boolean(value && resolve && chosen?.id !== value) });
  useEffect(() => {
    if (resolved.data && resolved.data.id === value) setChosen(resolved.data);
  }, [resolved.data, value]);
  useEffect(() => {
    if (!value) setChosen(null);
  }, [value]);

  const results = useQuery({ queryKey: ["record-picker", searchKey.current, "search", typed], queryFn: () => search(typed), enabled: open, placeholderData: (previous) => previous });
  const options = useMemo(() => (results.data ?? []).slice(0, limit), [results.data, limit]);
  const canCreate = Boolean(onCreate && text.trim());
  const extras = (more ? 1 : 0) + (canCreate ? 1 : 0);
  const count = options.length + extras;

  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) close();
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  });

  function close() {
    setOpen(false);
    setActive(0);
    if (text && onFreeText && !chosen) onFreeText(text.trim());
    else setText("");
  }
  function choose(option: T) {
    setChosen(option);
    onChange(option.id, option);
    setText("");
    setOpen(false);
    setActive(0);
  }
  function clear() {
    setChosen(null);
    onChange(null, null);
    setText("");
    input.current?.focus();
  }
  async function create() {
    if (!onCreate) return;
    const created = await onCreate(text.trim());
    if (created) choose(created);
  }
  function pick(index: number) {
    if (index < options.length) choose(options[index]!);
    else if (more && index === options.length) {
      setOpen(false);
      setMoreOpen(true);
    } else void create();
  }
  function keyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      if (!open) setOpen(true);
      else setActive((index) => Math.min(index + 1, count - 1));
    } else if (event.key === "ArrowUp") setActive((index) => Math.max(index - 1, 0));
    else if (event.key === "Enter" && open && count > 0) pick(active);
    else if (event.key === "Escape" && open) close();
    else if (event.key === "Backspace" && !text && chosen) clear();
    else return;
    event.preventDefault();
  }

  const link = chosen && recordLink ? recordLink(chosen) : null;
  const shownValue = chosen && !open ? optionText(chosen) : text;
  return (
    <div ref={box} className={`relative ${className ?? "w-full"}`}>
      <div className={`flex items-center ${inputClass} w-full gap-1 pr-1 ${invalid ? "border-[var(--bad)]" : ""} ${disabled ? "opacity-60" : ""} focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_2px_var(--accent-soft)]`}>
        <input
          ref={input}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && count > 0 ? `${id}-option-${active}` : undefined}
          aria-required={required || undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          disabled={disabled}
          value={shownValue}
          placeholder={placeholder ?? (noun ? t("ui.typeToSearchNoun", { noun }) : t("ui.typeToSearch"))}
          onFocus={() => chosen && setText("")}
          onClick={() => !open && setOpen(true)}
          onChange={(event) => {
            setText(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={keyDown}
          onBlur={() => {
            if (!box.current?.contains(document.activeElement)) onBlur?.();
          }}
          className={`min-w-0 flex-1 bg-transparent outline-none ${chosen && !open ? "code" : ""}`}
        />
        {chosen && link && !open && <RecordLink {...link} code="" label="" icon className="shrink-0" title={t("ui.open")} />}
        {chosen && !disabled && (
          <button type="button" tabIndex={-1} onClick={clear} aria-label={t("ui.clear")} className={`${iconButtonClass} h-5 w-5`}>
            <Icon name="close" className="h-3.5 w-3.5" />
          </button>
        )}
        <button type="button" tabIndex={-1} disabled={disabled} aria-label={t("ui.pickOne")} onClick={() => (open ? close() : (setOpen(true), input.current?.focus()))} className={`${iconButtonClass} h-5 w-5`}>
          <Icon name="chevronDown" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <ul id={`${id}-list`} role="listbox" aria-label={placeholder ?? t("ui.pickOne")} className="absolute top-full z-30 mt-1 max-h-72 w-full min-w-64 overflow-auto rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--raised)] py-1 shadow-[var(--shadow)]">
          {results.isPending && options.length === 0 && <li className="px-2 py-1.5 text-[var(--muted)]">{t("ui.searching")}</li>}
          {results.isError && <li className="px-2 py-1.5 text-[var(--bad)]">{t("ui.loadFailed")}</li>}
          {!results.isPending && options.length === 0 && typed && <li className="px-2 py-1.5 text-[var(--muted)]">{t("ui.noResults", { text: typed })}</li>}
          {!typed && !results.isPending && options.length > 0 && <li className="label px-2 pt-1 pb-0.5">{t("ui.recent")}</li>}
          {options.map((option, index) => (
            <li
              key={option.id}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(option);
              }}
              onMouseEnter={() => setActive(index)}
              className={`flex h-[var(--control-h)] cursor-pointer items-center gap-2 px-2 ${index === active ? "bg-[var(--accent-soft)]" : ""} ${option.id === value ? "font-medium" : ""}`}
            >
              {option.code && <span className="code shrink-0">{option.code}</span>}
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {option.hint && <span className="ml-auto shrink-0 text-xs text-[var(--muted)]">{option.hint}</span>}
            </li>
          ))}
          {(more || canCreate) && <li aria-hidden className="divider my-1 border-t border-[var(--line)]" />}
          {more && (
            <li id={`${id}-option-${options.length}`} role="option" aria-selected={active === options.length} onMouseDown={(event) => (event.preventDefault(), pick(options.length))} onMouseEnter={() => setActive(options.length)} className={`flex h-[var(--control-h)] cursor-pointer items-center gap-2 px-2 text-[var(--accent)] ${active === options.length ? "bg-[var(--accent-soft)]" : ""}`}>
              <Icon name="search" className="h-4 w-4" />
              {t("ui.searchMore")}
            </li>
          )}
          {canCreate && (
            <li id={`${id}-option-${count - 1}`} role="option" aria-selected={active === count - 1} onMouseDown={(event) => (event.preventDefault(), pick(count - 1))} onMouseEnter={() => setActive(count - 1)} className={`flex h-[var(--control-h)] cursor-pointer items-center gap-2 px-2 text-[var(--accent)] ${active === count - 1 ? "bg-[var(--accent-soft)]" : ""}`}>
              <Icon name="plus" className="h-4 w-4" />
              <span className="truncate">{t("ui.createNew", { text: text.trim() })}</span>
            </li>
          )}
        </ul>
      )}
      {more && moreOpen && (
        <SearchMoreDialog<T>
          open={moreOpen}
          title={more.title}
          columns={more.columns}
          search={more.search ?? search}
          initialText={text}
          onClose={() => setMoreOpen(false)}
          onPick={(option) => {
            setMoreOpen(false);
            choose(option);
          }}
          onCreate={onCreate ? async (query) => (await onCreate(query)) ?? null : undefined}
        />
      )}
    </div>
  );
}

/** «Buscar más…»: the wide search, a grid of the results that the person reads, sorts and opens with ⏎. */
function SearchMoreDialog<T extends RecordOption>({ open, title, columns, search, initialText, onClose, onPick, onCreate }: { open: boolean; title: string; columns: GridColumn<T>[]; search: (text: string) => Promise<T[]>; initialText: string; onClose: () => void; onPick: (option: T) => void; onCreate?: (text: string) => Promise<T | null> }) {
  const [text, setText] = useState(initialText);
  const [typed, setTyped] = useState(initialText);
  useEffect(() => {
    if (open) {
      setText(initialText);
      setTyped(initialText);
    }
  }, [open, initialText]);
  useEffect(() => {
    const timer = window.setTimeout(() => setTyped(text), DEBOUNCE);
    return () => window.clearTimeout(timer);
  }, [text]);
  const results = useQuery({ queryKey: ["record-picker", "more", title, typed], queryFn: () => search(typed), enabled: open, placeholderData: (previous) => previous });
  return (
    <Dialog open={open} title={title} onClose={onClose} size="xl">
      <div className="flex min-h-[50vh] flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex flex-1 items-center">
            <Icon name="search" className="pointer-events-none absolute left-2 h-4 w-4 text-[var(--muted)]" />
            <input autoFocus type="search" aria-label={t("ui.search")} placeholder={t("ui.typeToSearch")} value={text} onChange={(event) => setText(event.target.value)} className={`${inputClass} w-full pl-7`} />
          </span>
          {onCreate && text.trim() && (
            <button type="button" onClick={() => void onCreate(text.trim()).then((created) => created && onPick(created))} className={`${buttonClass} flex items-center gap-1.5`}>
              <Icon name="plus" className="h-4 w-4" />
              {t("ui.createNew", { text: text.trim() })}
            </button>
          )}
        </div>
        <DataGrid<T>
          grid={`picker-${title}`}
          rows={results.data ?? []}
          columns={columns}
          getRowId={(row) => row.id}
          empty={typed ? t("ui.noResults", { text: typed }) : t("ui.typeToSearch")}
          loading={results.isPending}
          error={results.isError ? results.error : undefined}
          onRetry={() => void results.refetch()}
          pageSize={50}
          onOpen={onPick}
          onRowClick={onPick}
          maxHeight="55vh"
        />
      </div>
    </Dialog>
  );
}

type Common = { label: string; help?: string; required?: boolean; disabled?: boolean; wide?: boolean; className?: string };

/** A TanStack field whose value is the related record's id ("" when none): the kit's RecordPicker in a field frame. */
export function RecordField<T extends RecordOption = RecordOption>({ onChange, ...props }: Common & Omit<RecordPickerProps<T>, "value" | "onChange" | "id" | "invalid" | "describedBy" | "onBlur" | "required" | "disabled"> & { onChange?: (id: string | null, option: T | null) => void }) {
  const field = useFieldContext<string>();
  const id = useId();
  const touched = field.state.meta.isTouched || field.form.state.isSubmitted;
  const error = touched ? errorText(field.state.meta.errors) : null;
  const { label, help, required, disabled, wide, className, ...picker } = props;
  return (
    <FieldFrame id={id} error={error} label={label} help={help} required={required} disabled={disabled} wide={wide}>
      <RecordPicker<T>
        {...picker}
        id={id}
        className={className}
        value={field.state.value || null}
        required={required}
        disabled={disabled}
        invalid={Boolean(error)}
        describedBy={error ? `${id}-error` : undefined}
        onBlur={field.handleBlur}
        onChange={(value, option) => {
          field.handleChange(value ?? "");
          if (field.state.meta.errorMap.onServer) field.setErrorMap({ onServer: undefined } as never);
          onChange?.(value, option);
        }}
      />
    </FieldFrame>
  );
}

