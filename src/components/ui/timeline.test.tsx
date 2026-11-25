import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Timeline, timelineDays } from "./timeline";

describe("Timeline", () => {
  test("entries fall under the civil day of the zone, in the order given", () => {
    const items = [
      { id: "c", at: "2026-11-13T15:00:00Z" },
      { id: "b", at: "2026-11-13T03:00:00Z" }, // still the 12th in Bogotá
      { id: "a", at: "2026-11-12" }, // a day without an hour
    ];
    expect(timelineDays(items, "America/Bogota").map((group) => [group.day, group.items.map((item) => item.id)])).toEqual([
      ["2026-11-13", ["c"]],
      ["2026-11-12", ["b", "a"]],
    ]);
    expect(timelineDays(items, "UTC").map((group) => group.items.length)).toEqual([2, 1]);
  });

  test("loading, empty and filled", () => {
    expect(renderToStaticMarkup(<Timeline items={[]} loading />)).toContain("skeleton");
    expect(renderToStaticMarkup(<Timeline items={[]} empty="Aún no hay actividad con este cliente" />)).toContain("Aún no hay actividad con este cliente");
    const html = renderToStaticMarkup(<Timeline label="Actividad" timeZone="America/Bogota" items={[{ id: "1", at: "2026-11-13T15:00:00Z", kind: "Llamada", title: "Confirmó el pedido", actor: "Ana Admin" }]} />);
    expect(html).toContain('aria-label="Actividad"');
    expect(html).toContain("Confirmó el pedido");
    expect(html).toContain("Ana Admin");
    expect(html).toContain('dateTime="2026-11-13T15:00:00Z"');
  });
});
