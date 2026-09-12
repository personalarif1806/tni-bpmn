import { useCallback, useSyncExternalStore } from "react";

/**
 * Live match for a CSS media query. Layout decisions that cannot be expressed
 * in CSS alone — such as whether the detail panel overlays the map — read from
 * here so they stay in step with the stylesheet breakpoints.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
