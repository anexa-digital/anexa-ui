import { Link, useRouterState } from "@tanstack/react-router";

import { t } from "../i18n";
import { useShell } from "./shell-context";

/** Where the screen is in the menu: «Comercial / Cotizaciones», from the shell's sections and the path; the shell
 * puts it at the left of the header when the menu is at the side. */
export function Breadcrumbs({ className = "" }: { className?: string }) {
  const { sections } = useShell();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const within = (path: string) => pathname === path || pathname.startsWith(`${path}/`);
  if (pathname === "/") return <span className={`font-medium text-[var(--ink)] ${className}`}>{t("nav.home")}</span>;
  const section = sections.find((candidate) => candidate.paths.some(within));
  if (!section) return null;
  const item = (section.items ?? []).filter((candidate) => within(candidate.to)).sort((a, b) => b.to.length - a.to.length)[0];
  return (
    <nav aria-label={t("nav.breadcrumbs")} className={`flex min-w-0 items-center gap-1.5 text-[var(--muted)] ${className}`}>
      <span className="truncate">{section.label}</span>
      {item && (
        <>
          <span aria-hidden className="opacity-60">
            /
          </span>
          <Link to={item.to as never} search={item.search as never} params={item.params as never} className="truncate font-medium text-[var(--ink)]">
            {item.label}
          </Link>
        </>
      )}
    </nav>
  );
}
