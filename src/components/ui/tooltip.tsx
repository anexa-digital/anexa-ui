import { cloneElement, useId, useState, type ReactElement, type ReactNode } from "react";

import { FLOATING, useFloating } from "./floating";

// A short explanation that appears when the pointer rests on a control or the focus reaches it; read by assistive
// technology through aria-describedby. For an icon-only button use `label` (its name) instead: the name is the tooltip.

/** Wraps one element; the tip shows above it on hover and focus. */
export function Tooltip({ text, children, placement = "top" }: { text: ReactNode; children: ReactElement<Record<string, unknown>>; placement?: "top" | "bottom" }) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const props = children.props;
  const child = cloneElement(children, {
    "aria-describedby": shown ? id : (props["aria-describedby"] as string | undefined),
    onMouseEnter: (event: unknown) => {
      setShown(true);
      (props.onMouseEnter as ((e: unknown) => void) | undefined)?.(event);
    },
    onMouseLeave: (event: unknown) => {
      setShown(false);
      (props.onMouseLeave as ((e: unknown) => void) | undefined)?.(event);
    },
    onFocus: (event: unknown) => {
      setShown(true);
      (props.onFocus as ((e: unknown) => void) | undefined)?.(event);
    },
    onBlur: (event: unknown) => {
      setShown(false);
      (props.onBlur as ((e: unknown) => void) | undefined)?.(event);
    },
  });
  return (
    <span className="relative inline-flex">
      {child}
      {shown && (
        <Tip id={id} placement={placement}>
          {text}
        </Tip>
      )}
    </span>
  );
}

/** The tip itself, in the top layer centered on the wrapped element, so a grid cell or a drawer never clips it. */
function Tip({ id, placement, children }: { id: string; placement: "top" | "bottom"; children: ReactNode }) {
  const tip = useFloating<HTMLSpanElement>({ side: placement === "top" ? "above" : "below", align: "center", gap: 6 });
  return (
    <span ref={tip} popover="manual" id={id} role="tooltip" className={`${FLOATING} tooltip-in pointer-events-none max-w-64 rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--raised)] px-2 py-1 text-xs whitespace-normal text-[var(--ink)] shadow-[var(--shadow)]`}>
      {children}
    </span>
  );
}
