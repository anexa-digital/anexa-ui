import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { t } from "../i18n";
import { NARROW, useMediaQuery } from "../lib/media";

// The top menu: Inicio, then the screens grouped by the work they serve. A group spans the header's height, so the one
// holding the current screen is underlined in the accent at the header's edge.
export const TOP_ENTRY =
  "flex h-full shrink-0 items-center gap-1 whitespace-nowrap px-1 hover:text-[var(--ink)] aria-expanded:text-[var(--ink)] data-[current=true]:text-[var(--ink)] data-[current=true]:shadow-[inset_0_-2px_0_var(--accent)] [&.active]:text-[var(--ink)] [&.active]:shadow-[inset_0_-2px_0_var(--accent)]";
export const ITEM =
  "flex h-7 items-center justify-between gap-3 whitespace-nowrap rounded px-2 text-[var(--ink)] hover:bg-[var(--row-hover)] [&.active]:bg-[var(--accent-soft)] [&.active]:text-[var(--accent)]";

export function Count({ total }: { total: number }) {
  return total > 0 ? <span className="ml-1 rounded bg-[var(--accent)] px-1.5 text-[11px] text-[var(--on-accent)]">{total}</span> : null;
}

/** A group of the menu: its label, the paths it holds (to underline it) and its links (styled with ITEM). */
export type NavSection = { id: string; label: string; paths: string[]; count?: number; links: ReactNode };

function Group({
  label,
  paths,
  count = 0,
  open,
  onToggle,
  onHover,
  onPick,
  children,
}: {
  label: string;
  paths: string[];
  count?: number;
  open: boolean;
  onToggle: () => void;
  onHover: () => void;
  onPick: () => void;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const current = paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  return (
    <div className="relative flex h-full">
      <button type="button" aria-expanded={open} aria-haspopup="true" data-current={current} onClick={onToggle} onMouseEnter={onHover} className={TOP_ENTRY}>
        {label}
        <Count total={count} />
        <span aria-hidden className="text-[10px] opacity-60">
          ▾
        </span>
      </button>
      {open && (
        // A click on any of its links closes the menu, also when it leads to the screen already shown.
        <div
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) onPick();
          }}
          className="absolute left-0 top-full z-40 mt-px flex min-w-48 flex-col gap-0.5 rounded-b-md border border-[var(--line-strong)] bg-[var(--raised)] p-1 shadow-[var(--shadow)]"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function NavMenu({ sections }: { sections: NavSection[] }) {
  const box = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<string | null>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const narrow = useMediaQuery(NARROW);
  const total = sections.reduce((sum, section) => sum + (section.count ?? 0), 0);

  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const group = (id: string) => ({
    open: open === id,
    onToggle: () => setOpen(open === id ? null : id),
    // Once a menu is open, pointing at another group opens that one instead, as in a desktop menu bar.
    onHover: () => open !== null && open !== id && setOpen(id),
    onPick: () => setOpen(null),
  });

  return (
    <nav ref={box} aria-label={t("nav.menu")} className="flex min-w-0 gap-3 self-stretch text-[var(--muted)]">
      <Link to="/" activeOptions={{ exact: true }} className={TOP_ENTRY}>
        {t("nav.home")}
      </Link>
      {narrow ? (
        // A phone has no room for the groups: one button lists every screen under its group's name.
        <Group label={t("nav.menuShort")} paths={sections.flatMap((section) => section.paths)} count={total} {...group("all")}>
          {sections.map((section) => (
            <div key={section.id} className="flex flex-col gap-0.5">
              <span className="px-2 pt-1 text-xs uppercase tracking-wide text-[var(--muted)]">{section.label}</span>
              {section.links}
            </div>
          ))}
        </Group>
      ) : (
        sections.map((section) => (
          <Group key={section.id} label={section.label} paths={section.paths} count={section.count ?? 0} {...group(section.id)}>
            {section.links}
          </Group>
        ))
      )}
    </nav>
  );
}
