import { describe, expect, test } from "bun:test";

import { fuzzyFilter, fuzzyScore } from "./fuzzy";

describe("fuzzy", () => {
  test("characters in order match, accents and case do not count", () => {
    expect(fuzzyScore("cot", "Cotizaciones")).toBeGreaterThan(0);
    expect(fuzzyScore("simul", "Simulaciones")).toBeGreaterThan(0);
    expect(fuzzyScore("ctz", "Cotizaciones")).toBeGreaterThan(0);
    expect(fuzzyScore("xyz", "Cotizaciones")).toBe(0);
    expect(fuzzyScore("", "Cotizaciones")).toBe(1);
  });

  test("the best match comes first", () => {
    const items = ["Nueva cotización", "Cotizaciones", "Catálogo", "Modelos de costos"];
    expect(fuzzyFilter(items, "cot", (item) => item)).toEqual(["Cotizaciones", "Nueva cotización", "Modelos de costos"]);
    expect(fuzzyFilter(items, "mc", (item) => item)[0]).toBe("Modelos de costos");
  });
});
