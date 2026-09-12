/**
 * The shipped JSON, typed once.
 *
 * JSON modules are inferred structurally (string where the model says union),
 * so each file is asserted to its declared type here, in one place. Runtime
 * validation in `validate.ts` is what actually backs these assertions.
 */
import crosslinksJson from "./crosslinks.json";
import departmentsJson from "./l0-departments.json";
import layoutJson from "./l0-layout.json";
import stageInvolvementJson from "./l0-stage-involvement.json";
import unitGroupsJson from "./l0-unit-groups.json";
import unitsJson from "./l0-units.json";
import groupsJson from "./l1-groups.json";
import lanesJson from "./l1-lanes.json";
import processesJson from "./l1-processes.json";
import type {
  CrosslinkData,
  Department,
  Lane,
  LayoutData,
  Process,
  ProcessGroup,
  ProcessGroupId,
  StageInvolvementData,
  Unit,
  UnitGroup,
} from "./types";

/** Assert a JSON module to its declared shape. */
function shaped<T>(json: unknown): T {
  return json as T;
}

export const rawUnits = shaped<Record<string, Unit>>(unitsJson);
export const rawDepartments = shaped<Record<string, Department>>(departmentsJson);
export const rawUnitGroups = shaped<Record<string, UnitGroup>>(unitGroupsJson);
export const rawLayout = shaped<LayoutData>(layoutJson);
export const rawStageInvolvement =
  shaped<StageInvolvementData>(stageInvolvementJson);
export const rawLanes = shaped<Record<string, Lane>>(lanesJson);
export const rawProcesses = shaped<Process[]>(processesJson);
export const rawProcessGroups =
  shaped<Record<ProcessGroupId, ProcessGroup>>(groupsJson);
export const rawCrosslinks = shaped<CrosslinkData>(crosslinksJson);
