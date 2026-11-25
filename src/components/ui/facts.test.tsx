import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Facts } from "./facts";

const items = [
  { label: "Cliente", value: "Alimentos La Cosecha" },
  { label: "Huella", value: "9f2c4e1ab07d", mono: true, wide: true },
];

describe("Facts", () => {
  test("a wide item in a one-column list spans nothing", () => {
    // `col-span-2` on a grid without declared columns makes the browser add a second, implicit one.
    expect(renderToStaticMarkup(<Facts items={items} />)).not.toContain("col-span-2");
  });

  test("a wide item spans both columns of a two-column list", () => {
    const html = renderToStaticMarkup(<Facts columns={2} items={items} />);
    expect(html).toContain("md:grid-cols-2");
    expect(html.match(/md:col-span-2/g)?.length).toBe(1);
  });
});
