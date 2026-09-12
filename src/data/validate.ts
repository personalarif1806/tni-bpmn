/**
 * Data validation — PRD milestone M1.
 *
 * The data is hand-maintained JSON, so every structural assumption the renderer
 * makes is checked here and reported in one go. Runs once in development.
 */
import {
  rawCrosslinks,
  rawDepartments,
  rawLanes,
  rawLayout,
  rawProcesses,
  rawStageInvolvement,
  rawUnitGroups,
  rawUnits,
} from "./raw";
import type {
  CrosslinkData,
  Department,
  Involvement,
  Lane,
  LayoutData,
  Process,
  StageInvolvementData,
  StepNext,
  Unit,
  UnitGroup,
} from "./types";

/** Everything the validator needs. Injectable so the checks can be tested. */
export interface DataSet {
  units: Record<string, Unit>;
  departments: Record<string, Department>;
  unitGroups: Record<string, UnitGroup>;
  layout: LayoutData;
  stageInvolvement: StageInvolvementData;
  lanes: Record<string, Lane>;
  processes: Process[];
  crosslinks: CrosslinkData;
}

/** The data as shipped in this folder. */
export const shippedData: DataSet = {
  units: rawUnits,
  departments: rawDepartments,
  unitGroups: rawUnitGroups,
  layout: rawLayout,
  stageInvolvement: rawStageInvolvement,
  lanes: rawLanes,
  processes: rawProcesses,
  crosslinks: rawCrosslinks,
};

export interface DataIssue {
  /** Where the problem is, e.g. `l1-processes.json · C4.2`. */
  scope: string;
  message: string;
}

function nextKey(next: StepNext): string {
  return typeof next === "string" ? next : next[0];
}

function isKnownParticipant(data: DataSet, id: string): boolean {
  return (
    data.units[id] !== undefined ||
    data.departments[id] !== undefined ||
    data.unitGroups[id] !== undefined
  );
}

function checkProcesses(data: DataSet, issues: DataIssue[]): void {
  const processIds = new Set(data.processes.map((process) => process.id));

  for (const process of data.processes) {
    const scope = `l1-processes.json · ${process.id}`;
    const laneIds = new Set(process.lanes);
    const stepKeys = new Set(process.steps.map((step) => step.k));
    const usedLanes = new Set<string>();
    const occupiedCells = new Map<string, string>();

    for (const laneId of process.lanes) {
      if (!data.lanes[laneId]) {
        issues.push({
          scope,
          message: `lane "${laneId}" is not defined in l1-lanes.json`,
        });
      }
    }

    for (const step of process.steps) {
      usedLanes.add(step.l);

      if (!laneIds.has(step.l)) {
        issues.push({
          scope,
          message: `step "${step.k}" sits in lane "${step.l}", which is not in process.lanes`,
        });
      }

      const cell = `${step.l}@${step.c}`;
      const occupant = occupiedCells.get(cell);
      if (occupant) {
        issues.push({
          scope,
          message: `steps "${occupant}" and "${step.k}" share lane "${step.l}" column ${step.c}`,
        });
      } else {
        occupiedCells.set(cell, step.k);
      }

      for (const next of step.n ?? []) {
        const target = nextKey(next);
        if (!stepKeys.has(target)) {
          issues.push({
            scope,
            message: `step "${step.k}" points at "${target}", which does not exist`,
          });
        }
      }
    }

    for (const laneId of process.lanes) {
      if (!usedLanes.has(laneId)) {
        issues.push({
          scope,
          message: `lane "${laneId}" is declared but no step uses it`,
        });
      }
    }

    for (const relatedId of process.rel) {
      if (!processIds.has(relatedId)) {
        issues.push({
          scope,
          message: `related process "${relatedId}" does not exist`,
        });
      }
    }
  }
}

