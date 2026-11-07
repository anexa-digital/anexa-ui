import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { t } from "../../i18n";
import { NARROW, useMediaQuery } from "../../lib/media";

const KEY = (id: string) => `anexa_split_${id}`;
const STEP = 16;

/**
 * A page split in two: the main content and a side panel whose width the person drags (or changes with the arrow
 * keys on the handle); the width is kept per `id` in this browser. On a phone the two stack.
 */
export function SplitPane({ id, side, children, initial = 360, min = 240, max = 720, position = "right" }: { id: string; side: ReactNode; children: ReactNode; initial?: number; min?: number; max?: number; position?: "left" | "right" }) {
  const narrow = useMediaQuery(NARROW);
  const [width, setWidth] = useState(() => {
    try {
      const stored = Number(localStorage.getItem(KEY(id)));
      return stored >= min && stored <= max ? stored : initial;
    } catch {
      return initial;
    }
  });
  const dragging = useRef<{ x: number; width: number } | null>(null);
  const clamp = useCallback((value: number) => Math.max(min, Math.min(max, Math.round(value))), [min, max]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY(id), String(width));
    } catch {
      // The width still applies to this page.
    }
  }, [id, width]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragging.current) return;
      const delta = event.clientX - dragging.current.x;
      setWidth(clamp(dragging.current.width + (position === "right" ? -delta : delta)));
    };
    const stop = () => (dragging.current = null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
  }, [clamp, position]);

  if (narrow) {
    return (
      <div className="flex flex-col gap-[var(--gap)]">
        <div className="min-w-0">{children}</div>
        <div className="min-w-0">{side}</div>
      </div>
    );
  }

  const handle = (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={t("ui.resize")}
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={(event) => {
        dragging.current = { x: event.clientX, width };
        event.preventDefault();
      }}
      onKeyDown={(event) => {
        const sign = position === "right" ? -1 : 1;
        if (event.key === "ArrowLeft") setWidth((value) => clamp(value + sign * STEP));
        else if (event.key === "ArrowRight") setWidth((value) => clamp(value - sign * STEP));
        else if (event.key === "Home") setWidth(min);
        else if (event.key === "End") setWidth(max);
        else return;
        event.preventDefault();
      }}
      className="group flex w-2 shrink-0 cursor-col-resize items-stretch justify-center outline-none focus-visible:bg-[var(--accent-soft)]"
    >
      <span aria-hidden className="w-px bg-[var(--line)] group-hover:bg-[var(--accent)] group-focus-visible:bg-[var(--accent)]" />
    </div>
  );
  const panel = (
    <div className="shrink-0 min-w-0" style={{ width }}>
      {side}
    </div>
  );
  return (
    <div className="flex min-h-0 items-stretch">
      {position === "left" && panel}
      {position === "left" && handle}
      <div className="min-w-0 flex-1">{children}</div>
      {position === "right" && handle}
      {position === "right" && panel}
    </div>
  );
}
