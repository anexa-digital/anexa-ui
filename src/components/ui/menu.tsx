import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { t } from "../../i18n";
import { buttonClass, iconButtonClass } from "../controls";
import { Icon, type IconName } from "./icons";
import { Kbd } from "../shortcuts";

// A dropdown menu of actions: a button that opens a list below it, arrows move, Enter runs, Esc or a click outside
// closes. One component for every menu of the kit and the apps (export, row actions, column header, the company in
// use), so they all look and behave the same.

export type MenuItem = {
  id: string;
  label: string;
  icon?: IconName;
  /** Its shortcut, drawn at the right. */
  keys?: string;
  /** Red: an action that removes or revokes. */
  danger?: boolean;
  disabled?: boolean;
  /** A thin rule above this item. */
  separator?: boolean;
  /** Shown as pressed (a current choice). */
  checked?: boolean;
  run: () => void;
};

/** The open state of a menu anchored to its trigger: closes on a click outside or Esc, returns the focus to the trigger. */
export function useMenu() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [open]);
  return { open, setOpen, box };
}

/** The list of a menu: roving focus with the arrows, Enter or Space runs, Esc closes; `role="menu"` for readers. */
/** Where a menu opens when it must float above everything (inside a grid cell): the trigger's box on the screen. */
export type MenuAnchor = { top: number; bottom: number; left: number; right: number };

export function MenuList({ items, onClose, label, align = "left", className = "", anchor }: { items: MenuItem[]; onClose: () => void; label: string; align?: "left" | "right"; className?: string; /** Floats in a fixed layer at this box instead of below its parent. */ anchor?: MenuAnchor | null }) {
  const list = useRef<HTMLDivElement>(null);
  const enabled = items.filter((item) => !item.disabled);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>("[role=menuitem]:not([aria-disabled=true])")?.focus();
  }, []);
  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    const focusable = [...(list.current?.querySelectorAll<HTMLElement>("[role=menuitem]:not([aria-disabled=true])") ?? [])];
    const index = focusable.indexOf(document.activeElement as HTMLElement);
    if (event.key === "ArrowDown") focusable[(index + 1) % focusable.length]?.focus();
    else if (event.key === "ArrowUp") focusable[(index - 1 + focusable.length) % focusable.length]?.focus();
    else if (event.key === "Home") focusable[0]?.focus();
    else if (event.key === "End") focusable.at(-1)?.focus();
    else if (event.key === "Escape") onClose();
    else if (event.key === "Tab") onClose();
    else return;
    event.preventDefault();
    event.stopPropagation();
  }
  return (
    <div
      ref={list}
      role="menu"
      aria-label={label}
      onKeyDown={keyDown}
      style={anchor ? { position: "fixed", top: anchor.bottom + 4, ...(align === "right" ? { right: window.innerWidth - anchor.right } : { left: anchor.left }) } : undefined}
      className={`${anchor ? "z-50" : `absolute top-full z-30 ${align === "right" ? "right-0" : "left-0"}`} mt-1 flex min-w-48 flex-col rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--raised)] p-1 shadow-[var(--shadow)] ${className}`}
    >
      {enabled.length === 0 && <span className="px-2 py-1 text-[var(--muted)]">{t("ui.nothingToDo")}</span>}
      {items.map((item) => (
        <div key={item.id} className="contents">
          {item.separator && <span aria-hidden className="divider my-1 border-t border-[var(--line)]" />}
          <button
            type="button"
            role="menuitem"
            aria-disabled={item.disabled || undefined}
            aria-checked={item.checked}
            disabled={item.disabled}
            tabIndex={-1}
            onClick={() => {
              if (item.disabled) return;
              onClose();
              item.run();
            }}
            className={`flex h-[var(--control-h)] w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 text-left whitespace-nowrap hover:bg-[var(--row-hover)] focus-visible:bg-[var(--row-hover)] disabled:opacity-50 ${item.danger ? "text-[var(--bad)]" : ""} ${item.checked ? "text-[var(--accent)]" : ""}`}
          >
            <span className="flex w-4 shrink-0 justify-center">{item.icon ? <Icon name={item.icon} className="h-4 w-4" /> : item.checked ? <Icon name="check" className="h-4 w-4" /> : null}</span>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.keys && <span aria-hidden className="contents"><Kbd keys={item.keys} className="ml-3" /></span>}
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * A button with a menu of actions under it. `label` names the menu (and the button when it only shows an icon);
 * `children` is what the button shows (text, an icon); `icon` alone draws a square icon button («⋯» for the actions of
 * a row).
 */
export function Menu({ label, items, icon, children, align = "left", className, menuClassName }: { label: string; items: MenuItem[]; icon?: IconName; children?: ReactNode; align?: "left" | "right"; className?: string; menuClassName?: string }) {
  const { open, setOpen, box } = useMenu();
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const toggle = () => {
    if (!open && trigger.current) setAnchor(trigger.current.getBoundingClientRect());
    setOpen(!open);
  };
  // A floating menu would drift from its trigger when the page scrolls: it closes instead.
  useEffect(() => {
    if (!open) return;
    const away = () => setOpen(false);
    window.addEventListener("scroll", away, true);
    window.addEventListener("resize", away);
    return () => {
      window.removeEventListener("scroll", away, true);
      window.removeEventListener("resize", away);
    };
  }, [open, setOpen]);
  return (
    <div ref={box} className="relative inline-flex">
      <button
        ref={trigger}
        type="button"
        id={id}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={children ? undefined : label}
        title={children ? undefined : label}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            toggle();
          }
        }}
        className={className ?? (children ? `${buttonClass} flex items-center gap-1.5` : iconButtonClass)}
      >
        {children ?? <Icon name={icon ?? "more"} className="h-4 w-4" />}
        {children && <Icon name="chevronDown" className="h-3.5 w-3.5 opacity-70" />}
      </button>
      {open && <MenuList items={items} onClose={close} label={label} align={align} className={menuClassName} anchor={anchor} />}
    </div>
  );
}
