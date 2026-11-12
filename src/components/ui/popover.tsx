import { useEffect, useRef, useState, type ReactNode } from "react";

import { FLOATING, useFloating } from "./floating";

/** Open state of a dropdown anchored to its trigger: a click outside or Esc closes it. */
export function usePopover() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return { open, setOpen, box };
}

/** The floating panel of a popover, below its parent box (above when it fits better), in the top layer so no
 * container clips or covers it; align it to the trigger's right edge near the screen's. */
export function PopoverPanel({ label, children, align = "left", className = "" }: { label: string; children: ReactNode; align?: "left" | "right"; className?: string }) {
  const panel = useFloating({ align });
  return (
    <div
      ref={panel}
      popover="manual"
      role="dialog"
      aria-label={label}
      className={`${FLOATING} flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--raised)] p-2 shadow-[var(--shadow)] ${className}`}
    >
      {children}
    </div>
  );
}
