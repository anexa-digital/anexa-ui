import { useSyncExternalStore } from "react";

/** Phones: below Tailwind's `md`. Grids show cards and the top menu folds into one button. */
export const NARROW = "(max-width: 767px)";

/** Whether a media query matches now, following it as the window changes. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (change) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", change);
      return () => media.removeEventListener("change", change);
    },
    () => window.matchMedia(query).matches,
  );
}
