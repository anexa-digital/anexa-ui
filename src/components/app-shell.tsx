import { Outlet, useNavigate } from "@tanstack/react-router";
import { useHotkeys } from "@tanstack/react-hotkeys";
import { useEffect, useMemo, type ReactNode } from "react";

import { t } from "../i18n";
import { NARROW, useMediaQuery } from "../lib/media";
import { DEFAULT_SKIN, SKIN_LAYOUT, SKINS, type Layout, type Skin } from "../lib/theme";
import { useHtmlAttribute } from "../lib/tokens";
import { installFonts } from "../styles/fonts";
import { Breadcrumbs } from "./breadcrumbs";
import { toHotkey } from "../lib/shortcuts";
import { CommandButton, CommandPalette, openCommandPalette, type Command } from "./command-palette";
import { NavMenu, type NavSection } from "./nav-menu";
import { ShellContext } from "./shell-context";
import { ShortcutProvider } from "./shortcuts";
import { Icon } from "./ui/icons";
import { ThemeMenu } from "./ui/theme-menu";
import { ConfirmProvider } from "./ui/confirm";
import { ToastProvider } from "./ui/toast";

/** The chords of the menu («g q» opens Cotizaciones): every `NavItem.keys` is registered while the shell lives. */
function NavShortcuts({ sections }: { sections: NavSection[] }) {
  const navigate = useNavigate();
  const items = sections.flatMap((section) => (section.items ?? []).filter((item) => item.keys));
  useHotkeys(
    items.map((item) => ({
      hotkey: toHotkey(item.keys!) as never,
      callback: () => void navigate({ to: item.to as never, search: item.search as never, params: item.params as never }),
      options: { timeout: 1200, meta: { name: `${t("shortcuts.goTo")} ${item.label}`, group: "navigation", keys: item.keys } },
    })),
  );
  return null;
}

/**
 * The frame of every screen: the app's name, its menu in the layout the skin proposes (or the one the app fixes), a
 * search box that opens the command palette, the theme menu, whatever the app puts at the right (the company in use,
 * the person, «Cerrar sesión»), the page, and a footer (the status bar). Toasts, shortcuts and the palette live here.
 */
export function AppShell({
  name,
  mark,
  nav,
  sections = [],
  right,
  footer,
  commands,
  layout,
  children,
}: {
  name: ReactNode;
  /** The monogram on the rail and the sidebar; the first letter of `name` when it is text. */
  mark?: ReactNode;
  /** The menu; without it, the shell draws `NavMenu` from `sections`. */
  nav?: ReactNode;
  /** The groups of the menu: what the menu, the bottom tabs of a phone and the command palette list. */
  sections?: NavSection[];
  right?: ReactNode;
  footer?: ReactNode;
  /** Commands of the app for the palette (the screens come from `sections`). */
  commands?: Command[];
  /** The chrome: the top menu bar, a rail of icons or a sidebar. Without it, the skin decides. */
  layout?: Layout;
  children?: ReactNode;
}) {
  const skinAttribute = useHtmlAttribute("data-skin");
  const skin: Skin = (SKINS as readonly string[]).includes(skinAttribute ?? "") ? (skinAttribute as Skin) : DEFAULT_SKIN;
  const effective = layout ?? SKIN_LAYOUT[skin];
  const narrow = useMediaQuery(NARROW);
  useEffect(installFonts, []);
  const state = useMemo(() => ({ layout: effective, sections }), [effective, sections]);
  const monogram = mark ?? (typeof name === "string" ? name.trim().charAt(0).toUpperCase() : null);
  const menu = nav ?? <NavMenu sections={sections} brand={monogram === null ? undefined : { name, mark: monogram }} />;
  const side = effective !== "top";
  // On a desktop the frame is the viewport: the header, the menu and the status bar stay put and only the page
  // scrolls (so a grid that fills the page keeps its pager in sight). On a phone the document scrolls, as the
  // browser's chrome expects.
  const page = <main className={`flex-1 p-4 print:p-0 ${narrow ? (side ? "pb-20" : "") : "min-h-0 overflow-auto print:overflow-visible"}`}>{children ?? <Outlet />}</main>;
  const frame = narrow ? "min-h-screen" : "h-screen print:h-auto";
  const tools = (
    <>
      {narrow ? (
        <button type="button" onClick={openCommandPalette} aria-label={t("ui.search")} title={t("ui.search")} className="flex h-[var(--control-h)] w-[var(--control-h)] items-center justify-center rounded-[var(--radius-sm)] text-[var(--muted)]">
          <Icon name="search" className="h-[18px] w-[18px]" />
        </button>
      ) : (
        <CommandButton className="w-72 max-w-[40vw]" />
      )}
      <ThemeMenu />
      {right}
    </>
  );

  return (
    <ToastProvider>
      <ShortcutProvider>
        <ConfirmProvider>
        <ShellContext.Provider value={state}>
          {side && !narrow ? (
            <div className={`flex ${frame}`}>
              <aside className="flex shrink-0 flex-col overflow-y-auto border-r border-[var(--line)] bg-[var(--surface)] print:hidden">
                {(nav || monogram === null) && <div className="flex h-11 items-center px-3 font-semibold text-[var(--accent)]">{name}</div>}
                {menu}
              </aside>
              <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-11 items-center gap-3 border-b border-[var(--line-strong)] bg-[var(--surface)] px-3 print:hidden md:gap-4 md:px-4">
                  <Breadcrumbs className="min-w-0 flex-1" />
                  <div className="ml-auto flex min-w-0 shrink-0 items-center gap-3 whitespace-nowrap">{tools}</div>
                </header>
                {page}
                {footer}
              </div>
            </div>
          ) : (
            <div className={`flex flex-col ${frame}`}>
              <header className="flex h-11 items-center gap-3 border-b border-[var(--line-strong)] bg-[var(--surface)] px-3 print:hidden md:gap-5 md:px-4">
                <span className="font-semibold text-[var(--accent)]">{name}</span>
                {!side && menu}
                <div className="ml-auto flex shrink-0 items-center gap-3 whitespace-nowrap">{tools}</div>
              </header>
              {page}
              {footer}
              {side && menu}
            </div>
          )}
          <CommandPalette pages={sections} extra={commands} />
          <NavShortcuts sections={sections} />
        </ShellContext.Provider>
        </ConfirmProvider>
      </ShortcutProvider>
    </ToastProvider>
  );
}
