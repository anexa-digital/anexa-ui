import { useCallback, useMemo, useSyncExternalStore } from "react";

import type { Preferences } from "./types";

// Each grid's arrangement (columns, widths, pinning, density, saved views) is plain JSON under the grid's name. By
// default it lives in this browser (localStorage); an app that keeps it per person on its server gives the kit a
// `GridStorage` (`configureGridStorage`) that reads from its cache and writes through to the API.
const KEY = (grid: string) => `anexa_grid_${grid}`;
const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, { raw: string | null; value: Partial<Preferences> }>();

/** Where the grids' arrangements live: `get` must answer at once (a cache), `set` may write anywhere. */
export type GridStorage = { get: (grid: string) => string | null; set: (grid: string, raw: string) => void };

const localStorageAdapter: GridStorage = {
  get: (grid) => {
    try {
      return localStorage.getItem(KEY(grid));
    } catch {
      return null; // No storage (private window): the arrangement lasts while the page is open.
    }
  },
  set: (grid, raw) => {
    try {
      localStorage.setItem(KEY(grid), raw);
    } catch {
      // See get().
    }
  },
};
let storage: GridStorage = localStorageAdapter;

/** Replaces where the grids keep their arrangement (the app's server, per person); every open grid re-reads. */
export function configureGridStorage(adapter: GridStorage | null): void {
  storage = adapter ?? localStorageAdapter;
  cache.clear();
  for (const set of listeners.values()) set.forEach((listener) => listener());
}

export function defaultPreferences(columns: { id: string; meta?: { hidden?: boolean } }[]): Preferences {
  return {
    visibility: Object.fromEntries(columns.filter((column) => column.meta?.hidden).map((column) => [column.id, false])),
    order: columns.map((column) => column.id),
    sizing: {},
    pinning: { left: [], right: [] },
    density: "compact",
    views: [],
  };
}

/** Stored preferences over the defaults; columns the code no longer has are dropped, new ones join at the end. */
export function mergePreferences(defaults: Preferences, stored: Partial<Preferences>): Preferences {
  const known = new Set(defaults.order);
  const order = [...(stored.order ?? []).filter((id) => known.has(id)), ...defaults.order.filter((id) => !(stored.order ?? []).includes(id))];
  const keep = (ids: string[] | undefined) => (ids ?? []).filter((id) => known.has(id));
  return {
    ...defaults,
    ...stored,
    visibility: { ...defaults.visibility, ...stored.visibility },
    order,
    pinning: { left: keep(stored.pinning?.left), right: keep(stored.pinning?.right) },
    views: stored.views ?? [],
  };
}

function read(grid: string): Partial<Preferences> {
  const raw = storage.get(grid);
  const cached = cache.get(grid);
  if (cached && cached.raw === raw) return cached.value;
  let value: Partial<Preferences> = {};
  try {
    value = raw ? (JSON.parse(raw) as Partial<Preferences>) : {};
  } catch {
    value = {};
  }
  cache.set(grid, { raw, value });
  return value;
}

function write(grid: string, value: Partial<Preferences>) {
  const raw = JSON.stringify(value);
  storage.set(grid, raw);
  cache.set(grid, { raw, value });
  listeners.get(grid)?.forEach((listener) => listener());
}

/** The grid's preferences and a setter that merges a change; every grid of the same name follows along. */
export function usePreferences(grid: string, defaults: Preferences) {
  const subscribe = useCallback(
    (listener: () => void) => {
      const set = listeners.get(grid) ?? new Set();
      set.add(listener);
      listeners.set(grid, set);
      return () => set.delete(listener);
    },
    [grid],
  );
  const stored = useSyncExternalStore(subscribe, () => read(grid));
  const preferences = useMemo(() => mergePreferences(defaults, stored), [defaults, stored]);
  const change = useCallback((update: Partial<Preferences>) => write(grid, { ...read(grid), ...update }), [grid]);
  const reset = useCallback(() => write(grid, { views: read(grid).views ?? [] }), [grid]);
  return { preferences, change, reset };
}
