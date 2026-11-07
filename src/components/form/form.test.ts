import { describe, expect, test } from "bun:test";

import { ApiError } from "../../lib/api";
import { errorText } from "./fields";
import { errorField } from "./form";

describe("forms", () => {
  test("the API's rejection lands on the field it names", () => {
    expect(errorField(new ApiError(422, "must_be_positive", { field: "margin" }), ["customer", "margin"])).toBe("margin");
    expect(errorField(new ApiError(422, "must_be_positive", { field: "grammage" }), ["customer", "margin"])).toBeNull();
    expect(errorField(new ApiError(422, "invalid_input", [{ loc: ["body", "quantity"], msg: "x" }]), ["quantity"])).toBe("quantity");
    expect(errorField(new ApiError(409, "stale_value"), ["quantity"])).toBeNull();
    expect(errorField(new Error("network"), ["quantity"])).toBeNull();
  });

  test("validator errors read as one sentence", () => {
    expect(errorText(["Obligatorio", undefined, { message: "Mínimo 8 %" }])).toBe("Obligatorio Mínimo 8 %");
    expect(errorText([undefined, null])).toBeNull();
  });
});
