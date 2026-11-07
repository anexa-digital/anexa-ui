import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { SKINS } from "./lib/theme";

// Contrast guard of the skins: every skin, in both modes, keeps text readable and control borders visible (WCAG 2.x:
// 4.5:1 text, 3:1 non-text). A new skin that fails here would look washed out.
const root = new URL("./styles/", import.meta.url);
const base = readFileSync(new URL("base.css", root), "utf-8");

type Tokens = Record<string, { light: string; dark: string }>;

function parseBlock(body: string): Tokens {
  const tokens: Tokens = {};
  for (const match of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    const [, name, raw] = match;
    const value = raw!.trim();
    const pair = value.match(/^light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)$/i);
    if (pair) tokens[name!] = { light: pair[1]!, dark: pair[2]! };
    else if (/^#[0-9a-f]{6}$/i.test(value)) tokens[name!] = { light: value, dark: value };
  }
  return tokens;
}

function block(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`missing ${selector}`);
  return css.slice(start, css.indexOf("}", start));
}

const defaults = parseBlock(block(base, ":root"));

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const RULES: [foreground: string, background: string, minimum: number][] = [
  ["ink", "surface", 7],
  ["ink", "paper", 7],
  ["ink", "raised", 7],
  ["muted", "surface", 4.5],
  ["muted", "head", 4.5],
  ["muted", "paper", 4.5],
  ["line-strong", "surface", 3],
  ["line-strong", "field", 3],
  ["on-accent", "accent", 4.5],
  ["accent", "surface", 3],
  ["accent", "paper", 3],
  ["ok", "surface", 3],
  ["bad", "surface", 4.5],
  ["warn", "surface", 3],
  ["ink", "row-active", 7],
  ["ink", "row-hover", 7],
];

describe("skins", () => {
  for (const skin of SKINS) {
    const css = readFileSync(new URL(`skins/${skin}.css`, root), "utf-8");
    const tokens = { ...defaults, ...parseBlock(block(css, `:root[data-skin="${skin}"]`)) };
    for (const mode of ["light", "dark"] as const) {
      test(`${skin} ${mode} keeps its contrast`, () => {
        for (const [foreground, background, minimum] of RULES) {
          const fg = tokens[foreground]?.[mode];
          const bg = tokens[background]?.[mode];
          expect(fg && bg, `${foreground} / ${background}`).toBeTruthy();
          const ratio = contrast(fg!, bg!);
          expect(ratio, `${skin} ${mode}: ${foreground} ${fg} on ${background} ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(minimum);
        }
      });
    }
  }
});
