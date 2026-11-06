import { describe, expect, test } from "bun:test";

import { editorFor, fromInput, toInput } from "./schema";

describe("editorFor", () => {
  test("pydantic shapes map to editors", () => {
    expect(editorFor({ type: "boolean" })).toEqual({ kind: "boolean", nullable: false });
    expect(editorFor({ type: "integer", minimum: 1, maximum: 72 })).toEqual({
      kind: "integer",
      nullable: false,
      min: 1,
      max: 72,
    });
    expect(editorFor({ enum: ["test", "live"], type: "string" })).toEqual({
      kind: "enum",
      nullable: false,
      options: ["test", "live"],
    });
    expect(editorFor({ const: "es-CO", type: "string" })).toEqual({ kind: "enum", nullable: false, options: ["es-CO"] });
    expect(editorFor({ anyOf: [{ type: "string", format: "email" }, { type: "null" }] })).toEqual({
      kind: "string",
      nullable: true,
      format: "email",
    });
    expect(editorFor({ type: "array", items: { type: "string" } }).kind).toBe("list");
    expect(editorFor({ anyOf: [{ type: "number", minimum: 0, maximum: 1 }, { type: "null" }] })).toEqual({
      kind: "number",
      nullable: true,
      min: 0,
      max: 1,
    });
  });
});

describe("input conversion", () => {
  test("lists accept lines or commas", () => {
    const editor = editorFor({ type: "array" });
    expect(fromInput(editor, "10.0.0.0/8\n 192.168.0.0/16, ")).toEqual(["10.0.0.0/8", "192.168.0.0/16"]);
    expect(toInput(editor, ["a", "b"])).toBe("a\nb");
  });

  test("empty input means null only when the setting is nullable", () => {
    expect(fromInput(editorFor({ anyOf: [{ type: "string" }, { type: "null" }] }), "  ")).toBeNull();
    expect(fromInput(editorFor({ type: "string" }), "")).toBe("");
    expect(fromInput(editorFor({ type: "integer" }), "12")).toBe(12);
    expect(fromInput(editorFor({ type: "number" }), "0.25")).toBe(0.25);
    expect(fromInput(editorFor({ anyOf: [{ type: "number" }, { type: "null" }] }), "")).toBeNull();
  });
});
