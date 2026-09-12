/**
 * Two-way links between Level 0 and Level 1 (PRD 6.3 and section 9).
 *
 * `crosslinks.json` stores one direction; the inverses and the lane-based
 * lookups are derived here, once, at module load.
 */
import {
  crosslinks,
  departments,
  getProcess,
  getStage,
  lanes,
  processes,
  units,
} from "@/data";
import type { LaneOrigin } from "@/data/types";
import { formatNumberRange } from "@/data/numbering";

const {
  PC2L1,
  VC2L1,
  L12VC,
  L12PC,
  STEP2L1,
  OWN,
  TAGS,
  P2L0,
  LANE2L0,
  DEPT2LANES,
} = crosslinks;

/* ------------------------------------------------- Level 0 stage → Level 1 */

/** The Level 1 detail behind one Level 0 stage. */
export interface StageDetail {
  processId: string;
  /** Step keys detailing the stage — empty when the whole process expands it. */
  stepKeys: string[];
  /** Step numbers for those keys, e.g. `["C4.2-02", "C4.2-03"]`. */
  numbers: string[];
  /** Compact form for the map, e.g. `C4.2-02–04`. */
  range: string;
}

function detailFor(processId: string, stepKeys: string[]): StageDetail {
  const process = getProcess(processId);
  const numbers = stepKeys.flatMap((key) => {
    const number = process?.num[key];
    return number ? [number] : [];
  });
  return { processId, stepKeys, numbers, range: formatNumberRange(numbers) };
}

/**
 * Which Level 1 processes (and which steps inside them) detail a stage.
 * A value-chain stage maps to whole processes; `vc_del` gives all four C4.x.
 */
export function stageDetails(stageId: string): StageDetail[] {
  const stage = getStage(stageId);
  if (!stage) return [];

  if (stage.kind === "vc") {
    return (VC2L1[stageId] ?? []).map((processId) => detailFor(processId, []));
  }

  const { pcId, stepIndex } = stage;
  if (!pcId || !stepIndex) return [];
  const processId = PC2L1[pcId];
  if (!processId) return [];
  const stepKeys = STEP2L1[pcId]?.[stepIndex - 1] ?? [];
  return [detailFor(processId, stepKeys)];
}

/* ------------------------------------------------- Level 1 step → Level 0 */

/** The Level 0 lane step a Level 1 step belongs to. */
export interface L0StepRef {
  /** Level 0 stage id, e.g. `lab_2`. */
  stageId: string;
  profitCenterId: string;
  /** 1-based lane step number. */
  stepIndex: number;
  /** Lane step title from the profit center's `steps` list. */
  title: string;
}

function buildStepToL0(): Record<string, Record<string, L0StepRef>> {
  const index: Record<string, Record<string, L0StepRef>> = {};

  for (const [profitCenterId, stepGroups] of Object.entries(STEP2L1)) {
    const processId = PC2L1[profitCenterId];
    if (!processId) continue;
    const titles = units[profitCenterId]?.steps ?? [];
    const byStepKey = (index[processId] ??= {});

    stepGroups.forEach((stepKeys, position) => {
      const stepIndex = position + 1;
      const ref: L0StepRef = {
        stageId: `${profitCenterId}_${stepIndex}`,
        profitCenterId,
        stepIndex,
        title: titles[position] ?? "",
      };
      for (const stepKey of stepKeys) byStepKey[stepKey] = ref;
    });
  }

  return index;
}

/** Inverse of `STEP2L1`: process id → step key → Level 0 lane step. */
export const stepToL0: Record<string, Record<string, L0StepRef>> =
  buildStepToL0();

/** Where a Level 1 step sits on the Level 0 map — the "Di Level 0" column. */
export function getL0StepRef(
  processId: string,
  stepKey: string,
): L0StepRef | undefined {
  return stepToL0[processId]?.[stepKey];
}

/* ------------------------------------------------ Level 1 process → Level 0 */

