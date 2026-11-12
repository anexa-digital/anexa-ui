import { useLayoutEffect, useRef, type RefObject } from "react";

// Every floating panel of the kit (menus, popovers, lookup lists, nav dropdowns, tooltips) goes to the browser's top
// layer through the Popover API: no `overflow` clips it and no stacking context (a sticky grid cell, a board column,
// a modal <dialog> opened before it) paints over it. It stays a DOM child of its trigger's box, so a click inside it
// still counts as inside and the focus order is unchanged; only its place on the screen is computed here.

/** Classes of a floating panel; with `popover="manual"` and the ref of `useFloating`. */
export const FLOATING = "floating z-50";

/** The margin kept between a floating panel and the edge of the screen. */
const EDGE = 8;

export type FloatingOptions = {
  /** Below the anchor (flips above when it fits better there), above it (flips below), or beside it on the right. */
  side?: "below" | "above" | "right";
  /** Which edge of the anchor the panel lines up with; `center` for tips. */
  align?: "left" | "right" | "center";
  /** The distance from the anchor, in px. */
  gap?: number;
  /** At least as wide as the anchor (the list of a lookup). */
  matchWidth?: boolean;
  /** The element it hangs from; its parent element by default (the relative box that holds trigger and panel). */
  anchor?: RefObject<HTMLElement | null>;
  /** Called when the anchor scrolls out of sight: a menu closes instead of floating over unrelated content. */
  onAway?: () => void;
};

/** Shows the panel in the top layer while it is mounted and keeps it at its anchor through scrolls and resizes. */
export function useFloating<E extends HTMLElement = HTMLDivElement>({ side = "below", align = "left", gap = 4, matchWidth = false, anchor, onAway }: FloatingOptions = {}): RefObject<E | null> {
  const ref = useRef<E>(null);
  const away = useRef(onAway);
  away.current = onAway;
  useLayoutEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    // Without the Popover API (very old browsers) it is still a fixed panel at z-50.
    if (typeof panel.showPopover === "function" && !panel.matches(":popover-open")) {
      try {
        panel.showPopover();
      } catch {
        // Already shown or detached: placing it is still right.
      }
    }
    let frame = 0;
    const place = () => {
      const target = anchor?.current ?? panel.parentElement;
      if (!target) return;
      const box = target.getBoundingClientRect();
      const width = document.documentElement.clientWidth;
      const height = window.innerHeight;
      if (box.bottom < 0 || box.top > height || box.right < 0 || box.left > width) {
        away.current?.();
        return;
      }
      if (matchWidth) panel.style.minWidth = `${box.width}px`;
      // Measured at its own size (its classes may cap the height), then capped to the room it gets.
      panel.style.maxHeight = "";
      const own = panel.getBoundingClientRect();
      let top: number;
      let left: number;
      let room: number;
      if (side === "right") {
        left = Math.min(box.right + gap, width - EDGE - own.width);
        room = height - 2 * EDGE;
        top = Math.max(EDGE, Math.min(box.top, height - EDGE - Math.min(own.height, room)));
      } else {
        const below = height - EDGE - (box.bottom + gap);
        const above = box.top - gap - EDGE;
        const up = side === "above" ? own.height <= above || above > below : own.height > below && above > below;
        room = up ? above : below;
        top = up ? box.top - gap - Math.min(own.height, room) : box.bottom + gap;
        left = align === "right" ? box.right - own.width : align === "center" ? box.left + box.width / 2 - own.width / 2 : box.left;
        left = Math.max(EDGE, Math.min(left, width - EDGE - own.width));
      }
      if (own.height > room) panel.style.maxHeight = `${Math.max(room, 0)}px`;
      panel.style.top = `${top}px`;
      panel.style.left = `${left}px`;
    };
    place();
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    // Its content may change after it opens (a lookup's results arrive): it is placed again at its new size.
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
    observer?.observe(panel);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, [side, align, gap, matchWidth, anchor]);
  return ref;
}
