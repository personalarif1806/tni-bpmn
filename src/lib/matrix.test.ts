import { describe, expect, test } from "vitest";
import { getStage, layout } from "@/data";
import {
  MATRIX_SCOPES,
  buildMatrix,
  getMatrixScope,
} from "./matrix";

describe("scopes", () => {
  test("five tabs: the value chain and one per profit center", () => {
    expect(MATRIX_SCOPES.map((scope) => scope.id)).toEqual([
      "vc",
      "cs",
      "lab",
      "is",
      "pct",
    ]);
    expect(MATRIX_SCOPES[0].columns).toHaveLength(layout.VC.length);
  });

  test("profit-center scopes have six numbered lane steps", () => {
    for (const scope of MATRIX_SCOPES.slice(1)) {
      expect(scope.columns).toHaveLength(6);
      expect(scope.columns.map((column) => column.index)).toEqual([
        1, 2, 3, 4, 5, 6,
      ]);
      expect(scope.columns.every((column) => getStage(column.stageId))).toBe(
        true,
      );
    }
  });

  test("an unknown scope falls back to the first tab", () => {
    expect(getMatrixScope("nope").id).toBe("vc");
  });
});

describe("buildMatrix", () => {
  test("Laboratory renders 6 columns in two row groups (M4)", () => {
    const { scope, groups } = buildMatrix("lab");

    expect(scope.columns).toHaveLength(6);
    expect(groups.map((group) => group.caption)).toEqual([
      "Profit center",
      "Direksi, Business Partner & governance",
    ]);
    expect(groups.flatMap((group) => group.rows)).toHaveLength(16);
  });

  test("rows keep RANK order within each group", () => {
    const { groups } = buildMatrix("lab");

    for (const group of groups) {
      const positions = group.rows.map((row) => layout.RANK.indexOf(row.id));
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
      expect(positions.every((position) => position >= 0)).toBe(true);
    }
  });

  test("profit-center rows hold the units, departments and their groups", () => {
    const { groups } = buildMatrix("lab");
    const profitCenter = groups[0].rows.map((row) => row.id);

    expect(profitCenter).toContain("lab");
    expect(profitCenter).toContain("LAB_TEST");
    expect(profitCenter).toContain("lab_los");
    // Support and governance units belong to the other block.
    expect(profitCenter).not.toContain("it");
    expect(groups[1].rows.map((row) => row.id)).toContain("it");
  });

  test("PC_HEADS counts as a profit-center row even though it names units", () => {
    const { groups } = buildMatrix("vc");

    expect(groups[0].rows.map((row) => row.id)).toContain("PC_HEADS");
    expect(groups[1].rows.map((row) => row.id)).toContain("md");
  });

  test("rows with no role anywhere in the scope are left out", () => {
    const { groups } = buildMatrix("lab");
    const shown = groups.flatMap((group) => group.rows.map((row) => row.id));

    // MD's Secretary is in RANK but takes part in no stage at all.
    expect(layout.RANK).toContain("sec");
    expect(shown).not.toContain("sec");
    // Certification departments have no role in the laboratory lane.
    expect(shown).not.toContain("cs_sc");
  });

  test("cells carry the role, its description and the confirmation flag", () => {
    const { scope, groups } = buildMatrix("lab");
    const row = groups
      .flatMap((group) => group.rows)
      .find((item) => item.id === "lab_los");
    const secondStep = scope.columns.findIndex(
      (column) => column.stageId === "lab_2",
    );

    expect(row?.cells[secondStep]?.role).toBe("S");
    expect(row?.cells[secondStep]?.needsConfirmation).toBe(true);
    expect(row?.cells[secondStep]?.description).toMatch(/sampel/i);
    expect(row?.cells[0]).toBeNull();
  });

  test("every cell matches the stage involvement it came from", () => {
    for (const scope of MATRIX_SCOPES) {
      const { groups } = buildMatrix(scope.id);
      for (const row of groups.flatMap((group) => group.rows)) {
        row.cells.forEach((cell, index) => {
          const source = getStage(scope.columns[index].stageId)?.involvement.find(
            (entry) => entry.id === row.id,
          );
          expect(cell?.role ?? null).toBe(source?.role ?? null);
        });
      }
    }
  });
});
