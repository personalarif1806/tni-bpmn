/**
 * Typed access to the Level 0 / Level 1 data (PRD section 6).
 *
 * Everything here is computed once at module load: the data is static, so the
 * indexes are plain constants rather than hooks or context.
 */
import { withComputedNumbers } from "./numbering";
import { assertDataValid } from "./validate";
import {
  rawCrosslinks,
  rawDepartments,
  rawLanes,
  rawLayout,
  rawProcedures,
  rawProcessGroups,
  rawProcesses,
  rawStageInvolvement,
  rawUnitGroups,
  rawUnits,
} from "./raw";
import type {
  Department,
  Procedure,
  Involvement,
  Lane,
  Process,
  ProcessGroup,
  ProcessGroupId,
  ResolvedInvolvement,
  ResolvedMember,
  Stage,
  Unit,
  UnitGroup,
} from "./types";

export * from "./types";
export {
  computeStepNumbers,
  formatNumberRange,
  isNumberedStep,
} from "./numbering";

/* --------------------------------------------------------------- Catalogue */

export const units = rawUnits;
export const departments = rawDepartments;
export const unitGroups = rawUnitGroups;
export const layout = rawLayout;
export const stageInvolvement = rawStageInvolvement;
export const lanes = rawLanes;
export const processGroups = rawProcessGroups;
export const crosslinks = rawCrosslinks;

/** The 20 processes, each with `num` recomputed from its own steps (PRD 6.2). */
export const processes: Process[] = rawProcesses.map(withComputedNumbers);

const processById: Record<string, Process> = Object.fromEntries(
  processes.map((process) => [process.id, process]),
);

export const PROCESS_GROUP_ORDER: readonly ProcessGroupId[] = [
  "M",
  "G",
  "C",
  "S",
] as const;

export function getUnit(unitId: string): Unit | undefined {
  return units[unitId];
}

export function getDepartment(departmentId: string): Department | undefined {
  return departments[departmentId];
}

export function getUnitGroup(groupId: string): UnitGroup | undefined {
  return unitGroups[groupId];
}

export function getLane(laneId: string): Lane | undefined {
  return lanes[laneId];
}

export function getProcess(processId: string): Process | undefined {
  return processById[processId];
}

export function getProcessGroup(
  groupId: ProcessGroupId,
): ProcessGroup | undefined {
  return processGroups[groupId];
}

export function listProcessesByGroup(group: ProcessGroupId): Process[] {
  return processes.filter((process) => process.g === group);
}

/** All processes, grouped and in M → G → C → S order. */
export function listProcessGroups(): {
  id: ProcessGroupId;
  group: ProcessGroup;
  processes: Process[];
}[] {
  return PROCESS_GROUP_ORDER.flatMap((id) => {
    const group = processGroups[id];
    return group ? [{ id, group, processes: listProcessesByGroup(id) }] : [];
  });
}

/** Departments of a profit center, in the order the unit lists them. */
export function listDepartments(
  profitCenterId: string,
): { id: string; department: Department }[] {
  const unit = units[profitCenterId];
  if (!unit?.depts) return [];
  return unit.depts.flatMap((id) => {
    const department = departments[id];
    return department ? [{ id, department }] : [];
  });
}

/** Display name for a unit, department, or unit group id. */
export function displayName(id: string): string {
  return units[id]?.name ?? departments[id]?.n ?? unitGroups[id]?.n ?? id;
}

/** Short display name, preferring a department's chip label. */
export function shortName(id: string): string {
  const department = departments[id];
  if (department) return department.s ?? department.n;
  return displayName(id);
}

/* ------------------------------------------------------------------ Stages */

/** Id of profit-center lane step `index` (1-based), e.g. `lab_2`. */
export function stageIdForLaneStep(
  profitCenterId: string,
  stepIndex: number,
): string {
  return `${profitCenterId}_${stepIndex}`;
}

function resolveMember(id: string): ResolvedMember | undefined {
  if (units[id]) return { id, kind: "unit", name: units[id].name };
  const department = departments[id];
  if (department) return { id, kind: "dept", name: department.n };
  return undefined;
}