/** Where a process sits on the Level 0 map — the "Posisi di Level 0" button. */
export interface ProcessOrigin {
  /** Value-chain stage this process expands, if any. */
  stageId?: string;
  /** Profit center lane, if this is a C4.x process. */
  profitCenterId?: string;
  /** Units that own the process. */
  unitIds: string[];
}

/**
 * Inverse of `OWN`, used where `P2L0` has no entry. `P2L0` only lists the 12
 * non-core processes; the C group reaches its owners through `OWN` instead.
 */
const ownersByProcess: Record<string, string[]> = {};
for (const [unitId, processIds] of Object.entries(OWN)) {
  for (const processId of processIds) {
    (ownersByProcess[processId] ??= []).push(unitId);
  }
}

export function processOrigin(processId: string): ProcessOrigin {
  return {
    stageId: L12VC[processId],
    profitCenterId: L12PC[processId],
    unitIds: P2L0[processId] ?? ownersByProcess[processId] ?? [],
  };
}

/** Level 1 codes shown on a unit's map box (`L1 · G1, G2`). */
export function unitTags(unitId: string): string[] {
  return TAGS[unitId] ?? [];
}

/* --------------------------------------------- Level 0 unit → Level 1 lanes */

/** Processes a Level 0 unit or department owns and performs in. */
export interface UnitProcesses {
  /** Process ids this unit owns (`OWN`). */
  owned: string[];
  /** Process id → the lanes this unit or department performs in. */
  involved: Record<string, string[]>;
}

/**
 * The Level 0 unit or department behind a lane.
 *
 * `LANE2L0` only maps the core-process lanes. The remaining lanes are either
 * named exactly after a Level 0 unit (`cms`, `hr`, `md`, …) — resolved here by
 * identity — or generic roles ("Pemilik proses", "Unit terkait") that
 * deliberately have no single owner and resolve to `undefined`.
 */
export function laneOrigin(laneId: string): LaneOrigin | undefined {
  const mapped = LANE2L0[laneId];
  if (mapped) return mapped;
  if (units[laneId]) return { u: laneId };
  if (departments[laneId]) return { d: laneId };
  return undefined;
}

/** Lane ids belonging directly to a Level 0 unit or department. */
function lanesForOrigin(kind: "u" | "d", id: string): Set<string> {
  const laneIds = new Set<string>();
  for (const laneId of Object.keys(lanes)) {
    const origin = laneOrigin(laneId);
    if (!origin) continue;
    if (kind === "u" && origin.u === id) laneIds.add(laneId);
    if (kind === "d" && origin.d === id) laneIds.add(laneId);
  }
  return laneIds;
}

function processesForLanes(laneIds: Set<string>): Record<string, string[]> {
  const involved: Record<string, string[]> = {};
  if (laneIds.size === 0) return involved;

  for (const process of processes) {
    const used = process.lanes.filter((laneId) => laneIds.has(laneId));
    if (used.length > 0) involved[process.id] = used;
  }

  return involved;
}

/**
 * A unit's Level 1 footprint: processes it owns, and processes where it — or
 * one of its departments — appears as a lane. Owned processes can also appear
 * in `involved`; the panel decides how to split them (PRD 8.4).
 */
export function unitToProcesses(unitId: string): UnitProcesses {
  const laneIds = lanesForOrigin("u", unitId);

  for (const departmentId of units[unitId]?.depts ?? []) {
    for (const laneId of DEPT2LANES[departmentId] ?? []) laneIds.add(laneId);
    for (const laneId of lanesForOrigin("d", departmentId)) laneIds.add(laneId);
  }

  return { owned: OWN[unitId] ?? [], involved: processesForLanes(laneIds) };
}

/** The same, for a single department (PRD 8.4, department panel). */
export function departmentToProcesses(departmentId: string): UnitProcesses {
  const laneIds = new Set(DEPT2LANES[departmentId] ?? []);
  for (const laneId of lanesForOrigin("d", departmentId)) laneIds.add(laneId);
  return { owned: OWN[departmentId] ?? [], involved: processesForLanes(laneIds) };
}
