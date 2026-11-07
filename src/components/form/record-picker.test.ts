import { expect, test } from "bun:test";

import { optionText } from "./record-picker";

test("a record reads as CODE · Nombre, or the name alone", () => {
  expect(optionText({ id: "1", code: "CLI-7", label: "Alimentos La Cosecha" })).toBe("CLI-7 · Alimentos La Cosecha");
  expect(optionText({ id: "2", label: "Prospecto" })).toBe("Prospecto");
});
