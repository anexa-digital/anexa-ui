import type { ReactNode } from "react";

/**
 * The title bar of a screen: its name in the display face, a line of context beside it (a count, a status) and the
 * actions at the right; a second row (tabs, the filters of a list) goes in `children`. On a phone the actions wrap
 * under the title.
 */
export function PageHeader({ parent, title, subtitle, actions, children, className = "" }: { /** The screen this one hangs from (a link back), before the title. */ parent?: ReactNode; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; /** A second row under the title: tabs or filters. */ children?: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {parent ? <span className="text-[var(--muted)] [&_a:hover]:underline">{parent}</span> : null}
        <h1 className="text-lg font-semibold leading-tight tracking-[-0.01em] [font-family:var(--font-display)]">{title}</h1>
        {subtitle ? <span className="min-w-0 text-[var(--muted)]">{subtitle}</span> : null}
        {actions ? <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
