import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { t } from "../i18n";
import { NARROW, useMediaQuery } from "../lib/media";
import { useShell } from "./shell-context";
import { Icon, type IconName } from "./ui/icons";
import { KeyHint } from "./shortcuts";

// The menu of the app, from one description (`NavSection[]`) in the three layouts a skin may ask for: the top menu
// bar with groups that drop down, a rail of icons with flyouts, or a sidebar with every link in sight. On a phone the
// side layouts become tabs at the bottom and the top menu folds into one button.

/** One screen of the menu. `to` and `search` go to the router's Link; `keys` is the chord that opens it (g q). */
export type NavItem = {
  id?: string;
  label: string;
  to: string;
  search?: Record<string, unknown>;
  params?: Record<string, string>;
  icon?: IconName;
  count?: number;
  title?: string;
  keys?: string;
};

/** A group of the menu: its label, the paths it holds (to underline it), its screens (`items`, which the command
 * palette and the side layouts need) or, for a menu that draws its own links, `links`. */
export type NavSection = { id: string; label: string; paths: string[]; count?: number; icon?: IconName; items?: NavItem[]; links?: ReactNode };

export const TOP_ENTRY =
  "flex h-full shrink-0 items-center gap-1 whitespace-nowrap px-1 hover:text-[var(--ink)] aria-expanded:text-[var(--ink)] data-[current=true]:text-[var(--ink)] data-[current=true]:shadow-[inset_0_-2px_0_var(--accent)] [&.active]:text-[var(--ink)] [&.active]:shadow-[inset_0_-2px_0_var(--accent)]";
export const ITEM =
  "flex min-h-[var(--control-h)] items-center justify-between gap-3 whitespace-nowrap rounded-[var(--radius-sm)] px-2 text-[var(--ink)] hover:bg-[var(--row-hover)] [&.active]:bg-[var(--accent-soft)] [&.active]:text-[var(--accent)]";
const SIDE_ITEM =
  "flex min-h-[var(--control-h)] items-center gap-2.5 rounded-[var(--radius-sm)] px-2 text-[var(--muted)] hover:bg-[var(--row-hover)] hover:text-[var(--ink)] [&.active]:bg-[var(--accent-soft)] [&.active]:text-[var(--accent)]";

export function Count({ total }: { total: number }) {
  return total > 0 ? <span className="num ml-1 rounded-[var(--radius-pill)] bg-[var(--accent)] px-1.5 text-[11px] font-semibold text-[var(--on-accent)]">{total}</span> : null;
}

/** The icon of a section or item; without one, the first letter of its label in a small box. */
function Glyph({ icon, label, className = "h-[18px] w-[18px]" }: { icon?: IconName; label: string; className?: string }) {
  if (icon) return <Icon name={icon} className={className} />;
  return (
    <span aria-hidden className="flex h-[18px] w-[18px] items-center justify-center rounded-[var(--radius-sm)] border border-current text-[10px] font-semibold leading-none">
      {label.trim().charAt(0).toUpperCase()}
    </span>
  );
}

/** The links of a section: from its items (with icon, count and key) or the nodes the app drew. */
function Links({ section, side }: { section: NavSection; side?: boolean }) {
  if (!section.items) return <>{section.links}</>;
  return (
    <>
      {section.items.map((item) => (
        <Link key={item.id ?? item.to} to={item.to as never} search={item.search as never} params={item.params as never} title={item.title} className={side ? SIDE_ITEM : ITEM}>
          {side && <Glyph icon={item.icon} label={item.label} />}
          <span className="flex min-w-0 flex-1 items-center">
            <span className="truncate">{item.label}</span>
            {item.count ? <Count total={item.count} /> : null}
          </span>
          {item.keys && <KeyHint keys={item.keys} className="ml-auto" />}
        </Link>
      ))}
    </>
  );
}

function useClosing(open: string | null, setOpen: (value: string | null) => void, box: { current: HTMLElement | null }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => setOpen(null), [pathname, setOpen]);
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
  }, [open, setOpen, box]);
}

