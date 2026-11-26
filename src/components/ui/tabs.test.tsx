import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Tabs, nextTab, tabBarClass, tabClass, type TabItem } from "./tabs";

const ITEMS: TabItem[] = [
  { id: "summary", label: "Resumen" },
  { id: "history", label: "Historial", badge: 12 },
  { id: "files", label: "Archivos", disabled: true },
  { id: "notes", label: "Notas" },
];

/** The opening tag of every tab, in order. */
const tabs = (html: string) => html.match(/<button[^>]*role="tab"[^>]*>/g) ?? [];

describe("nextTab", () => {
  test("Right and Left walk the bar, skip a disabled tab and wrap around the ends", () => {
    expect(nextTab(ITEMS, "summary", "ArrowRight")).toBe("history");
    expect(nextTab(ITEMS, "history", "ArrowRight")).toBe("notes");
    expect(nextTab(ITEMS, "notes", "ArrowRight")).toBe("summary");
    expect(nextTab(ITEMS, "summary", "ArrowLeft")).toBe("notes");
    expect(nextTab(ITEMS, "notes", "ArrowLeft")).toBe("history");
  });

  test("Home and End go to the first and last tab that can be chosen", () => {
    expect(nextTab(ITEMS, "notes", "Home")).toBe("summary");
    expect(nextTab(ITEMS, "summary", "End")).toBe("notes");
    expect(nextTab([{ id: "a", label: "A", disabled: true }, ...ITEMS], "history", "Home")).toBe("summary");
    expect(nextTab([...ITEMS, { id: "z", label: "Z", disabled: true }], "history", "End")).toBe("notes");
  });

  test("nowhere to go answers null", () => {
    expect(nextTab(ITEMS, "summary", "Home")).toBeNull();
    expect(nextTab(ITEMS, "notes", "End")).toBeNull();
    expect(nextTab([], "summary", "ArrowRight")).toBeNull();
    expect(nextTab([{ id: "only", label: "Única" }], "only", "ArrowRight")).toBeNull();
    expect(nextTab([{ id: "a", label: "A", disabled: true }], "a", "ArrowLeft")).toBeNull();
  });

  test("a current tab that is disabled or unknown still has neighbours", () => {
    expect(nextTab(ITEMS, "files", "ArrowRight")).toBe("notes");
    expect(nextTab(ITEMS, "files", "ArrowLeft")).toBe("history");
    expect(nextTab(ITEMS, "gone", "ArrowRight")).toBe("summary");
    expect(nextTab(ITEMS, "gone", "ArrowLeft")).toBe("notes");
  });
});

describe("Tabs", () => {
  test("a named tablist with one chosen tab, the only one in the Tab order", () => {
    const html = renderToStaticMarkup(
      <Tabs label="Secciones" items={ITEMS} value="history" onChange={() => undefined}>
        <p>Contenido del historial</p>
      </Tabs>,
    );
    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="Secciones"');
    const drawn = tabs(html);
    expect(drawn.length).toBe(4);
    expect(drawn.map((tab) => /aria-selected="true"/.test(tab))).toEqual([false, true, false, false]);
    expect(drawn.map((tab) => /tabindex="0"/.test(tab))).toEqual([false, true, false, false]);
    expect(drawn.map((tab) => /tabindex="-1"/.test(tab))).toEqual([true, false, true, true]);
    expect(drawn.map((tab) => / disabled=""/.test(tab))).toEqual([false, false, true, false]);
    expect(html).toContain(">12</span>");
  });

  test("the chosen tab controls the panel and the panel is named by it", () => {
    const html = renderToStaticMarkup(
      <Tabs label="Secciones" items={ITEMS} value="history" onChange={() => undefined}>
        <p>Contenido del historial</p>
      </Tabs>,
    );
    const chosen = tabs(html)[1] ?? "";
    const tabId = /\sid="([^"]+)"/.exec(chosen)?.[1];
    const panelId = /aria-controls="([^"]+)"/.exec(chosen)?.[1];
    expect(tabId).toBeTruthy();
    expect(panelId).toBeTruthy();
    const panel = /<div[^>]*role="tabpanel"[^>]*>/.exec(html)?.[0] ?? "";
    expect(panel).toContain(`id="${panelId}"`);
    expect(panel).toContain(`aria-labelledby="${tabId}"`);
    expect(panel).toContain('tabindex="0"');
    expect(html).toContain("Contenido del historial");
    expect(tabs(html).filter((tab) => tab.includes("aria-controls")).length).toBe(1);
  });

  test("children as a function receive the chosen id", () => {
    const html = renderToStaticMarkup(
      <Tabs label="Secciones" items={ITEMS} value="notes" onChange={() => undefined}>
        {(id) => <p>panel de {id}</p>}
      </Tabs>,
    );
    expect(html).toContain("panel de notes");
  });

  test("without children only the bar is drawn", () => {
    const html = renderToStaticMarkup(<Tabs label="Secciones" items={ITEMS} value="summary" onChange={() => undefined} />);
    expect(html).not.toContain("tabpanel");
    expect(html).not.toContain("aria-controls");
  });

  test("a value that names no tab, or a disabled one, leaves the first open tab as the stop", () => {
    const unknown = renderToStaticMarkup(
      <Tabs label="Secciones" items={ITEMS} value="gone" onChange={() => undefined}>
        <p>Contenido</p>
      </Tabs>,
    );
    expect(unknown).not.toContain('aria-selected="true"');
    expect(unknown).not.toContain("tabpanel");
    expect(tabs(unknown).map((tab) => /tabindex="0"/.test(tab))).toEqual([true, false, false, false]);
    const disabled = renderToStaticMarkup(<Tabs label="Secciones" items={ITEMS} value="files" onChange={() => undefined} />);
    expect(tabs(disabled).map((tab) => /aria-selected="true"/.test(tab))).toEqual([false, false, true, false]);
    expect(tabs(disabled).map((tab) => /tabindex="0"/.test(tab))).toEqual([true, false, false, false]);
  });

  test("no tabs draw an empty bar", () => {
    const html = renderToStaticMarkup(<Tabs label="Secciones" items={[]} value="" onChange={() => undefined} />);
    expect(html).toContain('role="tablist"');
    expect(tabs(html)).toEqual([]);
  });

  test("the class helpers stay as they were", () => {
    expect(tabBarClass).toBe("flex flex-wrap gap-0.5 border-b border-[var(--line-strong)]");
    expect(tabClass(true)).toContain("border-[var(--accent)]");
    expect(tabClass(false)).toContain("border-transparent");
  });
});
