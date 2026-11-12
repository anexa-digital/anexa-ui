import { describe, expect, test } from "bun:test";

import { civilFromInstant, instantFromCivil, zoneOffsetMinutes } from "./zoned";

describe("zoned instants", () => {
  test("a clock in Bogotá is five hours behind UTC all year", () => {
    expect(instantFromCivil("2026-11-14", "08:30", "America/Bogota")).toBe("2026-11-14T13:30:00.000Z");
    expect(civilFromInstant("2026-11-14T13:30:00.000Z", "America/Bogota")).toEqual({ date: "2026-11-14", time: "08:30" });
    expect(zoneOffsetMinutes(new Date("2026-06-01T00:00:00Z"), "America/Bogota")).toBe(-300);
  });

  test("the civil date can be another day than UTC's", () => {
    expect(civilFromInstant("2026-11-15T02:00:00.000Z", "America/Bogota")).toEqual({ date: "2026-11-14", time: "21:00" });
    expect(instantFromCivil("2026-11-14", "21:00", "America/Bogota")).toBe("2026-11-15T02:00:00.000Z");
  });

  test("daylight saving: Madrid in winter and in summer", () => {
    expect(instantFromCivil("2026-01-10", "10:00", "Europe/Madrid")).toBe("2026-01-10T09:00:00.000Z");
    expect(instantFromCivil("2026-07-10", "10:00", "Europe/Madrid")).toBe("2026-07-10T08:00:00.000Z");
    // 02:30 does not exist on 2026-03-29 in Madrid (clocks jump 02:00 → 03:00): it resolves past the gap.
    const gap = instantFromCivil("2026-03-29", "02:30", "Europe/Madrid");
    expect(civilFromInstant(gap, "Europe/Madrid")?.time).toBe("03:30");
  });

  test("round trip keeps the clock", () => {
    for (const zone of ["America/Bogota", "America/Mexico_City", "Europe/Madrid", "America/Santiago"]) {
      const iso = instantFromCivil("2026-11-20", "19:30", zone);
      expect(civilFromInstant(iso, zone)).toEqual({ date: "2026-11-20", time: "19:30" });
    }
  });

  test("bad input answers null", () => {
    expect(instantFromCivil("2026-13-01x", "10:00", "America/Bogota")).toBeNull();
    expect(instantFromCivil("2026-11-14", "25:00", "America/Bogota")).toBeNull();
    expect(civilFromInstant("nope", "America/Bogota")).toBeNull();
    expect(civilFromInstant(null, "America/Bogota")).toBeNull();
  });
});
