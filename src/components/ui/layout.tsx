import { cloneElement, useId, type ReactElement, type ReactNode } from "react";

import { errorMessage } from "../../lib/errors";

// Building blocks every screen shares: panels, captioned fields and tables. One place, one look; the .data-table
// rules of index.css give every table its header, stripes and hover.
export const cellClass = "px-2.5 py-1.5";
export const headClass = "label px-2.5 py-1.5 whitespace-nowrap";
export const tableClass = "data-table";

export function Panel({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] p-3">
      {(title || actions) && (
        <div className="flex items-center gap-2">
          {title && <h2 className="font-semibold">{title}</h2>}
          <div className="ml-auto flex gap-2">{actions}</div>
        </div>
      )}
      {children}
    </section>
  );
}

/** A caption for one control, tied by id so the control is named by the caption alone. */
export function Field({ label, children, wide, help }: { label: string; children: ReactElement<{ id?: string }>; wide?: boolean; help?: string }) {
  const generated = useId();
  const id = children.props.id ?? generated;
  return (
    <div className={`flex flex-col gap-1 ${wide ? "md:col-span-2" : ""}`}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {cloneElement(children, { id })}
      {help && <span className="text-xs text-[var(--muted)]">{help}</span>}
    </div>
  );
}

/** Several controls under one caption (checkbox lists, from/to ranges): a group, never a label around labels. */
export function FieldGroup({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div role="group" aria-label={label} className={`flex flex-col gap-1 ${wide ? "md:col-span-2" : ""}`}>
      <span className="label">{label}</span>
      {children}
    </div>
  );
}

export function ErrorText({ error }: { error: unknown }) {
  return error ? <p className="text-[var(--bad)]">{errorMessage(error)}</p> : null;
}

export function Help({ children }: { children: ReactNode }) {
  return <p className="text-[var(--muted)]">{children}</p>;
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--line)]">
      <table className={tableClass}>
        <thead className="text-[var(--muted)]">
          <tr>
            {head.map((label, position) => (
              <th key={`${label}-${position}`} className={headClass}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
