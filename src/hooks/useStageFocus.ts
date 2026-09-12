import { useMemo } from "react";
import { getStage, stageParticipants } from "@/data";
import type { RasciRole } from "@/data/types";

export interface StageFocus {
  /** True while a stage panel is open — the map root gets `.focus-mode`. */
  active: boolean;
  stageId: string | null;
  /** Unit and department ids involved in the stage, with their role. */
  roles: Map<string, RasciRole>;
  /** Stagger position of each involved id, for the badge scale-in. */
  order: Map<string, number>;
  /** How many badges will appear — caps the total stagger. */
  count: number;
}

const EMPTY: StageFocus = {
  active: false,
  stageId: null,
  roles: new Map(),
  order: new Map(),
  count: 0,
};

/**
 * Focus mode for the Level 0 map (PRD 8.3): who is involved in the open stage,
 * so the map can dim everyone else and badge the rest.
 */
export function useStageFocus(stageId: string | null): StageFocus {
  return useMemo(() => {
    if (!stageId || !getStage(stageId)) return EMPTY;

    const participants = stageParticipants(stageId);
    const roles = new Map<string, RasciRole>();
    const order = new Map<string, number>();

    let position = 0;
    for (const [id, { role }] of participants) {
      roles.set(id, role);
      order.set(id, position);
      position += 1;
    }

    return { active: true, stageId, roles, order, count: position };
  }, [stageId]);
}
