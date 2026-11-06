import { describe, expect, test } from "bun:test";

import { extentWithZero, linear, niceTicks, shares, toNumber, waterfall } from "./scale";

describe("chart geometry", () => {
  test("a linear scale maps the domain onto the range, a flat domain to its start", () => {
    const x = linear([0, 200], [10, 110]);
    expect(x(0)).toBe(10);
    expect(x(100)).toBe(60);
    expect(linear([5, 5], [0, 100])(5)).toBe(0);
  });

  test("ticks are round steps that cover the data", () => {
    expect(niceTicks(0, 87, 4)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceTicks(-12, 30, 4)).toEqual([-20, -10, 0, 10, 20, 30]);
    expect(niceTicks(0, 0)).toEqual([0, 1]);
    expect(extentWithZero([5, 12])).toEqual([0, 12]);
    expect(extentWithZero([-3, 4])).toEqual([-3, 4]);
  });

  test("a waterfall goes from the base total through each change to the final total", () => {
    const steps = waterfall("Base", 100, [{ label: "Cartón", change: 12 }, { label: "Flete", change: -4 }], "Simulación");
    expect(steps.map((step) => [step.label, step.start, step.end, step.kind])).toEqual([
      ["Base", 0, 100, "total"],
      ["Cartón", 100, 112, "rise"],
      ["Flete", 112, 108, "fall"],
      ["Simulación", 0, 108, "total"],
    ]);
  });

  test("lights become shares; decimal strings become numbers only for drawing", () => {
    expect(shares({ red: 1, yellow: 1, green: 2 })).toEqual({ red: 25, yellow: 25, green: 50 });
    expect(shares({ red: 0, yellow: 0, green: 0 })).toEqual({ red: 0, yellow: 0, green: 0 });
    expect(toNumber("1234.500000")).toBe(1234.5);
    expect(toNumber(null)).toBe(0);
  });
});
