/**
 * Motion specification — PRD section 10.
 *
 * Every duration in the app is declared here, in milliseconds, exactly as the
 * PRD states it. Components never read this file directly: they call
 * `useMotionConfig()`, which converts these to seconds and collapses them when
 * the user prefers reduced motion.
 */

export const DURATIONS_MS = {
  /** Level cross-fade: new level in. */
  levelIn: 220,
  /** Level cross-fade: old level out. */
  levelOut: 140,
  /** Detail panel slide in/out. */
  panel: 260,
  /** Panel overlay fade. */
  overlay: 180,
  /** Swapping panel content: old content out. */
  panelContentOut: 100,
  /** Swapping panel content: new content in. */
  panelContentIn: 160,
  /** Focus mode on — uninvolved boxes dim to 0.2. */
  focusOn: 200,
  /** Focus mode off — everything back to full opacity. */
  focusOff: 160,
  /** Origin banner expanding at Level 1. */
  banner: 200,
  /** Matrix tab content cross-fade. */
  tabContent: 150,
  /** Hover background change on boxes and nodes. */
  hover: 120,
  /** Map zoom transform transition. */
  zoom: 200,
  /** RASCI badge scale-in, per badge (the stagger is capped separately). */
  badge: 160,
  /** Highlight pulse ring on a jumped-to node (2 pulses). */
  pulse: 600,
} as const;

export const STAGGER_MS = {
  /** RASCI badge scale-in, capped by `badgeStaggerTotal`. */
  badge: 20,
} as const;

/** The RASCI badge stagger must never take longer than this in total. */
export const STAGGER_CAP_MS = 300;

/**
 * Reduced motion keeps a short opacity cross-fade so a level swap is still
 * legible, and drops everything else to zero (PRD section 10).
 */
export const REDUCED_FADE_MS = 100;

export const EASINGS = {
  /** Default for cross-fades and most state changes. */
  out: [0, 0, 0.58, 1],
  /** Panel slide — PRD names this curve explicitly. */
  panel: [0.32, 0.72, 0, 1],
} as const;

/** Vertical offsets used by enter animations, in pixels. */
export const OFFSETS_PX = {
  /** Level cross-fade: new level rises from y 8. */
  level: 8,
  /** Panel content swap: new content rises from y 6. */
  panelContent: 6,
} as const;

export type DurationName = keyof typeof DURATIONS_MS;
