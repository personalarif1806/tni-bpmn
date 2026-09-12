/**
 * Two-way navigation between the levels — PRD section 9.
 *
 * Origin is stored as a single `from=kind:id` parameter, never a stack: each
 * jump replaces the previous origin, so Back is the browser's job.
 */
import { getDepartment, getProcess, getStage, getUnit } from "@/data";
import { stageDetails } from "@/lib/crosslinks";

export type OriginKind = "stage" | "unit" | "dept" | "process";

export interface Origin {
  kind: OriginKind;
  id: string;
}

const ORIGIN_KINDS: OriginKind[] = ["stage", "unit", "dept", "process"];

export function parseOrigin(raw: string | null): Origin | null {
  if (!raw) return null;
  const separator = raw.indexOf(":");
  if (separator === -1) return null;

  const kind = raw.slice(0, separator) as OriginKind;
  const id = raw.slice(separator + 1);
  if (!ORIGIN_KINDS.includes(kind) || !id) return null;

  return { kind, id };
}

export function formatOrigin(origin: Origin): string {
  return `${origin.kind}:${origin.id}`;
}

/** How an origin is named in a banner or return button. */
export function originLabel(origin: Origin): { code?: string; title: string } | null {
  if (origin.kind === "process") {
    const process = getProcess(origin.id);
    return process ? { code: process.id, title: process.name } : null;
  }

  if (origin.kind === "stage") {
    const stage = getStage(origin.id);
    if (!stage) return null;
    const profitCenter = stage.pcId ? getUnit(stage.pcId) : undefined;
    return {
      code: stage.kind === "pc" ? `Langkah ${stage.stepIndex}` : undefined,
      title: profitCenter ? `${stage.title} · ${profitCenter.name}` : stage.title,
    };
  }

  if (origin.kind === "unit") {
    const unit = getUnit(origin.id);
    return unit ? { title: unit.name } : null;
  }

  const department = getDepartment(origin.id);
  return department ? { title: department.n } : null;
}

/** Where a "back to where I came from" button points. */
export function originUrl(origin: Origin, returnTo?: Origin): string {
  if (origin.kind === "process") {
    return level1Url(origin.id, { from: returnTo });
  }
  return level0Url({ kind: origin.kind, id: origin.id }, { from: returnTo });
}

/** Link into a Level 1 process, optionally highlighting steps. */
export function level1Url(
  processId: string,
  options: { steps?: readonly string[]; from?: Origin } = {},
): string {
  const params = new URLSearchParams();
  if (options.steps && options.steps.length > 0) {
    params.set("steps", options.steps.join(","));
  }
  if (options.from) params.set("from", formatOrigin(options.from));

  const query = params.toString();
  return query ? `/level-1/${processId}?${query}` : `/level-1/${processId}`;
}

/** Link into the Level 0 map, opening a panel. */
export function level0Url(
  target: { kind: "stage" | "unit" | "dept"; id: string },
  options: { from?: Origin } = {},
): string {
  const params = new URLSearchParams();
  params.set(target.kind, target.id);
  if (options.from) params.set("from", formatOrigin(options.from));
  return `/level-0?${params.toString()}`;
}

/** The step keys a unit or department performs in one process. */
export function stepKeysInLanes(
  processId: string,
  laneIds: readonly string[],
): string[] {
  const process = getProcess(processId);
  if (!process) return [];
  return process.steps
    .filter((step) => laneIds.includes(step.l))
    .map((step) => step.k);
}

/** Parses the `steps` parameter into the set of highlighted step keys. */
export function parseSteps(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(",").filter(Boolean);
}

/** Which Level 1 processes and steps expand a Level 0 stage (PRD 9). */
export function stageJumpTargets(stageId: string) {
  return stageDetails(stageId).map((detail) => ({
    ...detail,
    href: level1Url(detail.processId, {
      steps: detail.stepKeys,
      from: { kind: "stage" as const, id: stageId },
    }),
  }));
}
