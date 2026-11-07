import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { t } from "../i18n";
import { fuzzyFilter } from "../lib/fuzzy";
import type { NavSection } from "./nav-menu";
import { Kbd, useShortcut } from "./shortcuts";
import { Icon, type IconName } from "./ui/icons";

// The command palette: Ctrl/⌘ K opens it from any screen; type to find a screen (from the menu's sections) or a
// command (what the app registered), arrows and Enter run it. The last ones used come first.

export type Command = {
  id: string;
  label: string;
  /** palette.pages, palette.commands or the app's own group key. */
  group?: string;
  /** Other words the person may type for it. */
  keywords?: string;
  /** Its shortcut, shown at the right. */
  keys?: string;
  icon?: IconName;
  run: () => void;
};

const commands = new Map<string, Command>();
const listeners = new Set<() => void>();
let snapshot: Command[] = [];
function changed() {
  snapshot = [...commands.values()];
  listeners.forEach((listener) => listener());
}

/** Adds commands to the palette while the caller keeps them (returns the function that removes them). */
export function registerCommands(list: Command[]): () => void {
  for (const command of list) commands.set(command.id, command);
  changed();
  return () => {
    for (const command of list) commands.delete(command.id);
    changed();
  };
}

/** Registers commands while the component is mounted. */
export function useCommands(list: Command[]) {
  useEffect(() => registerCommands(list), [list]);
}

function useRegistered(): Command[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => snapshot,
    () => snapshot,
  );
}

// Open state, shared so the header's button (or any code) can open the palette.
let wanted = false;
const openListeners = new Set<() => void>();
function setWanted(value: boolean) {
  wanted = value;
  openListeners.forEach((listener) => listener());
}
/** Opens the palette from code (the header's button). */
export const openCommandPalette = () => setWanted(true);
function useWanted(): boolean {
  return useSyncExternalStore(
    (listener) => {
      openListeners.add(listener);
      return () => openListeners.delete(listener);
    },
    () => wanted,
    () => false,
  );
}

const RECENT_KEY = "anexa_recent_commands";
const RECENT_MAX = 8;

function recent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function remember(id: string) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...recent().filter((item) => item !== id)].slice(0, RECENT_MAX)));
  } catch {
    // Without storage the palette simply forgets.
  }
}

/** The screens of the menu as commands: "Ir a" each link the person may use. */
export function pageCommands(sections: NavSection[], navigate: (to: string, search?: Record<string, unknown>, params?: Record<string, string>) => void): Command[] {
  return sections.flatMap((section) =>
    (section.items ?? []).map((item) => ({
      id: `page:${item.id ?? item.to}`,
      label: item.label,
      group: "pages",
      keywords: section.label,
      icon: item.icon ?? section.icon,
      keys: item.keys,
      run: () => navigate(item.to, item.search, item.params),
    })),
  );
}

/** The button of the header that opens the palette, looking like the search box it is. */
export function CommandButton({ onClick = openCommandPalette, className = "" }: { onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("shortcuts.palette")}
      className={`flex h-[var(--control-h)] min-w-0 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--field)] px-2 text-left text-[var(--muted)] ${className}`}
    >
      <span aria-hidden className="shrink-0">
        ⌕
      </span>
      <span className="min-w-0 flex-1 truncate">{t("palette.placeholder")}</span>
      <Kbd keys="mod+k" className="hidden md:inline-flex" />
    </button>
  );
}

