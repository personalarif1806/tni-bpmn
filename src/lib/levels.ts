/** The two levels of the process map, and how they map onto routes. */

export type LevelId = "level-0" | "level-1";

export interface LevelDefinition {
  id: LevelId;
  /** Tab label. */
  label: string;
  /** Short description shown under the tab label. */
  caption: string;
  /** Route the tab navigates to. */
  path: string;
}

export const LEVELS: readonly LevelDefinition[] = [
  {
    id: "level-0",
    label: "Level 0",
    caption: "Peta proses perusahaan",
    path: "/level-0",
  },
  {
    id: "level-1",
    label: "Level 1",
    caption: "Swimlane per proses",
    path: "/level-1",
  },
] as const;

/**
 * Which level a path belongs to. Used as the key for the level cross-fade, so
 * moving between two Level 1 processes does not re-trigger it.
 */
export function levelFromPathname(pathname: string): LevelId {
  return pathname.startsWith("/level-1") ? "level-1" : "level-0";
}