function resolveInvolvement(row: Involvement): ResolvedInvolvement {
  const [id, role, description, needsConfirmation] = row;
  const group = unitGroups[id];

  if (group) {
    const members = group.ids.flatMap((memberId) => {
      const member = resolveMember(memberId);
      return member ? [member] : [];
    });
    return {
      id,
      kind: "group",
      name: group.n,
      sub: group.sub,
      role,
      description,
      needsConfirmation: needsConfirmation === true,
      members,
      coverage: members,
    };
  }

  const member = resolveMember(id);
  const self: ResolvedMember = member ?? { id, kind: "unit", name: id };
  return {
    id,
    kind: self.kind,
    name: self.name,
    role,
    description,
    needsConfirmation: needsConfirmation === true,
    members: [],
    coverage: [self],
  };
}

function buildStageIndex(): Record<string, Stage> {
  const index: Record<string, Stage> = {};

  for (const stageId of layout.VC) {
    index[stageId] = {
      id: stageId,
      kind: "vc",
      title: units[stageId]?.name ?? stageId,
      involvement: (stageInvolvement.vc[stageId] ?? []).map(resolveInvolvement),
    };
  }

  for (const pcId of layout.PCS) {
    const steps = units[pcId]?.steps ?? [];
    const rows = stageInvolvement.pc[pcId] ?? [];
    steps.forEach((title, position) => {
      const stepIndex = position + 1;
      const stageId = stageIdForLaneStep(pcId, stepIndex);
      index[stageId] = {
        id: stageId,
        kind: "pc",
        title,
        pcId,
        stepIndex,
        involvement: (rows[position] ?? []).map(resolveInvolvement),
      };
    });
  }

  return index;
}

/**
 * Every clickable stage: the 5 value-chain stages and the 6 lane steps of each
 * of the 4 profit centers, with RASCI rows resolved against the catalogue.
 */
export const stageIndex: Record<string, Stage> = buildStageIndex();

/** Stage ids in map order — value chain first, then lane steps. Prev/next uses this. */
export const stageOrder: string[] = [
  ...layout.VC,
  ...layout.PCS.flatMap((pcId) =>
    (units[pcId]?.steps ?? []).map((_, position) =>
      stageIdForLaneStep(pcId, position + 1),
    ),
  ),
];

export function getStage(stageId: string): Stage | undefined {
  return stageIndex[stageId];
}

export function listStages(): Stage[] {
  return stageOrder.flatMap((id) => {
    const stage = stageIndex[id];
    return stage ? [stage] : [];
  });
}

/** Neighbouring stage in map order; wraps around so the panel arrows never dead-end. */
export function adjacentStageId(
  stageId: string,
  direction: 1 | -1,
): string | undefined {
  const position = stageOrder.indexOf(stageId);
  if (position === -1) return undefined;
  const next = (position + direction + stageOrder.length) % stageOrder.length;
  return stageOrder[next];
}

/** Every unit and department involved in a stage, groups expanded. */
export function stageParticipants(
  stageId: string,
): Map<string, { role: import("./types").RasciRole; member: ResolvedMember }> {
  const stage = stageIndex[stageId];
  const participants = new Map<
    string,
    { role: import("./types").RasciRole; member: ResolvedMember }
  >();
  if (!stage) return participants;

  for (const row of stage.involvement) {
    for (const member of row.coverage) {
      if (!participants.has(member.id)) {
        participants.set(member.id, { role: row.role, member });
      }
    }
  }

  return participants;
}

/**
 * Where one unit or department appears across the core process: the inverse of
 * `stageIndex`, with group rows attributed to each member (PRD 8.4).
 */
export interface ParticipantStage {
  stageId: string;
  role: import("./types").RasciRole;
  description: string;
  needsConfirmation: boolean;
  /** Set when the row named a unit group rather than this participant. */
  viaGroupId?: string;
  /** Group caption, for "sebagai bagian dari …". */
  viaGroupName?: string;
}

