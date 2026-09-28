import { createContext, use } from "react";
import type { PanelKind } from "@/hooks/useDetailPanel";
import type { StageFocus } from "@/hooks/useStageFocus";
import { t } from "@/lib/i18n";

export interface MapInteraction {
  focus: StageFocus;
  /** The panel target, so the open unit or department can be marked too. */
  selected: { kind: PanelKind; id: string } | null;
  select: (kind: PanelKind, id: string) => void;
  /** True while the confirmation-status layer is switched on (PRD 17). */
  confirmationLayer: boolean;
}

const INERT: MapInteraction = {
  focus: {
    active: false,
    stageId: null,
    roles: new Map(),
    order: new Map(),
    count: 0,
  },
  selected: null,
  select: () => {},
  confirmationLayer: false,
};

export const MapInteractionContext = createContext<MapInteraction>(INERT);

export function useMapInteraction(): MapInteraction {
  return use(MapInteractionContext);
}

/**
 * Dimming attributes for one map element. In focus mode everything that is not
 * involved drops to opacity .2 through the `.focus-mode` CSS rule — one class
 * on the map root, no per-element JavaScript animation (PRD 10).
 */
export function dimProps(involved: boolean): {
  className: string;
  "data-involved": "true" | "false";
} {
  return {
    className: "map-dim",
    "data-involved": involved ? "true" : "false",
  };
}

/**
 * Marks a box for the confirmation layer. The attribute is always present so
 * the CSS can switch the whole layer with one class on the map root, exactly
 * like focus mode.
 */
export function confirmationProps(needsConfirmation: boolean): {
  "data-needs-confirmation": "true" | "false";
} {
  return { "data-needs-confirmation": needsConfirmation ? "true" : "false" };
}

/** Suffix appended to a box's label so the tint is not colour-only. */
export const CONFIRMATION_LABEL = t("perlu dikonfirmasi");
