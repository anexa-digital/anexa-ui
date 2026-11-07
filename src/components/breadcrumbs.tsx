import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { Store } from "@tanstack/store";
import { useEffect, useId, useMemo } from "react";

import { t } from "../i18n";
import { listReturnSearch } from "../lib/return-to";
import { iconButtonClass } from "./controls";
import { useShell } from "./shell-context";
import { Icon } from "./ui/icons";
import { Menu, type MenuItem } from "./ui/menu";
import { useToast } from "./ui/toast";

// Where the screen is: «Comercial / Cotizaciones / COT-1041». The first two come from the shell's sections and the
// path; a detail screen adds its own tramo with `useBreadcrumb` while it is mounted (and may offer its siblings, the
// records next to it, in a menu). The last tramo copies its link. The shell draws it at the left of the header when
// the menu is at the side; PageHeader can draw the link back from the same trail.

export type Crumb = {
  id?: string;
  label: string;
  to?: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
  /** Other records of the same list, offered under the last tramo (recent ones, neighbours). */
  siblings?: { label: string; to: string; params?: Record<string, string>; search?: Record<string, unknown> }[];
  /** Nested tramos keep this order (lower first); registration order otherwise. */
  order?: number;
};

const crumbs = new Store<Map<string, Crumb & { seq: number }>>(new Map());
let seq = 0;

/** Adds a tramo while the component is mounted (a detail screen: the record's code). */
export function useBreadcrumb(crumb: Crumb | null | undefined) {
  const generated = useId();
  const key = crumb?.id ?? generated;
  const label = crumb?.label;
  const to = crumb?.to;
  const params = JSON.stringify(crumb?.params ?? null);
  const search = JSON.stringify(crumb?.search ?? null);
  const siblings = JSON.stringify(crumb?.siblings ?? null);
  const order = crumb?.order;
  useEffect(() => {
    if (!label) return;
    const mine = ++seq;
    crumbs.setState((all) => new Map(all).set(key, { id: key, label, to, params: JSON.parse(params) ?? undefined, search: JSON.parse(search) ?? undefined, siblings: JSON.parse(siblings) ?? undefined, order, seq: mine }));
    return () => {
      crumbs.setState((all) => {
        const next = new Map(all);
        next.delete(key);
        return next;
      });
    };
  }, [key, label, to, params, search, siblings, order]);
}

export type Trail = { label: string; to?: string; params?: Record<string, string>; search?: Record<string, unknown>; siblings?: Crumb["siblings"]; /** A record (its code), not a screen. */ record?: boolean }[];

/** The whole trail, from the section to the record: what Breadcrumbs draws and PageHeader reads for its link back. */
export function useBreadcrumbTrail(): Trail {
  const { sections } = useShell();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const registered = useStore(crumbs);
  return useMemo(() => {
    const within = (path: string) => pathname === path || pathname.startsWith(`${path}/`);
    const trail: Trail = [];
    if (pathname === "/") return [{ label: t("nav.home"), to: "/" }];
    const section = sections.find((candidate) => candidate.paths.some(within));
    if (section) {
      trail.push({ label: section.label });
      const item = (section.items ?? []).filter((candidate) => within(candidate.to)).sort((a, b) => b.to.length - a.to.length)[0];
      // A record below the list goes back to the list as it was left (filters, order, page).
      if (item) trail.push({ label: item.label, to: item.to, search: pathname === item.to ? item.search : listReturnSearch(item.to, item.search ?? {}), params: item.params });
    }
    const extra = [...registered.values()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.seq - b.seq);
    for (const crumb of extra) trail.push({ label: crumb.label, to: crumb.to, params: crumb.params, search: crumb.search, siblings: crumb.siblings, record: true });
    return trail;
  }, [sections, pathname, registered]);
}

export function Breadcrumbs({ className = "" }: { className?: string }) {
  const trail = useBreadcrumbTrail();
  const toast = useToast();
  const navigate = useNavigate();
  const href = useRouterState({ select: (state) => state.location.href });
  if (trail.length === 0) return null;
  const last = trail.length - 1;
  function copy() {
    const url = `${window.location.origin}${href}`;
    void navigator.clipboard?.writeText(url).then(() => toast({ tone: "info", title: t("ui.linkCopied"), body: url }));
  }
  return (
    <nav aria-label={t("nav.breadcrumbs")} className={`group/crumbs flex min-w-0 items-center gap-1.5 text-[var(--muted)] ${className}`}>
      {trail.map((crumb, index) => {
        const current = index === last;
        const text = current ? "truncate font-medium text-[var(--ink)]" : "truncate hover:text-[var(--ink)]";
        const siblings: MenuItem[] = (crumb.siblings ?? []).map((sibling) => ({ id: sibling.to + JSON.stringify(sibling.params ?? {}), label: sibling.label, run: () => void navigate({ to: sibling.to as never, params: sibling.params as never, search: sibling.search as never }) }));
        return (
          <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
            {index > 0 && (
              <span aria-hidden className="opacity-60">
                /
              </span>
            )}
            {crumb.to && !current ? (
              <Link to={crumb.to as never} search={crumb.search as never} params={crumb.params as never} className={text}>
                {crumb.label}
              </Link>
            ) : (
              <span className={`${text} ${current && crumb.record ? "code" : ""}`} aria-current={current ? "page" : undefined}>
                {crumb.label}
              </span>
            )}
            {current && siblings.length > 0 && <Menu label={t("ui.recent")} icon="chevronDown" items={siblings} className={`${iconButtonClass} h-5 w-5`} />}
            {current && (
              <button type="button" onClick={copy} aria-label={t("ui.copyLink")} title={t("ui.copyLink")} className={`${iconButtonClass} h-5 w-5 opacity-0 group-hover/crumbs:opacity-100 focus-visible:opacity-100`}>
                <Icon name="link" className="h-3.5 w-3.5" />
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
