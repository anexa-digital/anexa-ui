import { describe, expect, test } from "bun:test";

import { parseMarkdown } from "./markdown";

describe("parseMarkdown", () => {
  test("headings, paragraphs and rules", () => {
    expect(parseMarkdown("# Título\n\nUna línea\nque sigue.\n\n---\n## Otro")).toEqual([
      { kind: "heading", level: 1, text: "Título" },
      { kind: "paragraph", text: "Una línea que sigue." },
      { kind: "rule" },
      { kind: "heading", level: 2, text: "Otro" },
    ]);
  });

  test("lists keep their items and continuation lines", () => {
    expect(parseMarkdown("- uno\n  sigue\n- dos\n\n1. a\n2. b")).toEqual([
      { kind: "list", ordered: false, items: ["uno sigue", "dos"] },
      { kind: "list", ordered: true, items: ["a", "b"] },
    ]);
  });

  test("tables, quotes and code", () => {
    expect(parseMarkdown("| A | B |\n|---|---|\n| 1 | 2 |\n\n> cita\n\n```\nx = 1\n```")).toEqual([
      { kind: "table", head: ["A", "B"], rows: [["1", "2"]] },
      { kind: "quote", text: "cita" },
      { kind: "code", text: "x = 1" },
    ]);
  });

  test("windows line ends and stray blank lines", () => {
    expect(parseMarkdown("\r\n\r\nHola\r\n")).toEqual([{ kind: "paragraph", text: "Hola" }]);
  });
});
