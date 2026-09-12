import type { ReactNode } from "react";
import {
  MapInteractionContext,
  type MapInteraction,
} from "@/components/level0/map-focus";

/**
 * Focus state and click handling for the map. Held in context so every box does
 * not have to be threaded through six layers of props.
 */
export function MapInteractionProvider({
  value,
  children,
}: {
  value: MapInteraction;
  children: ReactNode;
}) {
  return (
    <MapInteractionContext value={value}>{children}</MapInteractionContext>
  );
}