function checkLevel0(data: DataSet, issues: DataIssue[]): void {
  const scope = "l0-units.json";

  for (const [groupId, group] of Object.entries(data.unitGroups)) {
    for (const memberId of group.ids) {
      if (!data.units[memberId] && !data.departments[memberId]) {
        issues.push({
          scope: `l0-unit-groups.json · ${groupId}`,
          message: `member "${memberId}" is neither a unit nor a department`,
        });
      }
    }
  }

  for (const [departmentId, department] of Object.entries(data.departments)) {
    if (!data.units[department.pc]) {
      issues.push({
        scope: `l0-departments.json · ${departmentId}`,
        message: `profit center "${department.pc}" is not a unit`,
      });
    }
  }

  const layoutBands: [string, string[]][] = [
    ["TOP_L", data.layout.TOP_L],
    ["TOP_R", data.layout.TOP_R],
    ["BOTTOM", data.layout.BOTTOM],
    ["VC", data.layout.VC],
    ["PCS", data.layout.PCS],
    ["EXT_L", data.layout.EXT_L.map(([unitId]) => unitId)],
    ["EXT_R", data.layout.EXT_R.map(([unitId]) => unitId)],
  ];

  for (const [band, ids] of layoutBands) {
    for (const unitId of ids) {
      if (!data.units[unitId]) {
        issues.push({
          scope: `l0-layout.json · ${band}`,
          message: `"${unitId}" is not a unit`,
        });
      }
    }
  }

  for (const rankId of data.layout.RANK) {
    if (!isKnownParticipant(data, rankId)) {
      issues.push({
        scope: "l0-layout.json · RANK",
        message: `"${rankId}" is neither a unit, department, nor unit group`,
      });
    }
  }

  const checkRows = (stageScope: string, rows: Involvement[]): void => {
    for (const [participantId, role, description] of rows) {
      if (!isKnownParticipant(data, participantId)) {
        issues.push({
          scope: stageScope,
          message: `"${participantId}" is neither a unit, department, nor unit group`,
        });
      }
      if (!data.layout.RAS.includes(role)) {
        issues.push({
          scope: stageScope,
          message: `"${participantId}" has unknown RASCI role "${role}"`,
        });
      }
      if (!description.trim()) {
        issues.push({
          scope: stageScope,
          message: `"${participantId}" has an empty role description`,
        });
      }
    }
  };

  for (const [stageId, rows] of Object.entries(data.stageInvolvement.vc)) {
    if (!data.units[stageId]) {
      issues.push({
        scope: "l0-stage-involvement.json · vc",
        message: `stage "${stageId}" is not a unit`,
      });
    }
    checkRows(`l0-stage-involvement.json · ${stageId}`, rows);
  }

  for (const [profitCenterId, stepRows] of Object.entries(
    data.stageInvolvement.pc,
  )) {
    const steps = data.units[profitCenterId]?.steps;
    if (!steps) {
      issues.push({
        scope: "l0-stage-involvement.json · pc",
        message: `profit center "${profitCenterId}" has no steps in l0-units.json`,
      });
      continue;
    }
    if (steps.length !== stepRows.length) {
      issues.push({
        scope: `l0-stage-involvement.json · ${profitCenterId}`,
        message: `${stepRows.length} involvement lists for ${steps.length} lane steps`,
      });
    }
    stepRows.forEach((rows, position) => {
      checkRows(
        `l0-stage-involvement.json · ${profitCenterId}_${position + 1}`,
        rows,
      );
    });
  }

  for (const [unitId, unit] of Object.entries(data.units)) {
    // Value-chain stages list department display names, not ids (PRD 6.1).
    if (unit.cat !== "pc") continue;
    for (const departmentId of unit.depts ?? []) {
      if (!data.departments[departmentId]) {
        issues.push({
          scope: `${scope} · ${unitId}`,
          message: `department "${departmentId}" is not in l0-departments.json`,
        });
      }
    }
  }
}

