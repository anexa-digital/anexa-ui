import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useBreadcrumbTrail } from "../breadcrumbs";
import { Icon } from "./icons";

/**
 * The title bar of a screen: its name in the display face, a line of context beside it (a count, a status) and the
 * actions at the right; a second row (tabs, the filters of a list) goes in `children`. On a phone the actions wrap
 * under the title. `back` draws the link to the previous tramo of the breadcrumb trail (the list this record belongs
 * to, with the filters it had); `parent` is a link the screen builds itself.
 */
export function PageHeader({ parent, back, title, subtitle, actions, children, className = "" }: { /** The screen this one hangs from (a link back), before the title. */ parent?: ReactNode; /** The previous tramo of the trail as the link back (a detail under its list). */ back?: boolean; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; /** A second row under the title: tabs or filters. */ children?: ReactNode; className?: string }) {
  const trail = useBreadcrumbTrail();
  const previous = back ? [...trail].reverse().find((crumb, index) => index > 0 && crumb.to) : undefined;
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {previous ? (
          <Link to={previous.to as never} params={previous.params as never} search={previous.search as never} className="flex items-center gap-1 text-[var(--muted)] hover:text-[var(--ink)] hover:underline">
            <Icon name="arrowLeft" className="h-4 w-4" />
            {previous.label}
          </Link>
        ) : parent ? (
          <span className="text-[var(--muted)] [&_a:hover]:underline">{parent}</span>
        ) : null}
        <h1 className="text-lg font-semibold leading-tight tracking-[-0.01em] [font-family:var(--font-display)]">{title}</h1>
        {subtitle ? <span className="min-w-0 text-[var(--muted)]">{subtitle}</span> : null}
        {actions ? <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
