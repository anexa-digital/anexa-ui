import type { ReactNode } from "react";

import { t } from "../../i18n";

/**
 * The bar over a list or a panel: search and filters at the left, the tools (views, columns, export, refresh) at the
 * right; it wraps on a phone. The grids use it by default; a screen adds its own controls through `children`.
 */
export function Toolbar({ children, right, label, className = "" }: { children?: ReactNode; right?: ReactNode; label?: string; className?: string }) {
  return (
    <div role="toolbar" aria-label={label ?? t("grid.toolbar")} className={`flex flex-wrap items-center gap-[var(--gap)] ${className}`}>
      {children}
      {right && <div className="ml-auto flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

/** A thin rule between groups of a toolbar; dashed or dotted in the skins that draw them so. */
export function ToolbarDivider() {
  return <span aria-hidden className="divider h-5 border-l border-[var(--line-strong)]" />;
}
