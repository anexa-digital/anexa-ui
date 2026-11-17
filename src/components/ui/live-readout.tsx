import { useEffect, useRef, useState, type ReactNode } from "react";

import { t } from "../../i18n";

// What an instrument can be doing when its value is read (a scale, a meter, a counter): each app maps its
// device's states onto these.
export type ReadoutState = "stable" | "moving" | "no-signal" | "out-of-range" | "off";

const STATE_KEY: Record<ReadoutState, string> = {
  stable: "readout.stable",
  moving: "readout.moving",
  "no-signal": "readout.noSignal",
  "out-of-range": "readout.outOfRange",
  off: "readout.off",
};

const STATE_COLOR: Record<ReadoutState, string> = {
  stable: "text-[var(--ok)]",
  moving: "text-[var(--warn)]",
  "no-signal": "text-[var(--bad)]",
  "out-of-range": "text-[var(--bad)]",
  off: "text-[var(--muted)]",
};

const SIZE = {
  md: { figure: "text-4xl", unit: "text-lg", pad: "p-3" },
  lg: { figure: "text-6xl", unit: "text-2xl", pad: "p-4" },
  xl: { figure: "text-8xl", unit: "text-3xl", pad: "p-5" },
};

/** What a screen reader hears when the value comes to rest; nothing while it moves. */
export function readoutAnnouncement(state: ReadoutState, value: string | null, unit: string): string {
  if (state === "stable" && value !== null) return `${value} ${unit}, ${t(STATE_KEY.stable)}`.trim();
  if (state === "no-signal" || state === "out-of-range") return t(STATE_KEY[state]);
  return "";
}

/**
 * The live value of an instrument, large enough to read from across the desk, with its state in a word and a
 * light. The figure changes many times a second, so it is silent to screen readers; a polite region speaks only
 * when the value comes to rest or the signal is lost.
 */
export function LiveReadout({
  label,
  value,
  unit = "",
  state,
  size = "lg",
  hint,
  children,
  className = "",
}: {
  label: string;
  /** Already formatted by the app (separators, decimals); null when there is nothing to show. */
  value: string | null;
  unit?: string;
  state: ReadoutState;
  size?: keyof typeof SIZE;
  /** A short line under the state: who controls the instrument, why it is off. */
  hint?: ReactNode;
  /** Actions beside the reading (take control, capture). */
  children?: ReactNode;
  className?: string;
}) {
  const sizes = SIZE[size];
  const shown = state === "stable" || state === "moving" ? value : null;
  const announcement = readoutAnnouncement(state, value, unit);
  // Spoken once the value has held for a moment: a brief rest between two movements is not worth a sentence.
  const [spoken, setSpoken] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSpoken(announcement), announcement ? 700 : 0);
    return () => clearTimeout(timer.current);
  }, [announcement]);

  return (
    <section
      aria-label={label}
      data-state={state}
      className={`flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] ${sizes.pad} ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="label">{label}</span>
        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium ${STATE_COLOR[state]}`}>
          <i aria-hidden className="led" />
          <span data-readout-state>{t(STATE_KEY[state])}</span>
        </span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <p aria-hidden className={`num flex min-w-0 items-baseline gap-2 font-semibold leading-none ${state === "moving" ? "text-[var(--muted)]" : "text-[var(--ink)]"}`}>
          <span data-readout-value className={`${sizes.figure} truncate`}>
            {shown ?? "— — —"}
          </span>
          {unit && shown !== null && <span className={`${sizes.unit} font-medium text-[var(--muted)]`}>{unit}</span>}
        </p>
        {children && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{children}</div>}
      </div>
      {hint && <p className="text-xs text-[var(--muted)]">{hint}</p>}
      <span role="status" aria-live="polite" className="sr-only">
        {spoken}
      </span>
    </section>
  );
}
