import { describe, expect, test } from "vitest";
import { computeStepNumbers, formatNumberRange } from "./numbering";
import { getProcess, processes } from "./index";
import { rawProcesses } from "./raw";
import type { Step } from "./types";

const step = (k: string, y?: Step["y"]): Step => ({ k, l: "x", c: 0, t: k, y });

describe("computeStepNumbers", () => {
  test("numbers activities and decisions, skipping start and end nodes", () => {
    const numbers = computeStepNumbers("C4.2", [
      step("a", "s"),
      step("b"),
      step("c", "d"),
      step("z", "e"),
    ]);

    expect(numbers).toEqual({ b: "C4.2-01", c: "C4.2-02" });
    expect(numbers.a).toBeUndefined();
    expect(numbers.z).toBeUndefined();
  });

  test("pads the counter to two digits", () => {
    const numbers = computeStepNumbers(
      "M1",
      Array.from({ length: 11 }, (_, index) => step(`s${index}`)),
    );

    expect(numbers.s0).toBe("M1-01");
    expect(numbers.s9).toBe("M1-10");
    expect(numbers.s10).toBe("M1-11");
  });

  test("C4.2 starts at C4.2-01 on its first activity", () => {
    const process = getProcess("C4.2");

    expect(process?.steps[0]?.y).toBe("s");
    expect(process?.num[process.steps[0]!.k]).toBeUndefined();
    expect(process?.num.b).toBe("C4.2-01");
  });
});

describe("recomputed numbering across the shipped data", () => {
  test("every process numbers exactly its non-terminal steps", () => {
    for (const process of processes) {
      const numbered = process.steps.filter(
        (item) => item.y !== "s" && item.y !== "e",
      );

      expect(Object.keys(process.num)).toHaveLength(numbered.length);
      expect(process.num[numbered[0]!.k]).toBe(`${process.id}-01`);
    }
  });

  test("recomputed numbering still matches the numbers shipped in the JSON", () => {
    // The JSON `num` is replaced at load time; if this fails, the two have
    // drifted and the shipped field is the stale one.
    for (const shipped of rawProcesses) {
      expect(getProcess(shipped.id)?.num).toEqual(shipped.num);
    }
  });
});

describe("formatNumberRange", () => {
  test("collapses a contiguous run", () => {
    expect(formatNumberRange(["C4.2-02", "C4.2-03", "C4.2-04"])).toBe(
      "C4.2-02–04",
    );
  });

  test("lists a broken run in full", () => {
    expect(formatNumberRange(["C4.2-02", "C4.2-05"])).toBe("C4.2-02, C4.2-05");
  });

  test("handles single and empty input", () => {
    expect(formatNumberRange(["C4.2-02"])).toBe("C4.2-02");
    expect(formatNumberRange([])).toBe("");
  });
});
