/**
 * The shipped JSON, typed once and put into the reader's language.
 *
 * JSON modules are inferred structurally (string where the model says union),
 * so each file is asserted to its declared type here, in one place. Runtime
 * validation in `validate.ts` is what actually backs these assertions.
 *
 * The translation pass sits here because this is the last point where the data
 * is still the shipped shape: everything after it — the indexes, the layout
 * models, every component — reads one language and never learns there is
 * another.
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
import proceduresJson from "./l2-procedures.json";
import {
  localizeInvolvement,
  localizeLanes,
  localizeLayout,
  localizeProcedures,
  localizeProcessGroups,
  localizeProcesses,
  localizeUnitGroups,
  localizeUnits,
} from "./localize";
import type {
  CrosslinkData,
  Procedure,
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

export const rawUnits = localizeUnits(shaped<Record<string, Unit>>(unitsJson));
/** Department names are official in both languages — nothing to translate. */
export const rawDepartments = shaped<Record<string, Department>>(departmentsJson);
export const rawUnitGroups = localizeUnitGroups(
  shaped<Record<string, UnitGroup>>(unitGroupsJson),
);
export const rawLayout = localizeLayout(shaped<LayoutData>(layoutJson));
export const rawStageInvolvement = localizeInvolvement(
  shaped<StageInvolvementData>(stageInvolvementJson),
);
export const rawLanes = localizeLanes(shaped<Record<string, Lane>>(lanesJson));
export const rawProcesses = localizeProcesses(shaped<Process[]>(processesJson));
export const rawProcessGroups = localizeProcessGroups(
  shaped<Record<ProcessGroupId, ProcessGroup>>(groupsJson),
);
export const rawProcedures = localizeProcedures(
  shaped<Record<string, Procedure>>(proceduresJson),
);
/** Crosslinks are ids only. */
export const rawCrosslinks = shaped<CrosslinkData>(crosslinksJson);