function buildParticipantStages(): Record<string, ParticipantStage[]> {
  const index: Record<string, ParticipantStage[]> = {};

  for (const stageId of stageOrder) {
    const stage = stageIndex[stageId];
    if (!stage) continue;

    for (const row of stage.involvement) {
      for (const member of row.coverage) {
        (index[member.id] ??= []).push({
          stageId,
          role: row.role,
          description: row.description,
          needsConfirmation: row.needsConfirmation,
          ...(row.kind === "group"
            ? { viaGroupId: row.id, viaGroupName: row.name }
            : {}),
        });
      }
    }
  }

  return index;
}

const participantStageIndex = buildParticipantStages();

/** Stages a unit or department takes part in, in map order. */
export function participantStages(participantId: string): ParticipantStage[] {
  return participantStageIndex[participantId] ?? [];
}

/* ---------------------------------------------------- Confirmation status */

/**
 * What still needs the process owner's confirmation (PRD 17).
 *
 * `stages` are the stages holding at least one flagged role; `participants` are
 * the units and departments the flag points at, with unit groups expanded, so
 * a group flagged once tints each of its members on the map.
 */
export interface ConfirmationIndex {
  stages: ReadonlySet<string>;
  participants: ReadonlySet<string>;
}

function buildConfirmationIndex(): ConfirmationIndex {
  const stages = new Set<string>();
  const participants = new Set<string>();

  for (const stageId of stageOrder) {
    for (const row of stageIndex[stageId]?.involvement ?? []) {
      if (!row.needsConfirmation) continue;
      stages.add(stageId);
      for (const member of row.coverage) participants.add(member.id);
    }
  }

  return { stages, participants };
}

export const confirmationIndex: ConfirmationIndex = buildConfirmationIndex();

/** Does this stage hold a role that is still to be confirmed? */
export function stageNeedsConfirmation(stageId: string): boolean {
  return confirmationIndex.stages.has(stageId);
}

/** Is this unit or department named by a role that is still to be confirmed? */
export function participantNeedsConfirmation(participantId: string): boolean {
  return confirmationIndex.participants.has(participantId);
}

/* ---------------------------------------------------------------- Level 2 */

/** The controlled procedures behind Level 1 steps, keyed by procedure id. */
export const procedures: Record<string, Procedure> = rawProcedures;

/** Procedure ids in document-number order, which is also reading order. */
const procedureOrder: string[] = Object.keys(procedures).sort((a, b) =>
  procedures[a].doc.localeCompare(procedures[b].doc),
);

export function getProcedure(procedureId: string): Procedure | undefined {
  return procedures[procedureId];
}

/** Every procedure, in reading order. */
export function listProcedures(): { id: string; procedure: Procedure }[] {
  return procedureOrder.map((id) => ({ id, procedure: procedures[id] }));
}

/** The procedures detailing one Level 1 process, in reading order. */
export function proceduresForProcess(
  processId: string,
): { id: string; procedure: Procedure }[] {
  return listProcedures().filter(({ procedure }) => procedure.p === processId);
}

/**
 * Process id → step key → the procedure detailing that step. Built once;
 * `validate.ts` has already guaranteed that no step is claimed twice.
 */
const procedureByStep: Record<string, Record<string, string>> = {};
for (const [procedureId, procedure] of Object.entries(procedures)) {
  const byStep = (procedureByStep[procedure.p] ??= {});
  for (const stepKey of procedure.steps) byStep[stepKey] = procedureId;
}

/** Which procedure details this step, if the process has procedures at all. */
export function procedureForStep(
  processId: string,
  stepKey: string,
): { id: string; procedure: Procedure } | undefined {
  const procedureId = procedureByStep[processId]?.[stepKey];
  if (!procedureId) return undefined;
  return { id: procedureId, procedure: procedures[procedureId] };
}

/** Level 1 processes that have been detailed down to Level 2, in order. */
export function processesWithProcedures(): Process[] {
  const ids = new Set(Object.values(procedures).map((procedure) => procedure.p));
  return processes.filter((process) => ids.has(process.id));
}

/* -------------------------------------------------------------- Validation */

if (import.meta.env.DEV) {
  // Throws with every structural problem listed, so bad data fails loudly
  // during development instead of rendering a half-empty map. The import is
  // dropped from production builds along with this block.
  assertDataValid();
}
