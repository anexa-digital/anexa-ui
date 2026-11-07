import { describe, expect, test } from "bun:test";

import { addDays, civilDate, formatDate, formatDateTime, formatDateShort, formatDecimal, formatMoney, formatNumber, formatPercent, parseDateInput } from "./format";
import { DEFAULT_PREFERENCES, preferencesStore, setPreferences } from "./preferences";

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

describe("dates follow the preferences", () => {
  test("formatDate keeps the civil day in the person's format", () => {
    expect(formatDate("2026-10-18")).toBe("2026-10-18");
    expect(formatDate("2026-10-18", { dateFormat: "DD/MM/YYYY" })).toBe("18/10/2026");
    expect(formatDate("2026-10-18", { dateFormat: "MM/DD/YYYY" })).toBe("10/18/2026");
    expect(formatDate("2026-10-18T15:00:00Z")).toBe("2026-10-18");
    expect(formatDate(null)).toBe("—");
  });

  test("the store changes what every formatter does", () => {
    setPreferences({ dateFormat: "DD/MM/YYYY" });
    expect(formatDate("2026-01-05")).toBe("05/01/2026");
    preferencesStore.setState(() => DEFAULT_PREFERENCES);
    expect(formatDate("2026-01-05")).toBe("2026-01-05");
  });

  test("parseDateInput reads the format and always the ISO form", () => {
    expect(parseDateInput("2026-11-07", "DD/MM/YYYY")).toBe("2026-11-07");
    expect(parseDateInput("07/11/2026", "DD/MM/YYYY")).toBe("2026-11-07");
    expect(parseDateInput("11/07/2026", "MM/DD/YYYY")).toBe("2026-11-07");
    expect(parseDateInput("7-11-2026", "DD/MM/YYYY")).toBe("2026-11-07");
    expect(parseDateInput("20261107", "YYYY-MM-DD")).toBe("2026-11-07");
    expect(parseDateInput("07112026", "DD/MM/YYYY")).toBe("2026-11-07");
    expect(parseDateInput("31/02/2026", "DD/MM/YYYY")).toBeNull();
    expect(parseDateInput("hoy", "DD/MM/YYYY")).toBeNull();
    expect(parseDateInput("  ", "DD/MM/YYYY")).toBeNull();
  });

  test("today is the company's day, not UTC's", () => {
    // 2026-11-07 02:30 UTC is still 2026-11-06 in Bogotá.
    expect(civilDate(new Date("2026-11-07T02:30:00Z"), "America/Bogota")).toBe("2026-11-06");
    expect(civilDate(new Date("2026-11-07T02:30:00Z"), "UTC")).toBe("2026-11-07");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  test("an instant reads in the person's date format and zone", () => {
    expect(formatDateTime("2026-11-07T15:19:00Z", { timeZone: "America/Bogota", dateFormat: "YYYY-MM-DD", locale: "es-CO" })).toMatch(/^2026-11-07 10:19/);
    expect(formatDateTime("2026-11-07T02:30:00Z", { timeZone: "America/Bogota", dateFormat: "DD/MM/YYYY", locale: "es-CO" })).toMatch(/^06\/11\/2026 21:30/);
  });

  test("a short date drops this year's year", () => {
    expect(formatDateShort("2019-11-05")).toMatch(/nov.* 2019/);
    expect(formatDateShort("2019-11-05")).toMatch(/^5/);
  });
});

describe("numbers and money follow the locale", () => {
  test("es-CO groups with a point and separates decimals with a comma", () => {
    expect(formatNumber(12000)).toBe("12.000");
    expect(formatNumber("1.5")).toBe("1,5");
    expect(formatPercent(0.82).replace(/\u00a0/g, " ")).toBe("82 %");
    expect(formatPercent(82, { of: 100 }).replace(/\u00a0/g, " ")).toBe("82 %");
    expect(formatMoney("1842", "COP").replace(/ /g, " ")).toBe("$ 1.842");
    expect(formatMoney("12.5", "USD").replace(/ /g, " ")).toMatch(/12,50/);
  });

  test("another locale reads its own way", () => {
    expect(formatNumber(12000, {}, { locale: "en-US" })).toBe("12,000");
    expect(formatMoney(1842, "USD", {}, { locale: "en-US" })).toBe("$1,842.00");
  });
});