function useCurrent(paths: string[]): boolean {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function Group({ section, open, onToggle, onHover, onPick, children, label, count }: { section?: NavSection; open: boolean; onToggle: () => void; onHover: () => void; onPick: () => void; children: ReactNode; label: string; count: number }) {
  const current = useCurrent(section?.paths ?? []);
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
          className="absolute left-0 top-full z-40 mt-px flex min-w-48 flex-col gap-0.5 rounded-b-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--raised)] p-1 shadow-[var(--shadow)]"
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** The top menu: Inicio, then the groups; on a phone, one button that lists every screen under its group's name. */
function TopMenu({ sections, narrow }: { sections: NavSection[]; narrow: boolean }) {
  const box = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<string | null>(null);
  useClosing(open, setOpen, box);
  const total = sections.reduce((sum, section) => sum + (section.count ?? 0), 0);
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
        <Group label={t("nav.menuShort")} count={total} {...group("all")}>
          {sections.map((section) => (
            <div key={section.id} className="flex flex-col gap-0.5">
              <span className="label px-2 pt-1">{section.label}</span>
              <Links section={section} />
            </div>
          ))}
        </Group>
      ) : (
        sections.map((section) => (
          <Group key={section.id} section={section} label={section.label} count={section.count ?? 0} {...group(section.id)}>
            <Links section={section} />
          </Group>
        ))
      )}
    </nav>
  );
}

const WIDE_KEY = "anexa_nav_wide";

/** The side menu: a rail of icons whose groups open as flyouts, or, wide, every link in sight under its group. */
function SideMenu({ sections, wideByDefault, brand }: { sections: NavSection[]; wideByDefault: boolean; brand?: NavBrand }) {
  const box = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [wide, setWide] = useState(() => {
    try {
      const stored = localStorage.getItem(WIDE_KEY);
      return stored === null ? wideByDefault : stored === "1";
    } catch {
      return wideByDefault;
    }
  });
  useClosing(open, setOpen, box);
  function toggleWide() {
    setWide((value) => {
      try {
        localStorage.setItem(WIDE_KEY, value ? "0" : "1");
      } catch {
        // The choice still applies to this page.
      }
      return !value;
    });
    setOpen(null);
  }
  return (
    <nav ref={box} aria-label={t("nav.menu")} className={`flex min-h-0 flex-1 flex-col gap-0.5 p-2 ${wide ? "w-56" : "w-14 items-center"}`}>
      {brand && (
        <Link to="/" className={`mb-1.5 flex h-9 items-center gap-2.5 rounded-[var(--radius-sm)] ${wide ? "px-1" : "w-10 justify-center"}`}>
          <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] text-[15px] font-semibold leading-none text-[var(--on-accent)] [font-family:var(--font-display)]">
            {brand.mark}
          </span>
          <span className={wide ? "truncate font-semibold text-[var(--accent)]" : "sr-only"}>{brand.name}</span>
        </Link>
      )}
      <Link to="/" activeOptions={{ exact: true }} title={wide ? undefined : t("nav.home")} className={`${SIDE_ITEM} ${wide ? "" : "w-10 justify-center px-0"}`}>
        <Icon name="home" className="h-[18px] w-[18px]" />
        {wide && <span>{t("nav.home")}</span>}
      </Link>
      {sections.map((section) =>
        wide ? (
          <div key={section.id} className="flex flex-col gap-0.5 pt-2">
            <span className="label flex items-center px-2 pb-0.5">
              {section.label}
              <Count total={section.count ?? 0} />
            </span>
            <Links section={section} side />
          </div>
        ) : (
          <RailGroup key={section.id} section={section} open={open === section.id} onToggle={() => setOpen(open === section.id ? null : section.id)} onHover={() => open !== null && open !== section.id && setOpen(section.id)} onPick={() => setOpen(null)} />
        ),
      )}
      <span className="flex-1" />
      <button type="button" onClick={toggleWide} aria-label={wide ? t("nav.collapse") : t("nav.expand")} title={wide ? t("nav.collapse") : t("nav.expand")} className={`${SIDE_ITEM} ${wide ? "" : "w-10 justify-center px-0"}`}>
        <Icon name={wide ? "chevronLeft" : "chevronRight"} className="h-[18px] w-[18px]" />
        {wide && <span>{t("nav.collapse")}</span>}
      </button>
    </nav>
  );
}

/** A group of the rail: its icon names it through visible-to-readers text, never an aria-label, so a form field
 * called like the group («Producto») is still the only thing a label query finds. */