export function CommandPalette({ pages, extra = [] }: { pages: NavSection[]; extra?: Command[] }) {
  const navigate = useNavigate();
  const registered = useRegistered();
  const open = useWanted();
  const setOpen = setWanted;
  const [text, setText] = useState("");
  const [active, setActive] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  useShortcut("mod+k", () => setOpen(!wanted), { id: "kit.palette", description: t("shortcuts.palette"), group: "general", allowInInput: true });

  const all = useMemo(() => {
    const go = (to: string, search?: Record<string, unknown>, params?: Record<string, string>) => void navigate({ to: to as never, search: search as never, params: params as never });
    return [...pageCommands(pages, go), ...extra, ...registered];
  }, [pages, extra, registered, navigate]);

  const shown = useMemo(() => {
    if (!text.trim()) {
      const ids = recent();
      const recents = ids.flatMap((id) => all.filter((command) => command.id === id));
      return [...recents, ...all.filter((command) => !ids.includes(command.id))];
    }
    return fuzzyFilter(all, text, (command) => `${command.label} ${command.keywords ?? ""}`);
  }, [all, text]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      setText("");
      setActive(0);
      requestAnimationFrame(() => input.current?.focus());
    }
    if (!open && element.open) element.close();
  }, [open]);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function run(command: Command) {
    setOpen(false);
    remember(command.id);
    command.run();
  }

  const isRecent = (command: Command) => !text.trim() && recent().includes(command.id);
  let lastGroup: string | null = null;

  return (
    <dialog
      ref={dialog}
      aria-label={t("palette.label")}
      onClose={() => setOpen(false)}
      onCancel={(event) => {
        event.preventDefault();
        setOpen(false);
      }}
      className="palette-in m-0 mx-auto mt-[12vh] w-[min(40rem,92vw)] rounded-[var(--radius-lg)] border border-[var(--line-strong)] bg-[var(--raised)] p-0 text-[var(--ink)] shadow-[var(--shadow)] backdrop:bg-[var(--overlay)] max-md:mt-0 max-md:h-dvh max-md:max-h-dvh max-md:w-screen max-md:max-w-none max-md:rounded-none"
    >
      {open && (
        <div className="flex max-h-[70vh] flex-col max-md:max-h-dvh">
          <div className="flex items-center gap-2 border-b border-[var(--line)] px-3">
            <span aria-hidden className="text-[var(--muted)]">
              ⌕
            </span>
            <input
              ref={input}
              role="combobox"
              aria-expanded="true"
              aria-controls="anexa-palette-list"
              aria-activedescendant={shown[active] ? `anexa-palette-${active}` : undefined}
              aria-autocomplete="list"
              value={text}
              placeholder={t("palette.placeholder")}
              onChange={(event) => {
                setText(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActive((value) => Math.min(value + 1, shown.length - 1));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((value) => Math.max(value - 1, 0));
                } else if (event.key === "Enter" && shown[active]) {
                  event.preventDefault();
                  run(shown[active]);
                }
              }}
              className="h-[var(--touch)] min-h-[40px] w-full bg-transparent outline-none"
            />
            <Kbd keys="escape" className="hidden md:inline-flex" />
          </div>
          <ul id="anexa-palette-list" ref={list} role="listbox" className="flex-1 overflow-auto p-1">
            {shown.length === 0 && <li className="px-3 py-6 text-center text-[var(--muted)]">{t("palette.empty", { text })}</li>}
            {shown.map((command, index) => {
              const group = isRecent(command) ? "recent" : (command.group ?? "commands");
              const heading = group !== lastGroup;
              lastGroup = group;
              return (
                <li key={command.id} className="contents">
                  {heading && <div className="label px-2 pt-2 pb-1">{t(`palette.${group}`) === `palette.${group}` ? group : t(`palette.${group}`)}</div>}
                  <div
                    id={`anexa-palette-${index}`}
                    role="option"
                    aria-selected={index === active}
                    data-index={index}
                    onMouseEnter={() => setActive(index)}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      run(command);
                    }}
                    className={`flex min-h-[var(--touch)] cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 ${index === active ? "bg-[var(--accent-soft)] text-[var(--ink)]" : ""}`}
                  >
                    <span className="flex w-5 shrink-0 justify-center text-[var(--muted)]">{command.icon ? <Icon name={command.icon} className="h-4 w-4" /> : <span aria-hidden>›</span>}</span>
                    <span className="min-w-0 flex-1 truncate">{command.label}</span>
                    {command.keys && <Kbd keys={command.keys} />}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-[var(--line)] px-3 py-1.5 text-xs text-[var(--muted)]">{t("palette.hint")}</div>
        </div>
      )}
    </dialog>
  );
}
