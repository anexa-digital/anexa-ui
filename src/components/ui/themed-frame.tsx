import { useEffect, useRef } from "react";

import { subscribe } from "../../lib/tokens";
import { FONT_FACES } from "../../styles/fonts";

// A page of the same origin shown inside the app (a guide, a document) that follows the app's theme. The page keeps
// its own look when opened alone; inside the frame, its own CSS variables take the values of the kit's tokens in
// force (whatever the skin and mode), its <html> gets the same data-theme/data-skin/data-density, and the skins'
// self-hosted fonts are available to it. The page only needs to be tokenized: colors and families as variables on
// :root.

/** Page variable -> kit token, e.g. { "--bg": "--paper", "--fg": "--ink", "--display": "--font-display" }. */
export type TokenMap = Record<string, string>;

const STYLE_ID = "anexa-theme";
const FONTS_ID = "anexa-theme-fonts";

/** The CSS that gives the page's variables the kit's values (`read` returns a token's computed value). Pure. */
export function themeCss(map: TokenMap, read: (token: string) => string): string {
  const lines = Object.entries(map)
    .map(([variable, token]) => [variable, read(token).trim()] as const)
    .filter(([, value]) => value !== "")
    .map(([variable, value]) => `  ${variable}: ${value} !important;`);
  // :root and every [data-theme] the page declares: the kit's values win over the page's own dark and light blocks.
  return `:root, :root[data-theme], :root:not([data-theme]) {\n${lines.join("\n")}\n}`;
}

/** The skins' fonts as @font-face rules with absolute URLs (the frame's document has another path). */
export function fontsCss(base: string): string {
  return FONT_FACES.map((face) => `@font-face{font-family:"${face.family}";font-style:${face.style};font-weight:${face.weight};font-display:swap;src:url("${new URL(face.url, base).href}") format("woff2");unicode-range:${face.range}}`).join("\n");
}

/** The mode in force: «system» resolved by the browser's preference. */
function effectiveMode(): "dark" | "light" {
  const mode = document.documentElement.getAttribute("data-theme");
  if (mode === "dark" || mode === "light") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Writes the theme into the frame's document; a frame of another origin is left as it is. */
function paint(frame: HTMLIFrameElement | null, map: TokenMap) {
  let doc: Document | null = null;
  try {
    doc = frame?.contentDocument ?? null;
  } catch {
    return; // another origin
  }
  if (!doc?.documentElement) return;
  const root = document.documentElement;
  const html = doc.documentElement;
  html.setAttribute("data-theme", effectiveMode());
  for (const name of ["data-skin", "data-density"]) {
    const value = root.getAttribute(name);
    if (value) html.setAttribute(name, value);
  }
  const computed = getComputedStyle(root);
  const head = doc.head ?? html;
  let style = doc.getElementById(STYLE_ID);
  if (!style) {
    style = doc.createElement("style");
    style.id = STYLE_ID;
  }
  style.textContent = themeCss(map, (token) => computed.getPropertyValue(token));
  head.append(style); // last, so it wins over the page's own rules of the same weight
  if (!doc.getElementById(FONTS_ID)) {
    const fonts = doc.createElement("style");
    fonts.id = FONTS_ID;
    fonts.textContent = fontsCss(window.location.href);
    head.prepend(fonts);
  }
}

/**
 * An <iframe> of the same origin that follows the app's skin and mode, live. `map` says which kit token each of the
 * page's variables takes. Everything else is a plain iframe (title, src, className).
 */
export function ThemedFrame({ src, title, map, className = "" }: { src: string; title: string; map: TokenMap; className?: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(map);
  latest.current = map;
  useEffect(() => {
    const repaint = () => paint(frame.current, latest.current);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", repaint);
    const unsubscribe = subscribe(repaint);
    return () => {
      media.removeEventListener("change", repaint);
      unsubscribe();
    };
  }, []);
  return <iframe ref={frame} title={title} src={src} onLoad={() => paint(frame.current, latest.current)} className={className} />;
}
