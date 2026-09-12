import type { ProcessGroupId } from "@/data/types";

/**
 * Group colours for Level 1 — the code chip, sidebar marker and architecture
 * blocks. All four come from the brand palette (PRD 11).
 */
export const GROUP_ACCENT: Record<
  ProcessGroupId,
  { chip: string; bar: string; block: string }
> = {
  M: { chip: "bg-cobalt text-white", bar: "bg-cobalt", block: "border-cobalt" },
  G: { chip: "bg-teal text-navy", bar: "bg-teal", block: "border-teal" },
  C: { chip: "bg-navy text-white", bar: "bg-navy", block: "border-navy" },
  S: { chip: "bg-orange text-navy", bar: "bg-orange", block: "border-orange" },
};

/**
 * Splits a process group into chain stages. `C4.1`–`C4.4` share the stage `C4`
 * and are drawn stacked; every other process is a stage of its own (PRD 8.7).
 */
export function chainStages<T extends { id: string }>(processes: T[]): T[][] {
  const stages = new Map<string, T[]>();

  for (const process of processes) {
    const dot = process.id.indexOf(".");
    const stageKey = dot === -1 ? process.id : process.id.slice(0, dot);
    const members = stages.get(stageKey) ?? [];
    members.push(process);
    stages.set(stageKey, members);
  }

  return [...stages.values()];
}
