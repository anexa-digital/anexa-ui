import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { timeInputClass } from "../controls";
import { DateTimeInput } from "./date-time-field";
import { TimeInput } from "./time-input";

/** The `ch` and `rem` of the clock's width, from its class. */
function width(className: string) {
  const found = /(?:^|\s)w-\[calc\((\d+)ch\+([\d.]+)rem\)\]/.exec(className);
  return found ? { ch: Number(found[1]), rem: Number(found[2]) } : null;
}

describe("clock", () => {
  test("the clock is as wide as its longest text in the font in use", () => {
    // «12:30 p. m.» (es-CO) is 11 characters; a fixed width in px clips it as soon as the font grows.
    const size = width(timeInputClass);
    expect(size).not.toBeNull();
    expect(size!.ch).toBeGreaterThanOrEqual(11);
    // Room for the field's padding and border and the browser's clock button.
    expect(size!.rem).toBeGreaterThanOrEqual(3);
    expect(timeInputClass).toContain("shrink-0");
  });

  test("TimeInput and the clock of DateTimeInput take that width", () => {
    expect(renderToStaticMarkup(<TimeInput value="14:30" onChange={() => undefined} ariaLabel="Abre" />)).toContain(timeInputClass);
    const html = renderToStaticMarkup(<DateTimeInput value={null} onChange={() => undefined} />);
    expect(html).toContain(timeInputClass);
    expect(html).not.toContain("w-28");
  });
});
