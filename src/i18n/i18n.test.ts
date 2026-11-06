import { describe, expect, test } from "bun:test";

import { extendMessages, t } from ".";
import { esCO } from "./es-CO";

describe("i18n", () => {
  test("es-CO is the default locale and every value is a non-empty string", () => {
    expect(t("ui.close")).toBe(esCO["ui.close"]);
    for (const [key, value] of Object.entries(esCO)) expect(value.trim().length, key).toBeGreaterThan(0);
  });

  test("an app extends the catalog and placeholders are filled", () => {
    extendMessages("es-CO", { "invoices.title": "Facturas de {company}" });
    expect(t("invoices.title", { company: "BIO" })).toBe("Facturas de BIO");
    expect(t("missing.key")).toBe("missing.key");
  });
});
