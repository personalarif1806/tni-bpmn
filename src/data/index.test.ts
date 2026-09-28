import { describe, expect, test } from "vitest";
import {
  adjacentStageId,
  confirmationIndex,
  participantNeedsConfirmation,
  participantStages,
  stageNeedsConfirmation,
  getDepartment,
  getProcess,
  getStage,
  getUnit,
  listProcessesByGroup,
  listProcessGroups,
  stageIndex,
  stageOrder,
  stageParticipants,
} from "./index";

describe("accessors", () => {
  test("resolve units, departments and processes by id", () => {
    expect(getUnit("cms")?.name).toBe("Corporate Management System");
    expect(getUnit("lab")?.std).toBe("ISO/IEC 17025");
    expect(getDepartment("lab_chem")?.pc).toBe("lab");
    expect(getProcess("C4.2")?.name).toBe(
      "Service Delivery: Laboratory Services",
    );
    expect(getUnit("does-not-exist")).toBeUndefined();
  });

  test("group the 20 processes into M, G, C, S", () => {
    const groups = listProcessGroups();

    expect(groups.map((group) => group.id)).toEqual(["M", "G", "C", "S"]);
    expect(groups.flatMap((group) => group.processes)).toHaveLength(20);
    expect(listProcessesByGroup("C").map((process) => process.id)).toEqual([
      "C1",
      "C2",
      "C3",
      "C4.1",
      "C4.2",
      "C4.3",
      "C4.4",
      "C5",
    ]);
  });
});

describe("stageIndex", () => {
  test("covers 5 value-chain stages and 6 steps for each of 4 profit centers", () => {
    expect(stageOrder).toHaveLength(5 + 4 * 6);
    expect(Object.keys(stageIndex)).toHaveLength(stageOrder.length);
    expect(stageOrder.slice(0, 5)).toEqual([
      "vc_bd",
      "vc_mk",
      "vc_sales",
      "vc_del",
      "vc_bill",
    ]);
  });

  test("a lane step carries its profit center, index and title", () => {
    const stage = getStage("lab_2");

    expect(stage?.kind).toBe("pc");
    expect(stage?.pcId).toBe("lab");
    expect(stage?.stepIndex).toBe(2);
    expect(stage?.title).toBe(getUnit("lab")?.steps?.[1]);
  });

  test("keeps unit groups intact for display and expands their members", () => {
    const group = getStage("lab_2")?.involvement.find(
      (row) => row.id === "LAB_TEST",
    );

    expect(group?.kind).toBe("group");
    expect(group?.name).toBe("Lab pengujian");
    expect(group?.members.map((member) => member.id)).toEqual([
      "lab_chem",
      "lab_micro",
      "lab_pss",
      "lab_ncts",
    ]);
    expect(group?.members.every((member) => member.kind === "dept")).toBe(true);
  });

  test("plain units resolve to themselves with no members", () => {
    const unit = getStage("lab_2")?.involvement.find((row) => row.id === "lab");

    expect(unit?.kind).toBe("unit");
    expect(unit?.role).toBe("A");
    expect(unit?.members).toEqual([]);
    expect(unit?.coverage.map((member) => member.id)).toEqual(["lab"]);
  });

  test("carries the needs-confirmation flag from the data", () => {
    const involvement = getStage("lab_2")?.involvement ?? [];
    const flagged = involvement
      .filter((row) => row.needsConfirmation)
      .map((row) => row.id);

    // PRD 17: Lab Operation Support and the representative offices are draft.
    expect(flagged).toContain("lab_los");
    expect(flagged).toContain("LAB_RO");
    expect(involvement.find((row) => row.id === "lab")?.needsConfirmation).toBe(
      false,
    );
  });

  test("stageParticipants expands groups into individual units and departments", () => {
    const participants = stageParticipants("lab_2");

    expect(participants.has("lab")).toBe(true);
    expect(participants.has("LAB_TEST")).toBe(false);
    expect(participants.get("lab_chem")?.role).toBe("R");
    expect(participants.get("lab_mdn")?.member.kind).toBe("dept");
  });

  test("prev/next wraps around the stage order", () => {
    expect(adjacentStageId("lab_2", 1)).toBe("lab_3");
    expect(adjacentStageId("lab_1", -1)).toBe("cs_6");
    expect(adjacentStageId("vc_bd", -1)).toBe("pct_6");
    expect(adjacentStageId("pct_6", 1)).toBe("vc_bd");
    expect(adjacentStageId("nope", 1)).toBeUndefined();
  });
});

describe("participantStages", () => {
  test("a unit lists every stage it takes part in, in map order", () => {
    const stages = participantStages("lab");
    const ids = stages.map((entry) => entry.stageId);

    expect(ids).toContain("lab_2");
    expect(ids).toEqual([...ids].sort((a, b) => stageOrder.indexOf(a) - stageOrder.indexOf(b)));
    expect(stages.find((entry) => entry.stageId === "lab_2")?.role).toBe("A");
  });

  test("a department inherits the rows of the groups it belongs to", () => {
    const entry = participantStages("lab_chem").find(
      (item) => item.stageId === "lab_2",
    );

    expect(entry?.role).toBe("R");
    expect(entry?.viaGroupId).toBe("LAB_TEST");
    expect(entry?.viaGroupName).toBe("Lab pengujian");
  });

  test("keeps the needs-confirmation flag per stage", () => {
    const flagged = participantStages("lab_los").filter(
      (entry) => entry.needsConfirmation,
    );

    expect(flagged.map((entry) => entry.stageId)).toContain("lab_2");
  });

  test("BRDM is in no stage at all (PRD 17)", () => {
    expect(participantStages("lab_brdm")).toEqual([]);
  });

  test("every participant id resolves to a unit or a department", () => {
    for (const stageId of stageOrder) {
      for (const [id] of stageParticipants(stageId)) {
        expect(participantStages(id).length).toBeGreaterThan(0);
      }
    }
  });
});

describe("confirmation status (PRD 17)", () => {
  test("flags exactly the stages holding an unconfirmed role", () => {
    expect([...confirmationIndex.stages].sort()).toEqual([
      "cs_2",
      "lab_1",
      "lab_2",
      "vc_del",
      "vc_sales",
    ]);
  });

  test("expands a flagged unit group into its members", () => {
    // LAB_RO is flagged, so both representative offices are marked.
    expect([...confirmationIndex.participants].sort()).toEqual([
      "lab_los",
      "lab_mdn",
      "lab_smg",
      "proc",
    ]);
    expect(participantNeedsConfirmation("lab_mdn")).toBe(true);
    expect(participantNeedsConfirmation("lab_smg")).toBe(true);
    // The group id itself is not a box on the map.
    expect(participantNeedsConfirmation("LAB_RO")).toBe(false);
  });

  test("every flagged stage really holds a flagged row", () => {
    for (const stageId of confirmationIndex.stages) {
      const stage = getStage(stageId);
      expect(stage?.involvement.some((row) => row.needsConfirmation)).toBe(true);
    }
  });

  test("every flagged participant is named by a flagged row somewhere", () => {
    for (const participantId of confirmationIndex.participants) {
      expect(
        participantStages(participantId).some((entry) => entry.needsConfirmation),
      ).toBe(true);
    }
  });

  test("unflagged things report false", () => {
    expect(stageNeedsConfirmation("lab_3")).toBe(false);
    expect(stageNeedsConfirmation("nope")).toBe(false);
    expect(participantNeedsConfirmation("cms")).toBe(false);
    expect(participantNeedsConfirmation("lab_chem")).toBe(false);
  });
});
