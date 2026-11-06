// Thin client of the app's API. Same origin: the Bun server proxies /v1/* to the API and keeps the session in an
// HttpOnly cookie, so the browser never sees a token. Writes always send JSON.

export type Liveness = {
  status: string;
  service?: string;
  version?: string;
  commit?: string | null;
  environment?: string;
};

export type Readiness = {
  status: string;
  database: "ok" | "unavailable" | "not_migrated";
  schema_revision?: string | null;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly detail?: unknown,
  ) {
    super(`${status} ${code}`);
    this.name = "ApiError";
  }
}

export type Fetcher = typeof fetch;
export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** JSON request. `accept` lists non-2xx statuses whose body is still a valid answer (readiness returns 503). */
export async function request<T>(
  method: Method,
  path: string,
  options: { body?: unknown; accept?: number[]; fetcher?: Fetcher } = {},
): Promise<T> {
  const { body, accept = [], fetcher = fetch } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined || method === "POST") headers["Content-Type"] = "application/json";
  const response = await fetcher(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : method === "POST" ? "{}" : undefined,
    credentials: "same-origin",
  });
  if (response.status === 204) return undefined as T;
  if (response.ok || accept.includes(response.status)) return (await response.json()) as T;
  throw await toApiError(response);
}

/** A JSON POST whose answer is a file (an export), as a Blob; errors are the same ApiError as `request`. */
export async function postForFile(path: string, body: unknown): Promise<Blob> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });
  if (response.ok) return response.blob();
  throw await toApiError(response);
}

/** A multipart upload (a file the user picked); errors are the same ApiError as `request`. */
export async function postForm<T>(path: string, form: FormData): Promise<T> {
  const response = await fetch(path, { method: "POST", body: form, credentials: "same-origin" });
  if (response.status === 204) return undefined as T;
  if (response.ok) return (await response.json()) as T;
  throw await toApiError(response);
}

/** The API's error as an ApiError: `code` when the API names one, else a code from the status; FastAPI's
 * string `detail` is kept so the message can show it. */
async function toApiError(response: Response): Promise<ApiError> {
  let code = response.status === 401 ? "unauthenticated" : response.status === 403 ? "forbidden" : response.status === 404 ? "not_found" : response.status === 409 ? "conflict" : "http_error";
  let detail: unknown;
  try {
    const payload = (await response.json()) as { code?: string; detail?: unknown };
    code = payload.code ?? (response.status === 422 ? "invalid_input" : code);
    detail = payload.detail;
  } catch {
    // Non-JSON error bodies keep the generic code.
  }
  return new ApiError(response.status, code, detail);
}

export const getJson = <T>(path: string, accept: number[] = [], fetcher?: Fetcher) => request<T>("GET", path, { accept, fetcher });
