import { describe, expect, test } from "bun:test";

import { INITIAL_FOCUS, focusTarget } from "./dialog";

/** A dialog that only has the kinds of control listed: 0 marked, 1 in the body, 2 in the footer, 3 the «×». */
const dialogWith = (...kinds: number[]) => ({
  querySelector: (selector: string) => (kinds.includes(INITIAL_FOCUS.indexOf(selector)) ? ({ selector } as unknown as HTMLElement) : null),
}) as Pick<ParentNode, "querySelector">;
const chosen = (...kinds: number[]) => INITIAL_FOCUS.indexOf((focusTarget(dialogWith(...kinds)) as unknown as { selector: string } | null)?.selector ?? "");

describe("dialog", () => {
  test("the focus opens on the content, not on the close button", () => {
    expect(INITIAL_FOCUS.length).toBe(4);
    expect(chosen(1, 2, 3)).toBe(1); // a field of the body before the footer and the «×»
    expect(chosen(0, 1, 2, 3)).toBe(0); // the control marked with data-autofocus before anything
    expect(chosen(2, 3)).toBe(2); // only text in the body: the footer's first button
    expect(chosen(3)).toBe(3); // nothing else: the «×», so the focus is still inside
  });

  test("the body's first control skips what cannot take the focus", () => {
    expect(INITIAL_FOCUS[1]).toContain(":not([disabled])");
    expect(INITIAL_FOCUS[1]).toContain('[aria-hidden="true"]');
    expect(INITIAL_FOCUS[1]).toContain('[type="hidden"]');
    expect(INITIAL_FOCUS[3]).toBe("[data-close]");
  });
});
