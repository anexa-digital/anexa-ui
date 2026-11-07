import type { ReactNode } from "react";

// The few tones a state can take, the same in every screen: each domain maps its own states onto them.
export type Tone = "quiet" | "neutral" | "info" | "ok" | "warn" | "bad";

const TONE_STYLE: Record<Tone, string> = {
  quiet: "border-[var(--line)] text-[var(--muted)]",
  neutral: "border-[var(--line-strong)] bg-[var(--head)] text-[var(--ink)]",
  info: "border-transparent bg-[var(--accent-soft)] text-[var(--accent)]",
  ok: "border-transparent bg-[var(--ok-soft)] text-[var(--ok)]",
  warn: "border-transparent bg-[var(--warn-soft)] text-[var(--warn)]",
  bad: "border-transparent bg-[var(--bad-soft)] text-[var(--bad)]",
};

/** A state in a word, tinted by its tone: color plus text, never color alone. */
export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-[var(--radius-sm)] border px-1.5 py-px text-xs font-medium ${TONE_STYLE[tone]}`}>{children}</span>;
}
