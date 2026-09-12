import { describe, expect, test } from "vitest";
import {
  assertDataValid,
  collectDataIssues,
  shippedData,
  type DataSet,
} from "./validate";

/** A deep copy of the shipped data, so a test can break one thing safely. */
function broken(mutate: (data: DataSet) => void): DataSet {
  const copy = structuredClone(shippedData);
  mutate(copy);
  return copy;
}

function messages(data: DataSet): string {
  return collectDataIssues(data)
    .map((issue) => `${issue.scope}: ${issue.message}`)
    .join("\n");
}

describe("the shipped data", () => {
  test("passes every check", () => {
    expect(collectDataIssues()).toEqual([]);
  });

  test("assertDataValid does not throw", () => {
    expect(() => assertDataValid()).not.toThrow();
  });
});

describe("process checks", () => {
  test("catches a step pointing at a step that does not exist", () => {
    const data = broken((copy) => {
      copy.processes[0]!.steps[0]!.n = ["nope"];
    });

    expect(messages(data)).toContain('points at "nope", which does not exist');
  });

  test("catches a branch label pointing at a step that does not exist", () => {
    const data = broken((copy) => {
      copy.processes[0]!.steps[0]!.n = [["nope", "Ya"]];
    });

    expect(messages(data)).toContain('points at "nope", which does not exist');
  });

  test("catches a step sitting in a lane the process does not declare", () => {
    const data = broken((copy) => {
      copy.processes[0]!.steps[0]!.l = "cms";
    });

    expect(messages(data)).toContain("which is not in process.lanes");
  });

  test("catches two steps sharing a lane and column", () => {
    const data = broken((copy) => {
      const [first, second] = copy.processes[0]!.steps;
      second!.l = first!.l;
      second!.c = first!.c;
    });

    expect(messages(data)).toContain("share lane");
  });

  test("catches a related process that does not exist", () => {
    const data = broken((copy) => {
      copy.processes[0]!.rel = ["C9"];
    });

    expect(messages(data)).toContain('related process "C9" does not exist');
  });

  test("catches a lane no step uses", () => {
    const data = broken((copy) => {
      copy.processes[0]!.lanes.push("cms");
    });

    expect(messages(data)).toContain('lane "cms" is declared but no step uses it');
  });

  test("catches a lane missing from l1-lanes.json", () => {
    const data = broken((copy) => {
      copy.processes[0]!.lanes.push("ghost");
      copy.processes[0]!.steps[0]!.l = "ghost";
    });

    expect(messages(data)).toContain(
      'lane "ghost" is not defined in l1-lanes.json',
    );
  });
});

describe("Level 0 checks", () => {
  test("catches an involvement row naming nothing in the catalogue", () => {
    const data = broken((copy) => {
      copy.stageInvolvement.vc.vc_bd![0]![0] = "ghost";
    });

    expect(messages(data)).toContain(
      '"ghost" is neither a unit, department, nor unit group',
    );
  });

  test("catches a unit group member that does not resolve", () => {
    const data = broken((copy) => {
      copy.unitGroups.LAB_TEST!.ids.push("ghost");
    });

    expect(messages(data)).toContain(
      'member "ghost" is neither a unit nor a department',
    );
  });

  test("catches a lane-step involvement list that does not match the map", () => {
    const data = broken((copy) => {
      copy.stageInvolvement.pc.lab!.pop();
    });

    expect(messages(data)).toContain("involvement lists for 6 lane steps");
  });

  test("catches a map box that is not a unit", () => {
    const data = broken((copy) => {
      copy.layout.BOTTOM.push("ghost");
    });

    expect(messages(data)).toContain('"ghost" is not a unit');
  });
});

describe("crosslink checks", () => {
  test("catches a STEP2L1 key that does not exist in its process", () => {
    const data = broken((copy) => {
      copy.crosslinks.STEP2L1.lab![1]!.push("zz");
    });

    expect(messages(data)).toContain('step "zz" does not exist in C4.2');
  });

  test("catches an unknown process id", () => {
    const data = broken((copy) => {
      copy.crosslinks.OWN.cms = ["G9"];
    });

    expect(messages(data)).toContain('unknown process "G9"');
  });

  test("catches an unknown lane in LANE2L0", () => {
    const data = broken((copy) => {
      copy.crosslinks.LANE2L0.ghost = { u: "cms" };
    });

    expect(messages(data)).toContain('unknown lane "ghost"');
  });

  test("catches a department lane mapping that does not resolve", () => {
    const data = broken((copy) => {
      copy.crosslinks.DEPT2LANES.ghost = ["cms"];
    });

    expect(messages(data)).toContain('unknown department "ghost"');
  });
});

describe("assertDataValid", () => {
  test("throws once, listing every problem it found", () => {
    const data = broken((copy) => {
      copy.processes[0]!.rel = ["C9", "C8"];
    });

    expect(() => assertDataValid(data)).toThrow(/2 masalah ditemukan/);
    expect(() => assertDataValid(data)).toThrow(/C9/);
    expect(() => assertDataValid(data)).toThrow(/C8/);
  });
});
