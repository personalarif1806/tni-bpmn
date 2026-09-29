import { describe, expect, test } from "vitest";
import {
  STANDARD_ORDER,
  clauseCoverage,
  clauseData,
  clausesFor,
  codesFor,
} from "@/data/clauses";
import { getStage, getUnit, stageOrder } from "@/data";

describe("Level 0 clause mapping", () => {
  test("every mapped element is a unit or a stage on the map", () => {
    const unknown = Object.keys(clauseData.map).filter(
      (id) => !getUnit(id) && !getStage(id),
    );
    expect(unknown).toEqual([]);
  });

  test("every stage on the map carries at least one clause", () => {
    const bare = stageOrder.filter((id) => clausesFor(id).length === 0);
    expect(bare).toEqual([]);
  });

  test("every mapped clause exists in its standard's dictionary", () => {
    const unknown: string[] = [];
    for (const [elementId, mapped] of Object.entries(clauseData.map)) {
      for (const standard of STANDARD_ORDER) {
        for (const code of mapped[standard] ?? []) {
          if (!clauseData.standards[standard].clauses[code]) {
            unknown.push(`${elementId} · ${standard} ${code}`);
          }
        }
      }
    }
    expect(unknown).toEqual([]);
  });

  test.each(STANDARD_ORDER)("every required %s clause is carried somewhere", (standard) => {
    const gaps = clauseCoverage(standard)
      .filter((clause) => clause.required && clause.elements.length === 0)
      .map((clause) => clause.code);
    expect(gaps).toEqual([]);
  });

  test("no element lists the same clause twice", () => {
    const repeated: string[] = [];
    for (const [elementId, mapped] of Object.entries(clauseData.map)) {
      for (const standard of STANDARD_ORDER) {
        const codes = mapped[standard] ?? [];
        if (new Set(codes).size !== codes.length) repeated.push(`${elementId} · ${standard}`);
      }
    }
    expect(repeated).toEqual([]);
  });

  test("clauses read in the standard's own order", () => {
    expect(codesFor("vc_del", "iso9001")).toEqual([
      "7.1.5",
      "7.2",
      "8.1",
      "8.5.1",
      "8.5.2",
      "8.5.3",
      "8.5.4",
      "8.6",
      "8.7",
    ]);
  });
});
