/**
 * Involvement matrix model — PRD 8.5.
 *
 * Five scopes: the value chain, then one per profit center. Rows follow
 * `RANK` from `l0-layout.json` and split into the two categories the PRD names;
 * rows with no involvement anywhere in the scope are left out, because a scope
 * such as Certification would otherwise be 25 empty rows out of 39.
 */
import {
  departments,
  getStage,
  getUnit,
  getUnitGroup,
  layout,
  stageIdForLaneStep,
  units,
} from "@/data";
import type { InvolvementKind, RasciRole } from "@/data/types";

export interface MatrixColumn {
  stageId: string;
  title: string;
  /** Lane step number, for the profit-center scopes. */
  index?: number;
}

export interface MatrixCell {
  role: RasciRole;
  /** What this unit does at this stage — the cell tooltip. */
  description: string;
  needsConfirmation: boolean;
}

export interface MatrixRow {
  id: string;
  name: string;
  /** Group caption, when the row is a unit group. */
  sub?: string;
  kind: InvolvementKind;
  /** One entry per column; `null` where the unit has no role. */
  cells: (MatrixCell | null)[];
}

export interface MatrixRowGroup {
  id: "pc" | "gov";
  caption: string;
  rows: MatrixRow[];
}

export interface MatrixScope {
  id: string;
  label: string;
  columns: MatrixColumn[];
}

export const MATRIX_ROW_GROUPS: Record<"pc" | "gov", string> = {
  pc: "Profit center",
  gov: "Direksi, Business Partner & governance",
};

/** A row belongs to the profit-center block if it is one, sits in one, or groups them. */
function isProfitCenterRow(rowId: string): boolean {
  if (departments[rowId]) return true;

  const group = getUnitGroup(rowId);
  if (group) {
    return group.ids.every(
      (memberId) =>
        departments[memberId] !== undefined ||
        units[memberId]?.cat === "pc",
    );
  }

  return units[rowId]?.cat === "pc";
}

function rowKind(rowId: string): InvolvementKind {
  if (getUnitGroup(rowId)) return "group";
  if (departments[rowId]) return "dept";
  return "unit";
}

function rowLabel(rowId: string): { name: string; sub?: string } {
  const group = getUnitGroup(rowId);
  if (group) return { name: group.n, sub: group.sub };

  const department = departments[rowId];
  if (department) return { name: department.n };

  return { name: getUnit(rowId)?.name ?? rowId };
}

/** The five tabs, in the order the PRD lists them. */
export const MATRIX_SCOPES: MatrixScope[] = [
  {
    id: "vc",
    label: "Value chain",
    columns: layout.VC.map((stageId) => ({
      stageId,
      title: getUnit(stageId)?.name ?? stageId,
    })),
  },
  ...layout.PCS.map((pcId) => ({
    id: pcId,
    label: getUnit(pcId)?.name ?? pcId,
    columns: (getUnit(pcId)?.steps ?? []).map((title, position) => ({
      stageId: stageIdForLaneStep(pcId, position + 1),
      title,
      index: position + 1,
    })),
  })),
];

export function getMatrixScope(scopeId: string): MatrixScope {
  return MATRIX_SCOPES.find((scope) => scope.id === scopeId) ?? MATRIX_SCOPES[0];
}

/** Rows and cells for one scope. */
export function buildMatrix(scopeId: string): {
  scope: MatrixScope;
  groups: MatrixRowGroup[];
} {
  const scope = getMatrixScope(scopeId);

  const rows: MatrixRow[] = layout.RANK.flatMap((rowId) => {
    const cells = scope.columns.map((column) => {
      const involvement = getStage(column.stageId)?.involvement.find(
        (entry) => entry.id === rowId,
      );
      if (!involvement) return null;

      return {
        role: involvement.role,
        description: involvement.description,
        needsConfirmation: involvement.needsConfirmation,
      };
    });

    if (cells.every((cell) => cell === null)) return [];

    return [{ id: rowId, ...rowLabel(rowId), kind: rowKind(rowId), cells }];
  });

  const groups: MatrixRowGroup[] = (["pc", "gov"] as const).map((id) => ({
    id,
    caption: MATRIX_ROW_GROUPS[id],
    rows: rows.filter((row) => isProfitCenterRow(row.id) === (id === "pc")),
  }));

  return { scope, groups: groups.filter((group) => group.rows.length > 0) };
}
