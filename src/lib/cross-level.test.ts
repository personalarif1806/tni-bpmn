import { describe, expect, test } from "vitest";
import { getProcess } from "@/data";
import {
  formatOrigin,
  level0Url,
  level1Url,
  originLabel,
  originUrl,
  parseOrigin,
  parseSteps,
  stageJumpTargets,
  stepKeysInLanes,
} from "./cross-level";
import { getUnit } from "@/data";

describe("origin parameter", () => {
  test("round-trips through the URL", () => {
    const origin = { kind: "stage" as const, id: "lab_2" };

    expect(formatOrigin(origin)).toBe("stage:lab_2");
    expect(parseOrigin("stage:lab_2")).toEqual(origin);
    expect(parseOrigin("process:C4.2")).toEqual({
      kind: "process",
      id: "C4.2",
    });
  });

  test("rejects anything that is not a known origin", () => {
    expect(parseOrigin(null)).toBeNull();
    expect(parseOrigin("")).toBeNull();
    expect(parseOrigin("lab_2")).toBeNull();
    expect(parseOrigin("bogus:lab_2")).toBeNull();
    expect(parseOrigin("stage:")).toBeNull();
  });

  test("names each kind of origin for the banner and return button", () => {
    expect(originLabel({ kind: "process", id: "C4.2" })).toEqual({
      code: "C4.2",
      title: "Service Delivery: Laboratory Services",
    });
    expect(originLabel({ kind: "stage", id: "lab_2" })).toEqual({
      code: "Langkah 2",
      title: `${getUnit("lab")?.steps?.[1]} · ${getUnit("lab")?.name}`,
    });
    expect(originLabel({ kind: "dept", id: "lab_chem" })?.title).toBe(
      "Chemical Lab (CTS)",
    );
    expect(originLabel({ kind: "unit", id: "nope" })).toBeNull();
  });
});

describe("link building", () => {
  test("a Level 1 jump carries steps and origin", () => {
    expect(
      level1Url("C4.2", {
        steps: ["c", "d", "e"],
        from: { kind: "stage", id: "lab_2" },
      }),
    ).toBe("/level-1/C4.2?steps=c%2Cd%2Ce&from=stage%3Alab_2");
  });

  test("a plain process link has no query at all", () => {
    expect(level1Url("C4.3")).toBe("/level-1/C4.3");
    expect(level1Url("C4.3", { steps: [] })).toBe("/level-1/C4.3");
  });

  test("a Level 0 jump opens the right panel", () => {
    expect(
      level0Url({ kind: "unit", id: "proc" }, { from: { kind: "process", id: "S2" } }),
    ).toBe("/level-0?unit=proc&from=process%3AS2");
    expect(level0Url({ kind: "dept", id: "lab_chem" })).toBe(
      "/level-0?dept=lab_chem",
    );
  });

  test("the return link points back and offers the way forward again", () => {
    expect(
      originUrl({ kind: "process", id: "C4.2" }, { kind: "stage", id: "lab_2" }),
    ).toBe("/level-1/C4.2?from=stage%3Alab_2");
    expect(
      originUrl({ kind: "stage", id: "lab_2" }, { kind: "process", id: "C4.2" }),
    ).toBe("/level-0?stage=lab_2&from=process%3AC4.2");
  });

  test("only one level of origin is ever stored", () => {
    const url = new URL(
      originUrl({ kind: "stage", id: "lab_2" }, { kind: "process", id: "C4.2" }),
      "http://x",
    );

    expect(url.searchParams.getAll("from")).toHaveLength(1);
  });
});

describe("jump targets", () => {
  test("a lane step expands into one process and its step numbers", () => {
    const [target, ...rest] = stageJumpTargets("lab_2");

    expect(rest).toHaveLength(0);
    expect(target.processId).toBe("C4.2");
    expect(target.numbers).toEqual(["C4.2-02", "C4.2-03", "C4.2-04"]);
    expect(target.href).toBe(
      "/level-1/C4.2?steps=c%2Cd%2Ce&from=stage%3Alab_2",
    );
  });

  test("Service Delivery offers all four C4.x processes", () => {
    const targets = stageJumpTargets("vc_del");

    expect(targets.map((target) => target.processId)).toEqual([
      "C4.1",
      "C4.2",
      "C4.3",
      "C4.4",
    ]);
    expect(targets.every((target) => target.stepKeys.length === 0)).toBe(true);
    expect(targets[0].href).toBe("/level-1/C4.1?from=stage%3Avc_del");
  });

  test("every stage's jump targets resolve to real steps", () => {
    for (const stageId of ["vc_bd", "cs_1", "lab_2", "is_3", "pct_6"]) {
      for (const target of stageJumpTargets(stageId)) {
        const process = getProcess(target.processId);
        expect(process).toBeDefined();
        for (const key of target.stepKeys) {
          expect(process?.steps.some((step) => step.k === key)).toBe(true);
        }
      }
    }
  });
});

describe("lane-based highlighting", () => {
  test("a department's lanes resolve to the steps it performs", () => {
    expect(stepKeysInLanes("C4.2", ["lab_anl", "lab_spv"])).toEqual([
      "f",
      "g",
      "h",
      "j",
    ]);
  });

  test("lanes that are not in the process yield nothing", () => {
    expect(stepKeysInLanes("C4.2", ["hr"])).toEqual([]);
    expect(stepKeysInLanes("nope", ["lab_anl"])).toEqual([]);
  });

  test("parseSteps tolerates junk", () => {
    expect(parseSteps("c,d,e")).toEqual(["c", "d", "e"]);
    expect(parseSteps(null)).toEqual([]);
    expect(parseSteps("")).toEqual([]);
    expect(parseSteps("c,,d")).toEqual(["c", "d"]);
  });
});
