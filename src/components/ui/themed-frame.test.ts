import { expect, test } from "bun:test";

import { fontsCss, themeCss } from "./themed-frame";

test("each page variable takes the computed value of its kit token, and empty tokens are left out", () => {
  const values: Record<string, string> = { "--paper": " #0d0f12", "--ink": "#e6e9ef", "--font-display": "Inter, sans-serif" };
  const css = themeCss({ "--bg": "--paper", "--fg": "--ink", "--display": "--font-display", "--gone": "--nothing" }, (token) => values[token] ?? "");
  expect(css).toContain("--bg: #0d0f12 !important;");
  expect(css).toContain("--fg: #e6e9ef !important;");
  expect(css).toContain("--display: Inter, sans-serif !important;");
  expect(css).not.toContain("--gone");
  expect(css.startsWith(":root, :root[data-theme]")).toBe(true);
});

test("the fonts travel with absolute URLs of the app's origin", () => {
  const css = fontsCss("https://app.example/quotations?x=1");
  expect(css).toContain('src:url("https://app.example/');
  expect(css).toContain('font-family:"Inter"');
});
