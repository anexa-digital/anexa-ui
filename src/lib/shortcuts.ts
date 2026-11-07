// Keyboard shortcuts as text: "mod+k" (Ctrl on Windows and Linux, ⌘ on a Mac), "shift+enter", "?" and chords of
// single keys in sequence, "g q" (g, then q). Pure: `toHotkey` turns the text into what TanStack Hotkeys registers
// (components/shortcuts.tsx), `comboLabels` into the keys the person reads (Kbd).

export type Step = { key: string; ctrl: boolean; alt: boolean; shift: boolean; meta: boolean };
export type Combo = Step[];

const ALIASES: Record<string, string> = { esc: "escape", return: "enter", space: " ", up: "arrowup", down: "arrowdown", left: "arrowleft", right: "arrowright", plus: "+", del: "delete" };

export function isMac(platform = typeof navigator === "undefined" ? "" : navigator.platform || ""): boolean {
  return /mac|iphone|ipad|ipod/i.test(platform);
}

/** "mod+k" → one step; "g q" → two steps. */
export function parseCombo(text: string, mac = isMac()): Combo {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      const step: Step = { key: "", ctrl: false, alt: false, shift: false, meta: false };
      const tokens = part === "+" ? ["+"] : part.split("+").map((token) => token.toLowerCase());
      for (const token of tokens) {
        if (token === "mod") (mac ? (step.meta = true) : (step.ctrl = true));
        else if (token === "ctrl" || token === "control") step.ctrl = true;
        else if (token === "alt" || token === "option") step.alt = true;
        else if (token === "shift") step.shift = true;
        else if (token === "meta" || token === "cmd" || token === "command") step.meta = true;
        else step.key = ALIASES[token] ?? token;
      }
      return step;
    });
}

type KeyLike = Pick<KeyboardEvent, "key" | "ctrlKey" | "altKey" | "shiftKey" | "metaKey">;

/** Whether a key event is this step. A symbol ("?", "/") already says Shift, so Shift is not checked for it. */
export function matchesStep(step: Step, event: KeyLike): boolean {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
  const letterOrDigit = /^[a-z0-9]$/.test(step.key);
  if (key !== step.key && !(step.key.length === 1 && event.key === step.key)) return false;
  if (event.ctrlKey !== step.ctrl || event.altKey !== step.alt || event.metaKey !== step.meta) return false;
  if ((letterOrDigit || step.key.length > 1) && event.shiftKey !== step.shift) return false;
  return true;
}

/** Whether typing belongs to the target (a field): plain keys are the field's, Escape and modifier combos are not. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (target as HTMLInputElement).type;
    return !["checkbox", "radio", "button", "submit", "range", "file", "color"].includes(type);
  }
  return false;
}

const KEY_LABEL: Record<string, string> = { escape: "Esc", enter: "⏎", " ": "Espacio", arrowup: "↑", arrowdown: "↓", arrowleft: "←", arrowright: "→", backspace: "⌫", delete: "Supr", tab: "Tab", pageup: "PgUp", pagedown: "PgDn", home: "Inicio", end: "Fin" };

/** A step as the labels of its keys, in the order they are pressed: ["Ctrl", "K"] or ["⌘", "K"]. */
export function stepLabels(step: Step, mac = isMac()): string[] {
  const labels: string[] = [];
  if (step.ctrl) labels.push(mac ? "⌃" : "Ctrl");
  if (step.alt) labels.push(mac ? "⌥" : "Alt");
  if (step.shift) labels.push(mac ? "⇧" : "Mayús");
  if (step.meta) labels.push(mac ? "⌘" : "Win");
  labels.push(KEY_LABEL[step.key] ?? (step.key.length === 1 ? step.key.toUpperCase() : step.key[0]!.toUpperCase() + step.key.slice(1)));
  return labels;
}

/** Every step's labels: a chord is a list of lists ("g q" → [["G"], ["Q"]]). */
export const comboLabels = (text: string, mac = isMac()): string[][] => parseCombo(text, mac).map((step) => stepLabels(step, mac));

/** TanStack Hotkeys spells keys this way; the kit's text is case-insensitive and has a few aliases of its own. */
const HOTKEY_NAMES: Record<string, string> = {
  escape: "Escape",
  enter: "Enter",
  " ": "Space",
  space: "Space",
  tab: "Tab",
  backspace: "Backspace",
  delete: "Delete",
  arrowup: "ArrowUp",
  arrowdown: "ArrowDown",
  arrowleft: "ArrowLeft",
  arrowright: "ArrowRight",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pagedown: "PageDown",
};
const MODIFIER_ORDER = ["Mod", "Control", "Alt", "Shift", "Meta"];

/**
 * The kit's text as the hotkey TanStack Hotkeys registers: "mod+k" → "Mod+K", "g q" → ["G", "Q"], "?" → "?",
 * "shift+enter" → "Shift+Enter". `Mod` stays platform-adaptive (the library resolves it).
 */
export function toHotkey(text: string): string | string[] {
  const steps = text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      const tokens = part === "+" ? ["+"] : part.split("+").map((token) => token.toLowerCase());
      const modifiers: string[] = [];
      let key = "";
      for (const token of tokens) {
        if (token === "mod") modifiers.push("Mod");
        else if (token === "ctrl" || token === "control") modifiers.push("Control");
        else if (token === "alt" || token === "option") modifiers.push("Alt");
        else if (token === "shift") modifiers.push("Shift");
        else if (token === "meta" || token === "cmd" || token === "command") modifiers.push("Meta");
        else key = ALIASES[token] ?? token;
      }
      const name = HOTKEY_NAMES[key] ?? (key.length === 1 || /^f\d{1,2}$/.test(key) ? key.toUpperCase() : key.charAt(0).toUpperCase() + key.slice(1));
      modifiers.sort((a, b) => MODIFIER_ORDER.indexOf(a) - MODIFIER_ORDER.indexOf(b));
      return [...modifiers, name].join("+");
    });
  return steps.length === 1 ? steps[0]! : steps;
}