function RailGroup({ section, open, onToggle, onHover, onPick }: { section: NavSection; open: boolean; onToggle: () => void; onHover: () => void; onPick: () => void }) {
  const current = useCurrent(section.paths);
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        title={section.label}
        data-current={current}
        onClick={onToggle}
        onMouseEnter={onHover}
        className={`relative flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-[var(--muted)] hover:bg-[var(--row-hover)] hover:text-[var(--ink)] aria-expanded:bg-[var(--row-hover)] data-[current=true]:bg-[var(--accent-soft)] data-[current=true]:text-[var(--accent)]`}
      >
        <Glyph icon={section.icon} label={section.label} />
        <span className="sr-only">{section.label}</span>
        {section.count ? <span aria-hidden className="absolute right-1.5 top-1.5 h-2 w-2 rounded-[var(--radius-pill)] bg-[var(--accent)]" /> : null}
      </button>
      {open && (
        <div
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) onPick();
          }}
          className="absolute left-full top-0 z-40 ml-1 flex min-w-52 flex-col gap-0.5 rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--raised)] p-1 shadow-[var(--shadow)]"
        >
          <span className="label flex items-center px-2 pt-1 pb-0.5">
            {section.label}
            <Count total={section.count ?? 0} />
          </span>
          <Links section={section} side />
        </div>
      )}
    </div>
  );
}

const TAB = "relative flex min-h-[var(--touch)] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-[var(--muted)] data-[current=true]:text-[var(--accent)] [&.active]:text-[var(--accent)]";
const SHOWN_TABS = 3;

/** On a phone: Inicio and the first groups as tabs at the bottom; a tap opens the group's screens over the bar. */
function BottomTabs({ sections }: { sections: NavSection[] }) {
  const box = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<string | null>(null);
  useClosing(open, setOpen, box);
  const shown = sections.slice(0, SHOWN_TABS);
  const rest = sections.slice(SHOWN_TABS);
  const sheet = open === "more" ? rest : sections.filter((section) => section.id === open);
  return (
    <nav ref={box} aria-label={t("nav.menu")} className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line-strong)] bg-[var(--surface)] print:hidden">
      {open && (
        <div
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(null);
          }}
          className="max-h-[60vh] overflow-auto border-b border-[var(--line)] p-2"
        >
          {sheet.map((section) => (
            <div key={section.id} className="flex flex-col gap-0.5 pb-2">
              <span className="label flex items-center px-2 pt-1">
                {section.label}
                <Count total={section.count ?? 0} />
              </span>
              <Links section={section} side />
            </div>
          ))}
        </div>
      )}
      <div className="flex">
        <Link to="/" activeOptions={{ exact: true }} className={TAB}>
          <Icon name="home" className="h-5 w-5" />
          {t("nav.home")}
        </Link>
        {shown.map((section) => (
          <Tab key={section.id} section={section} open={open === section.id} onToggle={() => setOpen(open === section.id ? null : section.id)} />
        ))}
        {rest.length > 0 && (
          <button type="button" aria-expanded={open === "more"} onClick={() => setOpen(open === "more" ? null : "more")} className={TAB}>
            <Icon name="more" className="h-5 w-5" />
            {t("nav.more")}
          </button>
        )}
      </div>
    </nav>
  );
}

function Tab({ section, open, onToggle }: { section: NavSection; open: boolean; onToggle: () => void }) {
  const current = useCurrent(section.paths);
  return (
    <button type="button" aria-expanded={open} data-current={current} onClick={onToggle} className={TAB}>
      <Glyph icon={section.icon} label={section.label} className="h-5 w-5" />
      <span className="truncate">{section.label}</span>
      {section.count ? <span className="num absolute right-[calc(50%-18px)] top-1 rounded-[var(--radius-pill)] bg-[var(--accent)] px-1 text-[10px] font-semibold text-[var(--on-accent)]">{section.count}</span> : null}
    </button>
  );
}

/** The menu in the layout the shell chose (AppShell puts it where it goes). */
/** The app's name and its monogram, for the top of the side menu. */
export type NavBrand = { name: ReactNode; mark: ReactNode };

export function NavMenu({ sections, layout, brand }: { sections: NavSection[]; layout?: "top" | "rail" | "sidebar"; brand?: NavBrand }) {
  const shell = useShell();
  const narrow = useMediaQuery(NARROW);
  const effective = layout ?? shell.layout;
  if (effective === "top") return <TopMenu sections={sections} narrow={narrow} />;
  if (narrow) return <BottomTabs sections={sections} />;
  return <SideMenu sections={sections} wideByDefault={effective === "sidebar"} brand={brand} />;
}
