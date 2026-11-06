import { useState, type ReactNode } from "react";

import { t, type MessageKey } from "../../i18n";
import { MODES, PALETTES, applyMode, applyPalette, currentMode, currentPalette, type Mode, type Palette } from "../../lib/theme";
import { PopoverPanel, usePopover } from "./popover";

const MODE_LABEL: Record<Mode, MessageKey> = { dark: "theme.mode.dark", light: "theme.mode.light", system: "theme.mode.system" };
const PALETTE_LABEL: Record<Palette, MessageKey> = {
  classic: "theme.palette.classic",
  graphite: "theme.palette.graphite",
  petrol: "theme.palette.petrol",
  indigo: "theme.palette.indigo",
};
// A fixed preview of each palette (ground and accent of its dark side), whatever palette is active.
const SWATCH: Record<Palette, [string, string]> = {
  classic: ["#171a21", "#5b9cff"],
  graphite: ["#1b1e24", "#e8913f"],
  petrol: ["#13232a", "#ff7a59"],
  indigo: ["#171929", "#b7e34a"],
};

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex h-7 w-full items-center gap-2 rounded px-2 text-left ${selected ? "bg-[var(--accent-soft)] text-[var(--ink)]" : "text-[var(--muted)]"}`}
    >
      {children}
    </button>
  );
}

/** Mode and palette of the screen, for this browser only; the change applies at once. */
export function ThemeMenu() {
  const { open, setOpen, box } = usePopover();
  const [mode, setMode] = useState(currentMode);
  const [palette, setPalette] = useState(currentPalette);
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={t("theme.label")}
        title={t("theme.label")}
        onClick={() => setOpen(!open)}
        className="flex h-7 items-center rounded px-1.5"
      >
        <span aria-hidden className="flex rounded-full ring-1 ring-[var(--line-strong)]">
          <span className="h-3.5 w-2 rounded-l-full" style={{ background: SWATCH[palette][0] }} />
          <span className="h-3.5 w-2 rounded-r-full" style={{ background: SWATCH[palette][1] }} />
        </span>
      </button>
      {open && (
        <PopoverPanel label={t("theme.label")} align="right" className="w-48">
          <div role="group" aria-label={t("theme.modeTitle")} className="flex flex-col gap-0.5">
            <span className="px-2 text-xs uppercase tracking-wide text-[var(--muted)]">{t("theme.modeTitle")}</span>
            {MODES.map((option) => (
              <Choice
                key={option}
                selected={mode === option}
                onClick={() => {
                  applyMode(option);
                  setMode(option);
                }}
              >
                {t(MODE_LABEL[option])}
              </Choice>
            ))}
          </div>
          <div role="group" aria-label={t("theme.paletteTitle")} className="flex flex-col gap-0.5 border-t border-[var(--line)] pt-2">
            <span className="px-2 text-xs uppercase tracking-wide text-[var(--muted)]">{t("theme.paletteTitle")}</span>
            {PALETTES.map((option) => (
              <Choice
                key={option}
                selected={palette === option}
                onClick={() => {
                  applyPalette(option);
                  setPalette(option);
                }}
              >
                <span aria-hidden className="flex">
                  <span className="h-3.5 w-2 rounded-l" style={{ background: SWATCH[option][0] }} />
                  <span className="h-3.5 w-2 rounded-r" style={{ background: SWATCH[option][1] }} />
                </span>
                {t(PALETTE_LABEL[option])}
              </Choice>
            ))}
          </div>
        </PopoverPanel>
      )}
    </div>
  );
}
