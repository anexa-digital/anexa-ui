import { describe, expect, test } from "bun:test";

import { ApiError } from "./api";
import { errorMessage, registerErrorMessages } from "./errors";

describe("errorMessage", () => {
  test("known codes read from the catalog, plain details are shown as they are", () => {
    expect(errorMessage(new ApiError(401, "unauthenticated"))).toBe("Tu sesión terminó. Ingresa de nuevo.");
    expect(errorMessage(new ApiError(400, "http_error", "La OC no existe"))).toBe("La OC no existe");
    expect(errorMessage(new ApiError(422, "invalid_input", "tenant_id: Field required"))).toBe("tenant_id: Field required");
    expect(errorMessage(new ApiError(422, "invalid_input", [{ loc: ["body"], msg: "x" }]))).toBe("El valor no es válido.");
    expect(errorMessage(new ApiError(500, "boom"))).toBe("No se pudo completar la acción (boom).");
    expect(errorMessage(new Error("x"))).toBe("No se pudo completar la acción (network).");
  });

  test("an app registers its own codes", () => {
    registerErrorMessages({ company_code_taken: "error.invalidValue" });
    expect(errorMessage(new ApiError(409, "company_code_taken"))).toBe("El valor no es válido.");
  });
});
