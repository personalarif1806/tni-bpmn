/**
 * Applies the translation dictionary to the shipped JSON, once, at import time.
 *
 * This is the only place the catalogue changes language. Everything downstream
 * — the indexes in `index.ts`, the layout models, every component — reads plain
 * strings and never learns that a second language exists. That is why adding
 * this feature did not touch the map, the panels, or the matrix.
 *
 * What is translated and what is left alone is declared here and mirrored by
 * `scripts/i18n-fields.mjs`, which the completeness test reads. Official
 * identifiers are deliberately untouched: unit and department names, ISO
 * standards, business units, process names and codes appear on accreditation
 * certificates and in the TÜV NORD group register, and a map that renamed them
 * would disagree with the documents it describes.
 */
import type {
  Department,
  Involvement,
  Lane,
  LayoutData,
  Process,
  ProcessGroup,
  ProcessGroupId,
  StageInvolvementData,
  Step,
  Unit,
  UnitGroup,
} from "./types";
import { t } from "@/lib/i18n";

/** Translate a string only when it is present. */
const maybe = (value: string | undefined): string | undefined =>
  value === undefined ? undefined : t(value);

const each = (list: string[] | undefined): string[] | undefined =>
  list?.map((item) => t(item));

function mapValues<T>(record: Record<string, T>, fn: (value: T) => T): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, fn(value)]),
  );
}

/** Drops keys whose value came back undefined, so optional fields stay absent. */
function defined<T extends object>(object: T): T {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined),
  ) as T;
}

export function localizeUnits(units: Record<string, Unit>): Record<string, Unit> {
  return mapValues(units, (unit) =>
    defined({
      ...unit,
      /* Value-chain boxes are named for the work they carry, not for a unit. */
      name: unit.cat === "vc" ? t(unit.name) : unit.name,
      /*
       * For every other category `depts` holds department ids, which must not
       * be touched; on a value-chain stage it holds plain display names, and
       * some of those are phrases ("CS Business Support dan admin BU").
       */
      depts: unit.cat === "vc" ? each(unit.depts) : unit.depts,
      org: t(unit.org),
      role: t(unit.role),
      sub: maybe(unit.sub),
      tag: maybe(unit.tag),
      steps: each(unit.steps),
      /* Mostly unit names, but a few are phrases ("Seluruh pemilik proses"). */
      links: each(unit.links),
      flow: each(unit.flow),
      tasks: each(unit.tasks),
      outputs: each(unit.outputs),
      gives: each(unit.gives),
      receives: each(unit.receives),
    }),
  );
}

export function localizeUnitGroups(
  groups: Record<string, UnitGroup>,
): Record<string, UnitGroup> {
  return mapValues(groups, (group) => ({
    ...group,
    n: t(group.n),
    sub: t(group.sub),
  }));
}

export function localizeLayout(layout: LayoutData): LayoutData {
  return {
    ...layout,
    VC_LINKS: layout.VC_LINKS.map(t),
    EXT_L: layout.EXT_L.map(([id, input]) => [id, t(input)]),
    EXT_R: layout.EXT_R.map(([id, output, source]) => [id, t(output), t(source)]),
    CATS: mapValues(layout.CATS, t) as LayoutData["CATS"],
    RAS_LBL: mapValues(layout.RAS_LBL, t) as LayoutData["RAS_LBL"],
    RAS_DESC: mapValues(layout.RAS_DESC, t) as LayoutData["RAS_DESC"],
  };
}

/** Row shape is `[id, role, description, needsConfirmation?]`. */
const localizeRow = (row: Involvement): Involvement =>
  row.length > 3 ? [row[0], row[1], t(row[2]), row[3]] : [row[0], row[1], t(row[2])];

export function localizeInvolvement(
  data: StageInvolvementData,
): StageInvolvementData {
  return {
    vc: mapValues(data.vc, (rows) => rows.map(localizeRow)),
    pc: mapValues(data.pc, (lanes) => lanes.map((rows) => rows.map(localizeRow))),
  };
}

export function localizeLanes(lanes: Record<string, Lane>): Record<string, Lane> {
  return mapValues(lanes, (lane) =>
    defined({ ...lane, n: t(lane.n), t: maybe(lane.t) }),
  );
}

export function localizeProcessGroups(
  groups: Record<ProcessGroupId, ProcessGroup>,
): Record<ProcessGroupId, ProcessGroup> {
  return mapValues(groups, (group) => ({
    ...group,
    n: t(group.n),
    l0: t(group.l0),
  })) as Record<ProcessGroupId, ProcessGroup>;
}

function localizeStep(step: Step): Step {
  return defined({
    ...step,
    t: t(step.t),
    d: maybe(step.d),
    o: maybe(step.o),
    /* A next-step reference is either a key or `[key, branch label]`. */
    n: step.n?.map((next) =>
      Array.isArray(next) ? ([next[0], t(next[1])] as [string, string]) : next,
    ),
  });
}

export function localizeProcesses(processes: Process[]): Process[] {
  return processes.map((process) =>
    defined({
      ...process,
      l0: t(process.l0),
      /* Usually one unit name, but a few name two units and how they split. */
      owner: t(process.owner),
      purpose: t(process.purpose),
      ref: t(process.ref),
      note: maybe(process.note),
      kpi: process.kpi.map(t),
      steps: process.steps.map(localizeStep),
    }),
  );
}

/** Departments are official names in both languages, so they pass through. */
export function localizeDepartments(
  departments: Record<string, Department>,
): Record<string, Department> {
  return departments;
}
