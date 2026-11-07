import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Icon } from "./ui/icons";

// A link to a record from anywhere it is named: the code in the figures' face and the second accent (COT-1041),
// optionally its name beside it. One look for every grid, detail and chip, so people learn where to click.

export function RecordLink({ to, params, search, code, label, icon, title, className = "" }: { to: string; params?: Record<string, string>; search?: Record<string, unknown>; code: ReactNode; /** The record's name, after the code, in the normal face. */ label?: ReactNode; /** An «open» icon instead of (or after) the text. */ icon?: boolean; title?: string; className?: string }) {
  return (
    <Link to={to as never} params={params as never} search={search as never} title={title} className={`record-link inline-flex max-w-full items-center gap-1.5 ${className}`} onClick={(event) => event.stopPropagation()}>
      {code ? <span className="code truncate">{code}</span> : null}
      {label ? <span className="truncate text-[var(--ink)]">{label}</span> : null}
      {icon ? <Icon name="external" className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" /> : null}
    </Link>
  );
}
