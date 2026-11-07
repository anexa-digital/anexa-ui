import { HotkeysProvider, useHotkey, useHotkeyRegistrations, type UseHotkeyOptions } from "@tanstack/react-hotkeys";
import { useMemo, useState, type ReactNode, type RefObject } from "react";

import { t } from "../i18n";
import { comboLabels, toHotkey } from "../lib/shortcuts";
import { useHtmlAttribute } from "../lib/tokens";
import { Dialog } from "./ui/dialog";

// Keyboard shortcuts of the app, on TanStack Hotkeys: the screens register theirs while they are mounted
// (`useShortcut`), a dialog or a drawer owns the keyboard while it is open (its scope is exclusive, see ui/dialog.tsx),
// the palette and the help stay global, and "?" lists what is registered right now. Every shortcut has a button
// too: the keys are a faster way, never the only one.

declare module "@tanstack/react-hotkeys" {
  interface HotkeyMeta {
    /** The kit's text of the keys ("mod+k", "g q"), drawn by Kbd. */
    keys?: string;
    /** Left out of the "?" dialog. */
    hidden?: boolean;
  }
}

export type Shortcut = {
  id: string;
  /** "mod+k", "g q", "?" (see lib/shortcuts.ts). */
  keys: string;
  description: string;
  /** A group of the "?" dialog: shortcuts.group.* of the catalog, or the app's own key. */
  group: string;
};

/** The scope every screen's shortcuts live in; a dialog suspends it while open. */
export const APP_SCOPE = "app";
/** How long a chord waits for its next key. */
const CHORD_WINDOW = 1200;

export function ShortcutProvider({ children }: { children: ReactNode }) {
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <HotkeysProvider scope={APP_SCOPE}>
      {children}
      <HelpKey onToggle={() => setHelpOpen((value) => !value)} />
      <ShortcutsDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </HotkeysProvider>
  );
}

/** "?" opens (and closes) the list, from anywhere: global, so it works over a dialog too. */
function HelpKey({ onToggle }: { onToggle: () => void }) {
  useShortcut("?", onToggle, { id: "kit.help", description: t("shortcuts.help"), group: "general", global: true });
  return null;
}

export type ShortcutOptions = {
  description: string;
  /** A group of the "?" dialog (general, navigation, list, form, actions, or the app's own). */
  group?: string;
  enabled?: boolean;
  /** Fires even while typing in a field (Escape and Ctrl/⌘ combos always do). */
  allowInInput?: boolean;
  /** Left out of the "?" dialog. */
  hidden?: boolean;
  id?: string;
  /** Keeps working while a dialog owns the keyboard (the palette, the help). */
  global?: boolean;
  /** Only while the focus is inside this element (a form, a grid). */
  target?: RefObject<HTMLElement | null>;
};

/** Registers a shortcut while the component is mounted; the handler may change freely (it is read on every key). */
export function useShortcut(keys: string, handler: (event: KeyboardEvent) => void, options: ShortcutOptions) {
  const { description, group = "actions", enabled = true, allowInInput, hidden, global, target } = options;
  const hotkey = useMemo(() => toHotkey(keys), [keys]);
  const settings: UseHotkeyOptions & { timeout?: number } = {
    enabled,
    ignoreInputs: allowInInput ? false : "auto",
    meta: { name: description, group, keys, hidden },
    ...(Array.isArray(hotkey) ? { timeout: CHORD_WINDOW } : {}),
    ...(global ? { scope: "global" } : {}),
    ...(target ? { target } : {}),
  };
  useHotkey(hotkey as never, (event: KeyboardEvent) => handler(event), settings as never);
}

/** Every shortcut registered right now that the person may read about (the "?" dialog, the palette). */
export function useShortcutsList(): Shortcut[] {
  const registrations = useHotkeyRegistrations();
  return useMemo(() => {
    const seen = new Set<string>();
    const list: Shortcut[] = [];
    for (const registration of registrations) {
      const meta = registration.options.meta;
      if (!meta?.name || !meta.keys || meta.hidden || registration.status === "disabled") continue;
      const key = `${meta.group ?? ""}:${meta.keys}:${meta.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({ id: registration.id, keys: meta.keys, description: meta.name, group: meta.group ?? "actions" });
    }
    return list;
  }, [registrations]);
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
  // A visual hint: hidden from readers so the button keeps its own name («Guardar», not «Guardar Ctrl ⏎»); the «?»
  // dialog lists every key with its description.
  return shown ? (
    <span aria-hidden className="contents">
      <Kbd keys={keys} className={className} />
    </span>
  ) : null;
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
