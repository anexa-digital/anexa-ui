import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { t } from "../../i18n";
import { NARROW, useMediaQuery } from "../../lib/media";
import { iconButtonClass } from "../controls";
import { Icon } from "./icons";
import { useShortcut } from "../shortcuts";

// The side panel of a list: a record opens or is created at the right of the grid without leaving the list (the
// design's 380 px panel). It lives in the page, not over it: the grid keeps working, the URL says what is open
// (`?edit=<id>`), Esc closes it, the width is dragged and remembered per `id`. On a phone it takes the whole screen.

const KEY = (id: string) => `anexa_drawer_${id}`;

/** A form inside a drawer registers how to leave it (its dirty guard), so the drawer's × and Esc ask first too. */
type Guard = { set: (close: (() => Promise<void> | void) | null) => void };
const DrawerGuardContext = createContext<Guard | null>(null);
export const useDrawerGuard = () => useContext(DrawerGuardContext);
const STEP = 16;

/**
 * Lay the page out as `<div className="flex min-h-0 flex-1 gap-[var(--gap)]">{grid}<Drawer …/></div>`: the drawer is
 * the last flex child. `title` names it for readers (`role="dialog"`, not modal). `footer` holds the buttons.
 */
export function Drawer({
  id,
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  initial = 380,
  min = 300,
  max = 720,
  busy,
}: {
  id: string;
  open: boolean;
  title: ReactNode;
  /** The record's context at the right of the title («rev 3»). */
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  initial?: number;
  min?: number;
  max?: number;
  /** While saving: the close button is disabled. */
  busy?: boolean;
}) {
  const narrow = useMediaQuery(NARROW);
  const scope = `drawer-${useId()}`;
  const box = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(() => {
    try {
      const stored = Number(localStorage.getItem(KEY(id)));
      return stored >= min && stored <= max ? stored : initial;
    } catch {
      return initial;
    }
  });
  const dragging = useRef<{ x: number; width: number } | null>(null);
  const guarded = useRef<(() => Promise<void> | void) | null>(null);
  const guard = useRef<Guard>({ set: (close) => (guarded.current = close) }).current;
  const requestClose = () => void (guarded.current ? guarded.current() : onClose());
  const clamp = useCallback((value: number) => Math.max(min, Math.min(max, Math.round(value))), [min, max]);
  useEffect(() => {
    try {
      localStorage.setItem(KEY(id), String(width));
    } catch {
      // The width still applies to this page.
    }
  }, [id, width]);
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragging.current) return;
      setWidth(clamp(dragging.current.width - (event.clientX - dragging.current.x)));
    };
    const stop = () => (dragging.current = null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
  }, [clamp]);
  // The focus goes to the panel when it opens, so Esc and the form's keys work at once.
  useEffect(() => {
    if (open) requestAnimationFrame(() => box.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-close])")?.focus());
  }, [open]);
  if (!open) return null;
  return (
    <HotkeysProvider scope={scope} exclusive={{ allow: ["global"] }}>
      <DrawerKeys onClose={requestClose} />
      <aside
        ref={box}
        role="dialog"
        aria-modal={narrow || undefined}
        aria-labelledby={`${scope}-title`}
        className={`drawer-in relative flex shrink-0 flex-col rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] ${narrow ? "fixed inset-0 z-40 rounded-none" : "min-h-0"}`}
        style={narrow ? undefined : { width }}
      >
        {!narrow && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={t("ui.resize")}
            aria-valuenow={width}
            aria-valuemin={min}
            aria-valuemax={max}
            tabIndex={0}
            onPointerDown={(event) => {
              dragging.current = { x: event.clientX, width };
              event.preventDefault();
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") setWidth(clamp(width + STEP));
              else if (event.key === "ArrowRight") setWidth(clamp(width - STEP));
              else return;
              event.preventDefault();
            }}
            className="absolute top-0 -left-1.5 z-10 h-full w-3 cursor-col-resize select-none hover:bg-[var(--accent-soft)] focus-visible:bg-[var(--accent-soft)]"
          />
        )}
        <header className="flex items-center gap-2 border-b border-[var(--line)] px-3 py-2">
          <h2 id={`${scope}-title`} className="min-w-0 truncate text-[13px] font-semibold [font-family:var(--font-display)]">
            {title}
          </h2>
          {subtitle && <span className="num min-w-0 truncate text-xs text-[var(--muted)]">{subtitle}</span>}
          <button type="button" data-close onClick={requestClose} disabled={busy} aria-label={t("ui.close")} title={`${t("ui.close")} (Esc)`} className={`${iconButtonClass} ml-auto`}>
            <Icon name="close" className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-3">
          <DrawerGuardContext.Provider value={guard}>{children}</DrawerGuardContext.Provider>
        </div>
        {footer && <footer className="flex flex-wrap items-center gap-2 border-t border-[var(--line)] px-3 py-2">{footer}</footer>}
      </aside>
    </HotkeysProvider>
  );
}

/** Esc closes the drawer from anywhere in the page while it is open (a form inside handles its own Esc first). */
function DrawerKeys({ onClose }: { onClose: () => void }) {
  useShortcut("escape", onClose, { description: t("shortcuts.formCancel"), group: "form", hidden: true, allowInInput: true });
  return null;
}

/** «Guardado hace 2 min»: the autosave line of a drawer's footer, refreshed every half minute. */
export function SavedAt({ at }: { at: number | null | undefined }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => tick((value) => value + 1), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  if (!at) return null;
  const minutes = Math.round((Date.now() - at) / 60_000);
  return <span className="text-xs text-[var(--muted)]">{minutes < 1 ? t("form.savedNow") : t("form.savedAgo", { minutes })}</span>;
}

/** The footer of a drawer that edits: autosave text at the left, Cancelar (Esc) and the primary at the right. */
export function DrawerActions({ savedAt, children }: { savedAt?: number | null; children: ReactNode }) {
  return (
    <>
      <SavedAt at={savedAt} />
      <span className="ml-auto flex flex-wrap items-center gap-2">{children}</span>
    </>
  );
}

