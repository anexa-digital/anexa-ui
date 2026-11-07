import { useState, type ReactNode } from "react";

import { t } from "../../i18n";
import { DENSITIES, MODES, SKINS, applyDensity, applyMode, applyShowKeys, applySkin, currentDensity, currentMode, currentShowKeys, currentSkin, previewSkin, type Density, type Mode, type Skin } from "../../lib/theme";
import { PopoverPanel, usePopover } from "./popover";

// A fixed preview of each skin (paper, surface, accent and second voice of its native mode), whatever skin is active.
const SWATCH: Record<Skin, [string, string, string, string]> = {
  cockpit: ["#0d0f12", "#14171c", "#c6f432", "#67d4ff"],
  ledger: ["#f7f4ee", "#ffffff", "#1f3a93", "#8a4b1f"],
  terminal: ["#0b0c0b", "#121412", "#f5b341", "#5fe38a"],
  studio: ["#f3f5f6", "#ffffff", "#0e7490", "#e85d3a"],
  blueprint: ["#eef3f8", "#ffffff", "#0b63c7", "#0891b2"],
  classic: ["#f3f3f9", "#ffffff", "#4d7c0f", "#4f46e5"],
};

function Swatch({ skin, large }: { skin: Skin; large?: boolean }) {
  const [paper, surface, accent, second] = SWATCH[skin];
  const size = large ? "h-6 w-10" : "h-3.5 w-6";
  return (
    <span aria-hidden className={`grid shrink-0 grid-cols-[1fr_1fr_1fr_1fr] overflow-hidden rounded-[var(--radius-sm)] ring-1 ring-[var(--line-strong)] ${size}`}>
      <span style={{ background: paper }} />
      <span style={{ background: surface }} />
      <span style={{ background: accent }} />
      <span style={{ background: second }} />
    </span>
  );
}

function Choice({ selected, onClick, onHover, onLeave, children }: { selected: boolean; onClick: () => void; onHover?: () => void; onLeave?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      className={`flex min-h-[var(--control-h)] w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 text-left ${selected ? "bg-[var(--accent-soft)] text-[var(--ink)]" : "text-[var(--muted)]"}`}
    >
      {children}
    </button>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={title} className="divider flex flex-col gap-0.5 border-t border-[var(--line)] pt-2 first:border-t-0 first:pt-0">
      <span className="label px-2">{title}</span>
      {children}
    </div>
  );
}

/** Skin, mode, density and visible keys of the screen, for this browser only; the change applies at once and a
 * skin shows itself while the pointer rests on it. */
export function ThemeMenu() {
  const { open, setOpen, box } = usePopover();
  const [skin, setSkin] = useState(currentSkin);
  const [mode, setMode] = useState(currentMode);
  const [density, setDensity] = useState(currentDensity);
  const [keys, setKeys] = useState(currentShowKeys);
  return (
    <div ref={box} className="relative">
      <button type="button" aria-expanded={open} aria-label={t("theme.label")} title={t("theme.label")} onClick={() => setOpen(!open)} className="flex h-[var(--control-h)] items-center rounded-[var(--radius-sm)] px-1.5">
        <Swatch skin={skin} />
      </button>
      {open && (
        <PopoverPanel label={t("theme.label")} align="right" className="w-64">
          <Group title={t("theme.skinTitle")}>
            {SKINS.map((option) => (
              <Choice
                key={option}
                selected={skin === option}
                onHover={() => previewSkin(option)}
                onLeave={() => previewSkin(null)}
                onClick={() => {
                  applySkin(option);
                  setSkin(option);
                  setMode(currentMode());
                  setKeys(currentShowKeys());
                }}
              >
                <Swatch skin={option} large />
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="text-[var(--ink)]">{t(`theme.skin.${option}`)}</span>
                  <span className="truncate text-xs text-[var(--muted)]">{t(`theme.skinHint.${option}`)}</span>
                </span>
              </Choice>
            ))}
          </Group>
          <Group title={t("theme.modeTitle")}>
            <div className="flex gap-1 px-1">
              {MODES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={mode === option}
                  onClick={() => {
                    applyMode(option);
                    setMode(option);
                  }}
                  className={`h-[var(--control-h-sm)] flex-1 rounded-[var(--radius-sm)] border px-1 text-xs ${mode === option ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]" : "border-[var(--line)] text-[var(--muted)]"}`}
                >
                  {t(`theme.mode.${option as Mode}`)}
                </button>
              ))}
            </div>
          </Group>
          <Group title={t("theme.densityTitle")}>
            <div className="flex gap-1 px-1">
              {DENSITIES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={density === option}
                  onClick={() => {
                    applyDensity(option);
                    setDensity(option);
                  }}
                  className={`h-[var(--control-h-sm)] flex-1 rounded-[var(--radius-sm)] border px-1 text-xs ${density === option ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]" : "border-[var(--line)] text-[var(--muted)]"}`}
                >
                  {t(`theme.density.${option as Density}`)}
                </button>
              ))}
            </div>
          </Group>
          <label className="divider flex min-h-[var(--control-h)] items-center gap-2 border-t border-[var(--line)] px-2 pt-2 text-[var(--muted)]">
            <input
              type="checkbox"
              checked={keys}
              onChange={(event) => {
                applyShowKeys(event.target.checked);
                setKeys(event.target.checked);
              }}
            />
            {t("theme.keys")}
          </label>
        </PopoverPanel>
      )}
    </div>
  );
}
