import { describe, expect, test } from "bun:test";

import { ApiError, getJson } from "./api";

function respond(status: number, body: unknown): typeof fetch {
  return (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
}

describe("getJson", () => {
  test("returns the body on 2xx", async () => {
    expect(await getJson<{ a: number }>("/x", [], respond(200, { a: 1 }))).toEqual({ a: 1 });
  });

  test("raises ApiError with the server code, or one from the status", async () => {
    const named = getJson("/x", [], respond(502, { code: "api_unreachable" }));
    await expect(named).rejects.toMatchObject({ status: 502, code: "api_unreachable" });
    const plain = getJson("/x", [], respond(401, { detail: "no" }));
    await expect(plain).rejects.toBeInstanceOf(ApiError);
    await expect(plain).rejects.toMatchObject({ status: 401, code: "unauthenticated", detail: "no" });
  });

  test("accepted statuses return their body", async () => {
    expect(await getJson<{ status: string }>("/ready", [503], respond(503, { status: "unavailable" }))).toEqual({ status: "unavailable" });
  });
});
