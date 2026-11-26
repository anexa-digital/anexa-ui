import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Sparkline, sparklineShape } from "./sparkline";

describe("Sparkline", () => {
  test("a series runs from left to right, the highest value at the top", () => {
    const shape = sparklineShape([0, 5, 10], 80, 24);
    expect(shape.lines).toEqual(["M3,21 L40,12 L77,3"]);
    expect(shape.areas).toEqual(["M3,21 L40,12 L77,3 L77,21 L3,21 Z"]);
    expect(shape.dots).toEqual([]);
    expect(shape.last).toEqual({ x: 77, y: 3 });
  });

  test("a gap keeps its place and breaks the line; a value alone between gaps is a dot", () => {
    const shape = sparklineShape([0, 10, null, 5, null, 10, 0], 66, 24);
    expect(shape.lines).toEqual(["M3,21 L13,3", "M53,3 L63,21"]);
    expect(shape.dots).toEqual([{ x: 33, y: 12 }]);
    expect(shape.last).toEqual({ x: 63, y: 21 });
  });

  test("empty, a single value and a flat series never give NaN", () => {
    expect(sparklineShape([], 80, 24)).toEqual({ lines: [], areas: [], dots: [], last: null });
    expect(sparklineShape([null, null], 80, 24).last).toBeNull();
    expect(sparklineShape([Number.NaN, Number.POSITIVE_INFINITY], 80, 24).last).toBeNull();
    expect(sparklineShape([7], 80, 24)).toEqual({ lines: [], areas: [], dots: [{ x: 40, y: 12 }], last: { x: 40, y: 12 } });
    expect(sparklineShape([4, 4, 4], 80, 24).lines).toEqual(["M3,12 L40,12 L77,12"]);
    for (const values of [[], [7], [4, 4, 4], [null, 3, null], [0, 0]]) {
      const html = renderToStaticMarkup(<Sparkline values={values} ariaLabel="Tendencia" area last />);
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("Infinity");
    }
  });

  test("a fixed domain is shared by several series, and what falls outside stays at the edge", () => {
    expect(sparklineShape([50, 100], 80, 24, 0, 100).lines).toEqual(["M3,12 L77,3"]);
    expect(sparklineShape([-20, 300], 80, 24, 0, 100).lines).toEqual(["M3,21 L77,3"]);
    expect(sparklineShape([5, 5], 80, 24, 5, 5).lines).toEqual(["M3,12 L77,12"]);
  });

  test("it is an image with a name, in the color of its tone", () => {
    const html = renderToStaticMarkup(<Sparkline values={[1, 3, 2]} ariaLabel="Lecturas de la última hora" tone="warn" />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Lecturas de la última hora"');
    expect(html).toContain('width="80"');
    expect(html).toContain('height="24"');
    expect(html).toContain('stroke="var(--warn)"');
    expect(html).not.toContain("<circle");
    expect(html).not.toContain("fill-opacity");
  });

  test("area and last add the fill and the dot; no values leave a base line", () => {
    const html = renderToStaticMarkup(<Sparkline values={[1, 3, 2]} ariaLabel="Tendencia" width={120} height={32} area last tone="ok" />);
    expect(html).toContain('viewBox="0 0 120 32"');
    expect(html).toContain('fill-opacity="0.14"');
    expect(html.match(/<circle/g)?.length).toBe(1);
    const empty = renderToStaticMarkup(<Sparkline values={[]} ariaLabel="Sin lecturas" area last />);
    expect(empty).toContain('aria-label="Sin lecturas"');
    expect(empty).toContain("<line");
    expect(empty).not.toContain("<path");
    expect(empty).not.toContain("<circle");
  });
});
