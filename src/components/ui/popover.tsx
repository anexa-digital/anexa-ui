import { useEffect, useRef, useState, type ReactNode } from "react";

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

/** The floating panel of a popover, below its trigger; align it to the trigger's right edge near the screen's. */
export function PopoverPanel({ label, children, align = "left", className = "" }: { label: string; children: ReactNode; align?: "left" | "right"; className?: string }) {
  return (
    <div
      role="dialog"
      aria-label={label}
      className={`absolute top-full z-30 mt-1 flex flex-col gap-2 rounded-md border border-[var(--line-strong)] bg-[var(--raised)] p-2 shadow-[var(--shadow)] ${align === "right" ? "right-0" : "left-0"} ${className}`}
    >
      {children}
    </div>
  );
}
