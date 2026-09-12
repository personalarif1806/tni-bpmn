import { useMemo } from "react";
import {
  DURATIONS_MS,
  EASINGS,
  OFFSETS_PX,
  REDUCED_FADE_MS,
  STAGGER_CAP_MS,
  STAGGER_MS,
  type DurationName,
} from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** Durations that stay a short fade under reduced motion instead of going to 0. */
const KEEP_AS_FADE: ReadonlySet<DurationName> = new Set<DurationName>([
  "levelIn",
  "levelOut",
  "panelContentIn",
  "panelContentOut",
  "tabContent",
]);

type Durations = Record<DurationName, number>;
type Offsets = Record<keyof typeof OFFSETS_PX, number>;

export interface MotionConfig {
  /** True when the user asked for reduced motion. */
  reduced: boolean;
  /** Durations in seconds, ready for `transition={{ duration }}`. */
  duration: Durations;
  /** Easing curves, in motion's array form. */
  ease: typeof EASINGS;
  /** Vertical enter offsets in pixels — 0 under reduced motion. */
  offset: Offsets;
  /** Scroll behaviour for `scrollTo` / `scrollIntoView`. */
  scrollBehavior: ScrollBehavior;
  /**
   * Per-item stagger in seconds for a list of `count` items, clamped so the
   * whole sequence never exceeds the PRD's cap.
   */
  staggerFor: (count: number) => number;
  /** CSS transition duration as a string, for class-driven transitions. */
  cssDuration: (name: DurationName) => string;
}

/**
 * The single source of motion timing for the whole app (PRD section 10).
 * No component should write a duration of its own.
 */
export function useMotionConfig(): MotionConfig {
  const reduced = useReducedMotion();

  return useMemo<MotionConfig>(() => {
    const resolveMs = (name: DurationName): number => {
      if (!reduced) return DURATIONS_MS[name];
      return KEEP_AS_FADE.has(name) ? REDUCED_FADE_MS : 0;
    };

    const duration = Object.fromEntries(
      (Object.keys(DURATIONS_MS) as DurationName[]).map((name) => [
        name,
        resolveMs(name) / 1000,
      ]),
    ) as Durations;

    const offset: Offsets = reduced
      ? { level: 0, panelContent: 0 }
      : OFFSETS_PX;

    return {
      reduced,
      duration,
      ease: EASINGS,
      offset,
      scrollBehavior: reduced ? "auto" : "smooth",
      staggerFor: (count) => {
        if (reduced || count <= 1) return 0;
        const total = Math.min(STAGGER_MS.badge * (count - 1), STAGGER_CAP_MS);
        return total / (count - 1) / 1000;
      },
      cssDuration: (name) => `${resolveMs(name)}ms`,
    };
  }, [reduced]);
}
