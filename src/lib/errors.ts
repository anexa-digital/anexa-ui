import { lookup, t } from "../i18n";
import { ApiError } from "./api";

// API error codes -> catalog keys. The kit knows the codes every API shares; each app registers its own.
const KNOWN: Record<string, string> = {
  invalid_credentials: "error.invalidCredentials",
  invalid_value: "error.invalidValue",
  invalid_input: "error.invalidValue",
  missing_permission: "error.missingPermission",
  forbidden: "error.missingPermission",
  unauthenticated: "error.sessionExpired",
  api_unreachable: "system.apiUnreachable",
  too_many_attempts: "error.tooManyAttempts",
  conflict: "error.staleValue",
  version_conflict: "error.staleValue",
  not_found: "error.recordNotFound",
};

/** Adds the app's error codes (code -> catalog key). */
export function registerErrorMessages(codes: Record<string, string>): void {
  Object.assign(KNOWN, codes);
}

/** Detail of an API error as message parameters: lists read as "a, b". */
export function detailParams(detail: unknown): Record<string, string | number> {
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) return {};
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(detail as Record<string, unknown>)) {
    if (Array.isArray(value)) params[key] = value.map(String).join(", ");
    else if (typeof value === "number") params[key] = value;
    else if (value !== null && value !== undefined) params[key] = String(value);
  }
  return params;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === "too_many_attempts") {
    const detail = error.detail as { retry_after_seconds?: number } | undefined;
    const minutes = Math.max(1, Math.ceil((detail?.retry_after_seconds ?? 60) / 60));
    return t("error.tooManyAttempts", { minutes });
  }
  if (error instanceof ApiError) {
    // FastAPI answers business and validation errors with a plain `detail`: it is already the sentence
    // to show, and it says which field is wrong where a generic text would not.
    if (typeof error.detail === "string" && error.detail.trim()) return error.detail;
    const key = KNOWN[error.code];
    if (key) return t(key, { ...detailParams(error.detail), code: error.code });
    return t(lookup(`error.code.${error.code}`) ? `error.code.${error.code}` : "error.generic", { code: error.code });
  }
  return t("error.generic", { code: "network" });
}
