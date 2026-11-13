import { describe, expect, test } from "bun:test";

import { insertToken, tokenParts, unknownTokens } from "./text-tokens";

describe("tokens", () => {
  test("splits text and tokens in order", () => {
    expect(tokenParts("Hola ⟦var:name⟧, usa ⟦tool:book⟧.")).toEqual([{ text: "Hola " }, { token: "⟦var:name⟧" }, { text: ", usa " }, { token: "⟦tool:book⟧" }, { text: "." }]);
    expect(tokenParts("")).toEqual([]);
    expect(tokenParts("⟦a⟧⟦b⟧")).toEqual([{ token: "⟦a⟧" }, { token: "⟦b⟧" }]);
    // A bracket with a space inside is text, not a token.
    expect(tokenParts("⟦no token⟧")).toEqual([{ text: "⟦no token⟧" }]);
  });

  test("lists the unknown tokens once", () => {
    expect(unknownTokens("⟦a⟧ ⟦b⟧ ⟦b⟧ ⟦c⟧", ["⟦a⟧"])).toEqual(["⟦b⟧", "⟦c⟧"]);
    expect(unknownTokens("sin etiquetas", [])).toEqual([]);
  });

  test("inserts with spaces only where needed", () => {
    expect(insertToken("Hola", 4, "⟦x⟧")).toEqual({ value: "Hola ⟦x⟧ ", caret: 9 });
    expect(insertToken("Hola mundo", 5, "⟦x⟧")).toEqual({ value: "Hola ⟦x⟧ mundo", caret: 9 });
    expect(insertToken("", 0, "⟦x⟧")).toEqual({ value: "⟦x⟧ ", caret: 4 });
    expect(insertToken("ab", 99, "⟦x⟧").value).toBe("ab ⟦x⟧ ");
  });
});
