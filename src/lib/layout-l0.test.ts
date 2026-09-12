import { describe, expect, test } from "vitest";
import { layout, units } from "@/data";
import {
  CANVAS_WIDTH,
  CENTER_OFFSET,
  CENTER_WIDTH,
  CORE_INNER_WIDTH,
  EXTERNAL_COLUMN_WIDTH,
  MAP_FIT_GUTTER,
  TOP_LEFT_WIDTH,
  TOP_RIGHT_WIDTH,
  VC_ARROW_WIDTH,
  VC_STAGE_WIDTH,
  buildMapModel,
  valueChainStageCenter,
} from "./layout-l0";

const model = buildMapModel();

describe("geometry", () => {
  test("the central stack and both external columns fill the canvas", () => {
    const padding = CANVAS_WIDTH - (CENTER_OFFSET * 2 + CENTER_WIDTH);

    expect(padding).toBe(48); // 24px each side
    expect(CENTER_OFFSET).toBeGreaterThan(EXTERNAL_COLUMN_WIDTH);
  });

  test("the two top bands and their gap span the central stack", () => {
    expect(TOP_LEFT_WIDTH + TOP_RIGHT_WIDTH).toBe(CENTER_WIDTH - 24);
    // Sized by box count: 5 boxes on the left, 3 on the right.
    expect(TOP_LEFT_WIDTH).toBeGreaterThan(TOP_RIGHT_WIDTH);
  });

  test("the value chain row fits inside the core block", () => {
    const stages = layout.VC.length;
    const rowWidth =
      VC_STAGE_WIDTH * stages + VC_ARROW_WIDTH * (stages - 1);

    expect(rowWidth).toBeLessThanOrEqual(CORE_INNER_WIDTH);
    expect(CORE_INNER_WIDTH - rowWidth).toBeLessThan(stages);
  });

  test("stage centres march across the row and stay inside it", () => {
    const centers = layout.VC.map((_, index) => valueChainStageCenter(index));

    expect(centers).toEqual([...centers].sort((a, b) => a - b));
    expect(centers[0]).toBeGreaterThan(0);
    expect(centers[centers.length - 1]).toBeLessThan(CORE_INNER_WIDTH);
  });
});

describe("model", () => {
  test("the governance strip is the gov units, in data order", () => {
    expect(model.governance.map((box) => box.unitId)).toEqual(["boc", "md"]);
  });

  test("bands follow the order in l0-layout.json", () => {
    expect(model.strategy.boxes.map((box) => box.unitId)).toEqual(layout.TOP_L);
    expect(model.governanceQuality.boxes.map((box) => box.unitId)).toEqual(
      layout.TOP_R,
    );
    expect(model.support.boxes.map((box) => box.unitId)).toEqual(layout.BOTTOM);
  });

  test("flow labels come from the unit, not the component", () => {
    for (const band of [model.strategy, model.governanceQuality, model.support]) {
      for (const box of band.boxes) {
        expect(box.flow).toEqual(units[box.unitId]?.flow ?? []);
      }
    }
  });

  test("Corporate Management System shows tag SID and codes G1, G2 (M2)", () => {
    const box = model.governanceQuality.boxes.find(
      (item) => item.unitId === "cms",
    );

    expect(box?.tag).toBe("SID");
    expect(box?.codes).toEqual(["G1", "G2"]);
  });

  test("the committee box is flagged for its dashed border", () => {
    const box = model.governanceQuality.boxes.find(
      (item) => item.unitId === "gbac",
    );

    expect(box?.committee).toBe(true);
  });

  test("Service Delivery lists all four C4.x processes", () => {
    const stage = model.valueChain.stages.find(
      (item) => item.stageId === "vc_del",
    );

    expect(stage?.codes).toEqual(["C4.1", "C4.2", "C4.3", "C4.4"]);
    expect(model.valueChain.links).toHaveLength(
      model.valueChain.stages.length - 1,
    );
  });

  test("each profit-center lane has six numbered steps with a Level 1 range", () => {
    for (const lane of model.profitCenters.lanes) {
      expect(lane.steps).toHaveLength(6);
      expect(lane.steps.map((step) => step.index)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(lane.steps.every((step) => step.range.length > 0)).toBe(true);
    }
  });

  test("the laboratory lane carries the ranges from STEP2L1", () => {
    const lane = model.profitCenters.lanes.find(
      (item) => item.unitId === "lab",
    );

    expect(lane?.codes).toEqual(["C4.2"]);
    expect(lane?.steps.map((step) => step.range)).toEqual([
      "C4.2-01",
      "C4.2-02–04",
      "C4.2-05–06",
      "C4.2-07–08",
      "C4.2-09–10",
      "C4.2-11",
    ]);
    expect(lane?.chips).toHaveLength(13);
  });

  test("external columns keep their layout order and output sources", () => {
    expect(model.external.left.map((entry) => entry.unitId)).toEqual(
      layout.EXT_L.map(([unitId]) => unitId),
    );
    expect(model.external.right.map((entry) => entry.unitId)).toEqual(
      layout.EXT_R.map(([unitId]) => unitId),
    );
    expect(
      model.external.right.every((entry) => entry.source !== undefined),
    ).toBe(true);
    expect(
      model.external.left.every((entry) => entry.source === undefined),
    ).toBe(true);
  });
});

describe("fit-to-width gutter", () => {
  test("the map is fitted to less than the full viewport width", () => {
    // Fitting to exactly the viewport width lets the fitted canvas summon the
    // viewport's own scrollbar, which changes the width, which changes the fit
    // — a ResizeObserver loop. The gutter has to be wider than a scrollbar.
    expect(MAP_FIT_GUTTER).toBeGreaterThanOrEqual(16);
    expect(MAP_FIT_GUTTER).toBeLessThan(CANVAS_WIDTH * 0.02);
  });

  test("a fitted map stays inside the viewport at common widths", () => {
    for (const viewport of [1440, 1600, 1920, 2560]) {
      const zoom = (viewport - MAP_FIT_GUTTER) / CANVAS_WIDTH;
      expect(Math.floor(CANVAS_WIDTH * zoom)).toBeLessThan(viewport);
    }
  });
});
