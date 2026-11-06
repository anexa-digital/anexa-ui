import { describe, expect, test } from "bun:test";

import { safeNext, validateLoginSearch } from "./return-to";

describe("safeNext", () => {
  test("keeps a path of this app", () => {
    expect(safeNext("/connect/abc")).toBe("/connect/abc");
    expect(safeNext("/account/password?x=1")).toBe("/account/password?x=1");
  });

  test("never leaves the app", () => {
    for (const bad of ["https://evil.example", "//evil.example/x", "evil", "", undefined, 7, "/\\evil.example"]) {
      expect(safeNext(bad)).toBe("/");
    }
  });

  test("the search keeps next only when it says something", () => {
    expect(validateLoginSearch({})).toEqual({});
    expect(validateLoginSearch({ next: "/connect/k" })).toEqual({ next: "/connect/k" });
    expect(validateLoginSearch({ next: "https://evil.example" })).toEqual({});
  });
});
