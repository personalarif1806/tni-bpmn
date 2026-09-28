import { describe, expect, test } from "vitest";
import { crosslinks, getProcess, lanes, processes, stageOrder } from "@/data";
import {
  departmentToProcesses,
  getL0StepRef,
  laneOrigin,
  processOrigin,
  stageDetails,
  stepToL0,
  unitToProcesses,
} from "./crosslinks";
import { getUnit } from "@/data";

describe("stage → Level 1", () => {
  test("a lane step resolves to its process and step numbers", () => {
    const [detail, ...rest] = stageDetails("lab_2");

    expect(rest).toHaveLength(0);
    expect(detail?.processId).toBe("C4.2");
    expect(detail?.stepKeys).toEqual(["c", "d", "e"]);
    expect(detail?.numbers).toEqual(["C4.2-02", "C4.2-03", "C4.2-04"]);
    expect(detail?.range).toBe("C4.2-02–04");
  });

  test("Service Delivery offers all four C4.x processes", () => {
    const details = stageDetails("vc_del");

    expect(details.map((detail) => detail.processId)).toEqual([
      "C4.1",
      "C4.2",
      "C4.3",
      "C4.4",
    ]);
    expect(details.every((detail) => detail.stepKeys.length === 0)).toBe(true);
  });

  test("every stage that has Level 1 detail resolves to real processes", () => {
    for (const stageId of stageOrder) {
      for (const detail of stageDetails(stageId)) {
        expect(getProcess(detail.processId)).toBeDefined();
      }
    }
  });
});

describe("stepToL0", () => {
  test("inverts STEP2L1 so a step key resolves to its lane step", () => {
    const ref = getL0StepRef("C4.2", "d");

    expect(ref?.stageId).toBe("lab_2");
    expect(ref?.profitCenterId).toBe("lab");
    expect(ref?.stepIndex).toBe(2);
    expect(ref?.title).toBe(getUnit("lab")?.steps?.[1]);
  });

  test("covers every key listed in STEP2L1 and nothing else", () => {
    for (const [pcId, stepGroups] of Object.entries(crosslinks.STEP2L1)) {
      const processId = crosslinks.PC2L1[pcId]!;
      const mapped = stepToL0[processId] ?? {};

      expect(Object.keys(mapped).sort()).toEqual(stepGroups.flat().sort());
      for (const key of Object.keys(mapped)) {
        expect(getProcess(processId)?.num[key]).toBeDefined();
      }
    }
  });

  test("a process with no profit center has no step mapping", () => {
    expect(stepToL0.S3).toBeUndefined();
  });
});

describe("laneOrigin", () => {
  test("uses the explicit mapping first", () => {
    expect(laneOrigin("lab_anl")).toEqual({ u: "lab" });
    expect(laneOrigin("pct_eval")).toEqual({ d: "pct_cert" });
  });

  test("falls back to identity when a lane is named after a unit", () => {
    // `cms`, `hr`, `md` and 15 more are absent from LANE2L0 but name a unit.
    expect(laneOrigin("cms")).toEqual({ u: "cms" });
    expect(laneOrigin("hr")).toEqual({ u: "hr" });
  });

  test("leaves generic role lanes unresolved", () => {
    expect(laneOrigin("owner")).toBeUndefined();
    expect(laneOrigin("unit")).toBeUndefined();
  });
});

describe("unitToProcesses", () => {
  test("a profit center owns its process and performs in its own lanes", () => {
    const { owned, involved } = unitToProcesses("lab");

    expect(owned).toEqual(["C4.2"]);
    // Lanes come back in process.lanes order, department lanes included.
    expect(involved["C4.2"]).toEqual([
      "lab_sales",
      "lab_rcv",
      "lab_anl",
      "lab_spv",
    ]);
  });

  test("picks up lanes belonging to the unit's departments", () => {
    // lab_sales is mapped to the department, and reaches the unit via depts.
    expect(laneOrigin("lab_sales")).toEqual({ d: "lab_sales" });
    expect(unitToProcesses("lab").involved["C4.2"]).toContain("lab_sales");
    expect(unitToProcesses("cs").involved["C4.1"]).toEqual(
      expect.arrayContaining(["cs_aud", "cs_rev"]),
    );
  });

  test("a support unit performs in the processes whose lane it is", () => {
    const { owned, involved } = unitToProcesses("cms");

    expect(owned).toEqual(["G1", "G2"]);
    expect(Object.keys(involved).sort()).toEqual([
      "C2",
      "C4.2",
      "C5",
      "G1",
      "G2",
      "M2",
      "S3",
      "S4",
    ]);
  });

  test("every lane it reports is really a lane of that process", () => {
    for (const unitId of ["lab", "cs", "cms", "hr", "proc"]) {
      for (const [processId, laneIds] of Object.entries(
        unitToProcesses(unitId).involved,
      )) {
        const process = getProcess(processId);
        expect(process).toBeDefined();
        for (const laneId of laneIds) {
          expect(process?.lanes).toContain(laneId);
          expect(lanes[laneId]).toBeDefined();
        }
      }
    }
  });

  test("an unmapped unit reports nothing rather than throwing", () => {
    expect(unitToProcesses("boc").owned).toEqual([]);
  });
});

describe("departmentToProcesses", () => {
  test("resolves a department through DEPT2LANES", () => {
    const { involved } = departmentToProcesses("lab_chem");

    expect(involved["C4.2"]).toEqual(["lab_anl", "lab_spv"]);
  });

  test("BRDM has no lanes, matching its unmapped status in PRD 17", () => {
    expect(departmentToProcesses("lab_brdm").involved).toEqual({});
  });
});

describe("processOrigin", () => {
  test("maps a C4.x process back to its stage, lane and owners", () => {
    expect(processOrigin("C4.2")).toEqual({
      stageId: "vc_del",
      profitCenterId: "lab",
      unitIds: ["lab"],
    });
  });

  test("falls back to OWN for the core processes P2L0 omits", () => {
    // P2L0 lists only the 12 non-core processes; OWN covers the C group.
    expect(processOrigin("C2").unitIds).toEqual(["mkt"]);
    expect(processOrigin("C4.4").unitIds).toEqual(["pct"]);
    expect(processOrigin("C1").unitIds).toEqual([]);
    expect(processOrigin("C1").stageId).toBe("vc_bd");
  });

  test("a support process maps to its owning units only", () => {
    const origin = processOrigin("S2");

    expect(origin.stageId).toBeUndefined();
    expect(origin.profitCenterId).toBeUndefined();
    expect(origin.unitIds).toEqual(["proc"]);
  });

  test("every process resolves to at least one Level 0 anchor", () => {
    for (const process of processes) {
      const origin = processOrigin(process.id);
      const anchored =
        origin.unitIds.length > 0 ||
        origin.stageId !== undefined ||
        origin.profitCenterId !== undefined;
      expect(anchored, `${process.id} has no Level 0 anchor`).toBe(true);
    }
  });
});