function checkCrosslinks(data: DataSet, issues: DataIssue[]): void {
  const scope = "crosslinks.json";
  const processById = new Map(
    data.processes.map((process) => [process.id, process]),
  );

  const expectUnit = (key: string, unitId: string): void => {
    if (!data.units[unitId]) {
      issues.push({ scope: `${scope} · ${key}`, message: `unknown unit "${unitId}"` });
    }
  };
  const expectProcess = (key: string, processId: string): void => {
    if (!processById.has(processId)) {
      issues.push({
        scope: `${scope} · ${key}`,
        message: `unknown process "${processId}"`,
      });
    }
  };

  for (const [profitCenterId, processId] of Object.entries(
    data.crosslinks.PC2L1,
  )) {
    expectUnit("PC2L1", profitCenterId);
    expectProcess("PC2L1", processId);
  }
  for (const [processId, profitCenterId] of Object.entries(
    data.crosslinks.L12PC,
  )) {
    expectProcess("L12PC", processId);
    expectUnit("L12PC", profitCenterId);
  }
  for (const [stageId, processIds] of Object.entries(data.crosslinks.VC2L1)) {
    expectUnit("VC2L1", stageId);
    processIds.forEach((processId) => expectProcess("VC2L1", processId));
  }
  for (const [processId, stageId] of Object.entries(data.crosslinks.L12VC)) {
    expectProcess("L12VC", processId);
    expectUnit("L12VC", stageId);
  }

  for (const [profitCenterId, stepGroups] of Object.entries(
    data.crosslinks.STEP2L1,
  )) {
    expectUnit("STEP2L1", profitCenterId);
    const processId = data.crosslinks.PC2L1[profitCenterId];
    const process = processId ? processById.get(processId) : undefined;
    const laneSteps = data.units[profitCenterId]?.steps?.length;

    if (!process) {
      issues.push({
        scope: `${scope} · STEP2L1`,
        message: `profit center "${profitCenterId}" has no process in PC2L1`,
      });
      continue;
    }
    if (laneSteps !== undefined && stepGroups.length !== laneSteps) {
      issues.push({
        scope: `${scope} · STEP2L1 · ${profitCenterId}`,
        message: `${stepGroups.length} step groups for ${laneSteps} lane steps`,
      });
    }

    const stepKeys = new Set(process.steps.map((step) => step.k));
    stepGroups.forEach((keys, position) => {
      for (const key of keys) {
        if (!stepKeys.has(key)) {
          issues.push({
            scope: `${scope} · STEP2L1 · ${profitCenterId}_${position + 1}`,
            message: `step "${key}" does not exist in ${process.id}`,
          });
        }
      }
    });
  }

  for (const [unitId, processIds] of Object.entries(data.crosslinks.OWN)) {
    expectUnit("OWN", unitId);
    processIds.forEach((processId) => expectProcess("OWN", processId));
  }
  for (const [unitId, processIds] of Object.entries(data.crosslinks.TAGS)) {
    expectUnit("TAGS", unitId);
    processIds.forEach((processId) => expectProcess("TAGS", processId));
  }
  for (const [processId, unitIds] of Object.entries(data.crosslinks.P2L0)) {
    expectProcess("P2L0", processId);
    unitIds.forEach((unitId) => expectUnit("P2L0", unitId));
  }

  for (const [laneId, origin] of Object.entries(data.crosslinks.LANE2L0)) {
    if (!data.lanes[laneId]) {
      issues.push({
        scope: `${scope} · LANE2L0`,
        message: `unknown lane "${laneId}"`,
      });
    }
    if (origin.u !== undefined && !data.units[origin.u]) {
      issues.push({
        scope: `${scope} · LANE2L0 · ${laneId}`,
        message: `unknown unit "${origin.u}"`,
      });
    }
    if (origin.d !== undefined && !data.departments[origin.d]) {
      issues.push({
        scope: `${scope} · LANE2L0 · ${laneId}`,
        message: `unknown department "${origin.d}"`,
      });
    }
    if (origin.u === undefined && origin.d === undefined) {
      issues.push({
        scope: `${scope} · LANE2L0 · ${laneId}`,
        message: "origin has neither a unit nor a department",
      });
    }
  }

  for (const [departmentId, laneIds] of Object.entries(
    data.crosslinks.DEPT2LANES,
  )) {
    if (!data.departments[departmentId]) {
      issues.push({
        scope: `${scope} · DEPT2LANES`,
        message: `unknown department "${departmentId}"`,
      });
    }
    for (const laneId of laneIds) {
      if (!data.lanes[laneId]) {
        issues.push({
          scope: `${scope} · DEPT2LANES · ${departmentId}`,
          message: `unknown lane "${laneId}"`,
        });
      }
    }
  }
}

/** Every structural problem in the shipped data, in reporting order. */
export function collectDataIssues(data: DataSet = shippedData): DataIssue[] {
  const issues: DataIssue[] = [];
  checkProcesses(data, issues);
  checkLevel0(data, issues);
  checkCrosslinks(data, issues);
  return issues;
}

/** Throws one error listing every problem found. Development only. */
export function assertDataValid(data: DataSet = shippedData): void {
  const issues = collectDataIssues(data);
  if (issues.length === 0) return;

  const detail = issues
    .map(({ scope, message }) => `  • ${scope}: ${message}`)
    .join("\n");
  throw new Error(
    `Data peta proses tidak valid — ${issues.length} masalah ditemukan:\n${detail}`,
  );
}
