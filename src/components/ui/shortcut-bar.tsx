import { useShortcut, Kbd } from "../shortcuts";
import type { Tone } from "./badge";

// The bar of a workstation that is run from the keyboard: the few actions of the screen, each with its key
// always drawn (not only when the person asked to see keys), in the order the work happens. Each one is a real
// button too, so the pointer and assistive technology reach the same actions.

export type BarAction = {
  /** "f2", "mod+enter", "escape" (see lib/shortcuts.ts). Function keys fire while typing in a field. */
  keys: string;
  label: string;
  run: () => void;
  disabled?: boolean;
  /** Why it is disabled, shown as the button's title. */
  reason?: string;
  /** `info` marks the next step of the flow; `bad` a destructive one. */
  tone?: Extract<Tone, "neutral" | "info" | "bad">;
  /** A group of the "?" dialog; the bar's own by default. */
  group?: string;
};

const TONE: Record<NonNullable<BarAction["tone"]>, string> = {
  neutral: "border-[var(--line-strong)] bg-[var(--raised)] text-[var(--ink)]",
  info: "border-transparent bg-[var(--accent)] text-[var(--on-accent)] kbd-on-accent",
  bad: "border-[var(--line-strong)] bg-[var(--raised)] text-[var(--bad)]",
};

function BarButton({ action, group }: { action: BarAction; group: string }) {
  const enabled = !action.disabled;
  useShortcut(
    action.keys,
    (event) => {
      // A function key has a browser meaning (F5 reloads, F3 searches): here it is the screen's.
      event.preventDefault();
      action.run();
    },
    { description: action.label, group: action.group ?? group, enabled, allowInInput: true },
  );
  return (
    <button
      type="button"
      onClick={action.run}
      disabled={!enabled}
      title={!enabled ? action.reason : undefined}
      className={`flex h-[var(--control-h)] shrink-0 items-center gap-2 rounded-[var(--radius-sm)] border px-2 font-medium disabled:opacity-45 ${TONE[action.tone ?? "neutral"]}`}
    >
      <span aria-hidden className="contents">
        <Kbd keys={action.keys} />
      </span>
      <span>{action.label}</span>
    </button>
  );
}

/**
 * A fixed row of keyed actions. It registers each shortcut while mounted, so the "?" dialog lists them, and a
 * dialog that opens over the screen suspends them like any other.
 */
export function ShortcutBar({ actions, label, group = "actions", className = "" }: { actions: BarAction[]; label: string; group?: string; className?: string }) {
  return (
    <div role="toolbar" aria-label={label} className={`flex items-center gap-2 overflow-x-auto border-t border-[var(--line-strong)] bg-[var(--surface)] px-3 py-2 print:hidden ${className}`}>
      {actions.map((action) => (
        <BarButton key={action.keys} action={action} group={group} />
      ))}
    </div>
  );
}
