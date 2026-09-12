import { useMediaQuery } from "@/hooks/useMediaQuery";

/**
 * Live `prefers-reduced-motion` state. Re-renders when the user flips the OS
 * setting, so the app does not need a reload to honour it.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
