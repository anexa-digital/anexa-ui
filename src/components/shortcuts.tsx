import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { t } from "../i18n";
import { comboLabels, isTypingTarget, matchesStep, parseCombo, type Combo } from "../lib/shortcuts";
import { useHtmlAttribute } from "../lib/tokens";
import { Dialog } from "./ui/dialog";

// Keyboard shortcuts of the app: one listener on the document, a registry the screens add to while they are
// mounted, chords ("g q") and a dialog on "?" that lists what is available right now. Every shortcut has a button
// too: the keys are a faster way, never the only one.

export type Shortcut = {
  id: string;
  /** "mod+k", "g q", "?" (see lib/shortcuts.ts). */
  keys: string;
  description: string;
  /** A group of the "?" dialog: shortcuts.group.* of the catalog, or the app's own key. */
  group: string;
  handler: (event: KeyboardEvent) => void;
  /** Fires even while typing in a field (Escape and modifier combos always do). */
  allowInInput?: boolean;
  /** Left out of the "?" dialog. */
  hidden?: boolean;
};

type Registry = { register: (shortcut: Shortcut) => () => void; list: () => Shortcut[]; subscribe: (listener: () => void) => () => void };
const ShortcutContext = createContext<Registry | null>(null);

/** How long a chord waits for its next key. */
const CHORD_WINDOW = 1200;

function fitsPrefix(combo: Combo, buffer: KeyboardEvent[]): boolean {
  if (buffer.length >= combo.length) return false;
  return buffer.every((event, index) => matchesStep(combo[index]!, event));
}

/** The registry is a small store outside React state, so registering never re-renders the provider (and a
 * registration inside an effect never starts another). The "?" dialog subscribes to it. */
function createRegistry(): Registry & { combos: Map<string, Combo> } {
  const shortcuts = new Map<string, Shortcut>();
  const combos = new Map<string, Combo>();
  const listeners = new Set<() => void>();
  let snapshot: Shortcut[] = [];
  const changed = () => {
    snapshot = [...shortcuts.values()];
    listeners.forEach((listener) => listener());
  };
  return {
    combos,
    register: (shortcut) => {
      shortcuts.set(shortcut.id, shortcut);
      combos.set(shortcut.id, parseCombo(shortcut.keys));
      changed();
      return () => {
        shortcuts.delete(shortcut.id);
        combos.delete(shortcut.id);
        changed();
      };
    },
    list: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function ShortcutProvider({ children }: { children: ReactNode }) {
  const registry = useMemo(createRegistry, []);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    let buffer: KeyboardEvent[] = [];
    let timer: number | undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (["Shift", "Control", "Alt", "Meta"].includes(event.key)) return;
      const typing = isTypingTarget(event.target);
      const plain = !event.ctrlKey && !event.metaKey && !event.altKey;
      window.clearTimeout(timer);
      const candidates = registry.list().filter((shortcut) => !typing || shortcut.allowInInput || event.key === "Escape" || !plain);
      const next = [...buffer, event];
      for (const shortcut of candidates) {
        const combo = registry.combos.get(shortcut.id)!;
        if (combo.length > next.length) continue;
        const tail = next.slice(next.length - combo.length);
        if (tail.every((item, index) => matchesStep(combo[index]!, item))) {
          event.preventDefault();
          buffer = [];
          shortcut.handler(event);
          return;
        }
      }
      // A chord in progress keeps the keys that still lead somewhere; anything else starts over.
      const pending = candidates.some((shortcut) => fitsPrefix(registry.combos.get(shortcut.id)!, next));
      buffer = pending ? next : [];
      if (pending) timer = window.setTimeout(() => (buffer = []), CHORD_WINDOW);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [registry]);

  // The provider's own shortcut: "?" opens the list.
  useEffect(() => registry.register({ id: "kit.help", keys: "?", description: t("shortcuts.help"), group: "general", handler: () => setHelpOpen(true) }), [registry]);

  return (
    <ShortcutContext.Provider value={registry}>
      {children}
      <ShortcutsDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </ShortcutContext.Provider>
  );
}

function useRegistry(): Registry | null {
  return useContext(ShortcutContext);
}

/** Registers a shortcut while the component is mounted; the handler may change without re-registering. */
export function useShortcut(keys: string, handler: (event: KeyboardEvent) => void, options: { description: string; group?: string; enabled?: boolean; allowInInput?: boolean; hidden?: boolean; id?: string }) {
  const registry = useRegistry();
  const latest = useRef(handler);
  latest.current = handler;
  const { description, group = "actions", enabled = true, allowInInput, hidden, id } = options;
  useEffect(() => {
    if (!registry || !enabled) return;
    return registry.register({ id: id ?? `${group}:${keys}:${description}`, keys, description, group, allowInInput, hidden, handler: (event) => latest.current(event) });
  }, [registry, keys, description, group, enabled, allowInInput, hidden, id]);
}

const NONE: Shortcut[] = [];
const noop = () => () => undefined;

/** Every shortcut registered right now, for the "?" dialog and the command palette. */
export function useShortcutsList(): Shortcut[] {
  const registry = useRegistry();
  const all = useSyncExternalStore(registry?.subscribe ?? noop, () => registry?.list() ?? NONE, () => NONE);
  return useMemo(() => all.filter((shortcut) => !shortcut.hidden), [all]);
}

/** The keys of a combo as drawn keys: Ctrl K, or G then Q. */
export function Kbd({ keys, className = "" }: { keys: string; className?: string }) {
  const steps = comboLabels(keys);
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-label={steps.map((step) => step.join("+")).join(` ${t("shortcuts.then")} `)}>
      {steps.map((step, index) => (
        <span key={index} className="inline-flex items-center gap-0.5">
          {step.map((label) => (
            <kbd key={label} className="kbd">
              {label}
            </kbd>
          ))}
        </span>
      ))}
    </span>
  );
}

/** A key next to an action, shown only when the person (or the skin) asked to see the keys. */
export function KeyHint({ keys, className = "ml-1" }: { keys: string; className?: string }) {
  const shown = useHtmlAttribute("data-keys") === "on";
  return shown ? <Kbd keys={keys} className={className} /> : null;
}

const GROUP_ORDER = ["general", "navigation", "list", "form", "actions"];

function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const shortcuts = useShortcutsList();
  const groups = [...new Set(shortcuts.map((shortcut) => shortcut.group))].sort((a, b) => (GROUP_ORDER.indexOf(a) + 1 || 99) - (GROUP_ORDER.indexOf(b) + 1 || 99));
  return (
    <Dialog open={open} title={t("shortcuts.title")} onClose={onClose}>
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <section key={group} className="flex flex-col gap-1">
            <h3 className="label">{t(`shortcuts.group.${group}`) === `shortcuts.group.${group}` ? group : t(`shortcuts.group.${group}`)}</h3>
            {shortcuts
              .filter((shortcut) => shortcut.group === group)
              .map((shortcut) => (
                <div key={shortcut.id} className="flex items-center gap-3 py-0.5">
                  <span className="min-w-0 flex-1">{shortcut.description}</span>
                  <Kbd keys={shortcut.keys} />
                </div>
              ))}
          </section>
        ))}
      </div>
    </Dialog>
  );
}
