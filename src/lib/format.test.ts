import { describe, expect, test } from "bun:test";

import { formatDate, formatDecimal } from "./format";

describe("formatDecimal", () => {
  test("groups thousands and trims zeros without floats", () => {
    expect(formatDecimal("1849.770000")).toBe("1.849,77");
    expect(formatDecimal("1000000")).toBe("1.000.000");
    expect(formatDecimal("0.500000")).toBe("0,5");
    expect(formatDecimal("-12345.1")).toBe("-12.345,1");
    // Beyond float precision: still exact.
    expect(formatDecimal("123456789012345678.123456")).toBe("123.456.789.012.345.678,123456");
  });

  test("caps decimals by truncation and leaves odd text alone", () => {
    expect(formatDecimal("90.769999", 2)).toBe("90,76");
    expect(formatDecimal(null)).toBe("—");
    expect(formatDecimal("abc")).toBe("abc");
  });
});

test("formatDate keeps the civil day", () => {
  expect(formatDate("2026-10-18")).toBe("18/10/2026");
});
