import { describe, expect, test } from "bun:test";

import { comboLabels, matchesStep, parseCombo } from "./shortcuts";

const key = (key: string, modifiers: Partial<{ ctrl: boolean; alt: boolean; shift: boolean; meta: boolean }> = {}) => ({
  key,
  ctrlKey: modifiers.ctrl ?? false,
  altKey: modifiers.alt ?? false,
  shiftKey: modifiers.shift ?? false,
  metaKey: modifiers.meta ?? false,
});

describe("shortcuts", () => {
  test("mod is Ctrl on Windows and ⌘ on a Mac", () => {
    expect(parseCombo("mod+k", false)).toEqual([{ key: "k", ctrl: true, alt: false, shift: false, meta: false }]);
    expect(parseCombo("mod+k", true)[0]?.meta).toBe(true);
    expect(comboLabels("mod+k", false)).toEqual([["Ctrl", "K"]]);
    expect(comboLabels("mod+enter", true)).toEqual([["⌘", "⏎"]]);
  });

  test("a chord is a sequence of steps", () => {
    expect(parseCombo("g q").map((step) => step.key)).toEqual(["g", "q"]);
    expect(comboLabels("g q")).toEqual([["G"], ["Q"]]);
  });

  test("symbols carry their own Shift; letters do not", () => {
    const [question] = parseCombo("?");
    expect(matchesStep(question!, key("?", { shift: true }))).toBe(true);
    const [k] = parseCombo("k");
    expect(matchesStep(k!, key("K", { shift: true }))).toBe(false);
    expect(matchesStep(k!, key("k"))).toBe(true);
    const [modK] = parseCombo("mod+k", false);
    expect(matchesStep(modK!, key("k", { ctrl: true }))).toBe(true);
    expect(matchesStep(modK!, key("k", { meta: true }))).toBe(false);
    const [slash] = parseCombo("/");
    expect(matchesStep(slash!, key("/"))).toBe(true);
    expect(matchesStep(slash!, key("Escape"))).toBe(false);
  });
});
