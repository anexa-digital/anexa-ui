import { describe, expect, test } from "bun:test";

import { toCsv } from "./csv";
import { defaultPreferences, mergePreferences } from "./preferences";
import { fromSortParam, toSortParam } from "./sort";

describe("data grid", () => {
  test("csv quotes what would break a cell and starts with a BOM", () => {
    const text = toCsv(["Código", "Cliente"], [["COT-1", 'Cajas "del" Norte; S.A.S.'], [null, 3]]);
    expect(text).toBe('﻿Código;Cliente\r\nCOT-1;"Cajas ""del"" Norte; S.A.S."\r\n;3\r\n');
  });

  test("stored preferences survive columns that come and go", () => {
    const defaults = defaultPreferences([{ id: "code" }, { id: "customer" }, { id: "notes", meta: { hidden: true } }]);
    expect(defaults.visibility).toEqual({ notes: false });
    const merged = mergePreferences(defaults, {
      order: ["customer", "gone", "code"],
      pinning: { left: ["gone", "code"], right: [] },
      visibility: { customer: false },
      density: "normal",
    });
    expect(merged.order).toEqual(["customer", "code", "notes"]);
    expect(merged.pinning).toEqual({ left: ["code"], right: [] });
    expect(merged.visibility).toEqual({ notes: false, customer: false });
    expect(merged.density).toBe("normal");
  });

  test("the sort travels as field:direction pairs, like the server lists", () => {
    const sorting = [
      { id: "customer_name", desc: false },
      { id: "quoted_on", desc: true },
    ];
    expect(toSortParam(sorting)).toBe("customer_name:asc,quoted_on:desc");
    expect(fromSortParam("customer_name:asc,quoted_on:desc")).toEqual(sorting);
    expect(fromSortParam(undefined)).toEqual([]);
    expect(fromSortParam("bad:sideways,:asc")).toEqual([]);
  });
});
