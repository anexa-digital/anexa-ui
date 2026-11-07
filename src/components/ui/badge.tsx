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

/** A state in a word, tinted by its tone: color plus text, never color alone. `dot` adds the panel light before it. */
export function Badge({ tone, children, dot, className = "" }: { tone: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] border px-1.5 py-px text-xs font-medium ${TONE_STYLE[tone]} ${className}`}>
      {dot && <i aria-hidden className="led" />}
      {children}
    </span>
  );
}

/** A traffic light (semáforo) or any state as a dot plus its word, in the tone's color: the dot glows where the skin asks. */
export function Light({ tone, children }: { tone: Tone; children: ReactNode }) {
  const color = { quiet: "text-[var(--muted)]", neutral: "text-[var(--muted)]", info: "text-[var(--accent)]", ok: "text-[var(--ok)]", warn: "text-[var(--warn)]", bad: "text-[var(--bad)]" }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap ${color}`}>
      <i aria-hidden className="led" />
      <span className="text-[var(--ink)]">{children}</span>
    </span>
  );
}
