import { useSyncExternalStore } from "react";

// Reading the theme from React: an attribute of <html> (the skin, the density) and a token's pixel value. Both
// re-render when the attribute changes, so a grid's row height follows a skin or density switched live.

const listeners = new Set<() => void>();
let observer: MutationObserver | null = null;

function subscribe(change: () => void) {
  listeners.add(change);
  if (!observer && typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(() => listeners.forEach((listener) => listener()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-skin", "data-theme", "data-density", "data-keys"] });
  }
  return () => {
    listeners.delete(change);
    if (listeners.size === 0 && observer) {
      observer.disconnect();
      observer = null;
    }
  };
}

/** The value of an attribute of <html>, live. */
export function useHtmlAttribute(name: string): string | null {
  return useSyncExternalStore(subscribe, () => document.documentElement.getAttribute(name), () => null);
}

/** A length token (`--row-h`) as pixels, live; `fallback` when it is not a pixel length. */
export function tokenPx(name: string, fallback: number): number {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const px = /^(-?\d+(?:\.\d+)?)px$/.exec(value);
  return px ? Number(px[1]) : fallback;
}

export function useTokenPx(name: string, fallback: number): number {
  return useSyncExternalStore(subscribe, () => tokenPx(name, fallback), () => fallback);
}
