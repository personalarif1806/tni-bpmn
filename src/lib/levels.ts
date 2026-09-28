/** The levels of the process map, and how they map onto routes. */

import { t } from "@/lib/i18n";


export type LevelId = "level-0" | "level-1" | "level-2";

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
    caption: t("Peta proses perusahaan"),
    path: "/level-0",
  },
  {
    id: "level-1",
    label: "Level 1",
    caption: t("Swimlane per proses"),
    path: "/level-1",
  },
  {
    id: "level-2",
    label: "Level 2",
    caption: t("Prosedur terkendali"),
    path: "/level-2",
  },
] as const;

/**
 * Which level a path belongs to. Used as the key for the level cross-fade, so
 * moving between two Level 1 processes does not re-trigger it.
 */
export function levelFromPathname(pathname: string): LevelId {
  if (pathname.startsWith("/level-2")) return "level-2";
  if (pathname.startsWith("/level-1")) return "level-1";
  return "level-0";
}
