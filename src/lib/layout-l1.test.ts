import { describe, expect, test } from "vitest";
import { listProcessesByGroup, processes } from "@/data";
import {
  COLUMN_WIDTH,
  LANE_HEADER_WIDTH,
  LANE_HEIGHT,
  buildSwimlaneLayout,
  labelBox,
  laneCenterY,
  nodeCenterX,
  pathHitsNode,
} from "./layout-l1";
import { chainStages } from "./process-groups";

const layouts = processes.map((process) => ({
  id: process.id,
  layout: buildSwimlaneLayout(process),
}));

describe("geometry", () => {
  test("nodes sit on the grid the PRD specifies", () => {
    const { layout } = layouts.find((item) => item.id === "C4.2")!;
    const node = layout.nodes[1];

    expect(nodeCenterX(node.column)).toBe(
      LANE_HEADER_WIDTH + node.column * COLUMN_WIDTH + 80,
    );
    expect(node.cx).toBe(nodeCenterX(node.column));
    expect(node.cy).toBe(laneCenterY(node.laneIndex));
    expect(layout.height).toBe(layout.lanes.length * LANE_HEIGHT);
  });

  test("lane metadata is resolved from l1-lanes.json", () => {
    const { layout } = layouts.find((item) => item.id === "C4.2")!;
    const customer = layout.lanes[0];

    expect(customer.id).toBe("cust");
    expect(customer.name).toBe("Pelanggan");
    expect(customer.external).toBe(true);
    expect(layout.lanes.every((lane) => lane.y === lane.index * LANE_HEIGHT)).toBe(
      true,
    );
  });

  test("shapes follow the step kind", () => {
    for (const { layout } of layouts) {
      for (const node of layout.nodes) {
        const expected =
          node.step.y === "s" || node.step.y === "e"
            ? "terminal"
            : node.step.y === "d"
              ? "decision"
              : "activity";
        expect(node.shape).toBe(expected);
      }
    }
  });
});

describe("edge routing", () => {
  test("no edge crosses a node box, in any of the 20 processes", () => {
    const crossings: string[] = [];

    for (const { id, layout } of layouts) {
      for (const edge of layout.edges) {
        if (pathHitsNode(edge.points, layout.nodes, [edge.from, edge.to])) {
          crossings.push(`${id} ${edge.id}`);
        }
      }
    }

    expect(crossings).toEqual([]);
  });

  test("every edge in the data is drawn", () => {
    for (const { layout } of layouts) {
      const expected = layout.nodes.reduce(
        (total, node) => total + (node.step.n?.length ?? 0),
        0,
      );
      expect(layout.edges).toHaveLength(expected);
    }
  });

  test("paths are orthogonal throughout", () => {
    for (const { id, layout } of layouts) {
      for (const edge of layout.edges) {
        for (let index = 0; index < edge.points.length - 1; index += 1) {
          const a = edge.points[index];
          const b = edge.points[index + 1];
          expect(
            a.x === b.x || a.y === b.y,
            `${id} ${edge.id} segment ${index} is diagonal`,
          ).toBe(true);
        }
      }
    }
  });

  test("edges start on their source and end on their target", () => {
    for (const { layout } of layouts) {
      const byKey = new Map(layout.nodes.map((node) => [node.key, node]));
      for (const edge of layout.edges) {
        const source = byKey.get(edge.from)!;
        const target = byKey.get(edge.to)!;
        const first = edge.points[0];
        const last = edge.points[edge.points.length - 1];

        const touches = (point: { x: number; y: number }, node: typeof source) =>
          point.x >= node.x - 1 &&
          point.x <= node.x + node.width + 1 &&
          point.y >= node.y - 1 &&
          point.y <= node.y + node.height + 1;

        expect(touches(first, source), `${edge.id} start`).toBe(true);
        expect(touches(last, target), `${edge.id} end`).toBe(true);
      }
    }
  });

  test("backward edges are flagged for the dashed red treatment", () => {
    const backward = layouts.flatMap(({ id, layout }) =>
      layout.edges.filter((edge) => edge.backward).map((edge) => `${id} ${edge.id}`),
    );

    expect(backward.length).toBe(20);
    for (const { layout } of layouts) {
      const byKey = new Map(layout.nodes.map((node) => [node.key, node]));
      for (const edge of layout.edges) {
        const isBackward = byKey.get(edge.to)!.column < byKey.get(edge.from)!.column;
        expect(edge.backward).toBe(isBackward);
      }
    }
  });

  test("branch labels survive from the data onto the path", () => {
    const { layout } = layouts.find((item) => item.id === "C4.2")!;
    const labelled = layout.edges.filter((edge) => edge.label);

    expect(labelled.length).toBeGreaterThan(0);
    expect(labelled.every((edge) => edge.labelAt !== undefined)).toBe(true);
    expect(layout.edges.find((edge) => edge.id === "d->e")?.label).toBe("Ya");
  });
});

describe("architecture chain", () => {
  test("C4.1–C4.4 share one stage, the rest stand alone", () => {
    const stages = chainStages(listProcessesByGroup("C"));

    expect(stages.map((members) => members.map((item) => item.id))).toEqual([
      ["C1"],
      ["C2"],
      ["C3"],
      ["C4.1", "C4.2", "C4.3", "C4.4"],
      ["C5"],
    ]);
  });

  test("M4.1–M4.6 share one stage after M1–M3", () => {
    const stages = chainStages(listProcessesByGroup("M"));

    expect(stages.map((members) => members.map((item) => item.id))).toEqual([
      ["M1"],
      ["M2"],
      ["M3"],
      ["M4.1", "M4.2", "M4.3", "M4.4", "M4.5", "M4.6"],
    ]);
  });

  test("groups without a split render one block per process", () => {
    for (const group of ["G", "S"] as const) {
      const processes = listProcessesByGroup(group);
      expect(chainStages(processes)).toHaveLength(processes.length);
    }
  });
});

describe("branch labels", () => {
  test("no branch label box lands on a node, in any process", () => {
    const collisions: string[] = [];

    for (const { id, layout } of layouts) {
      for (const edge of layout.edges) {
        if (!edge.label || !edge.labelAt) continue;
        const box = labelBox(edge.labelAt, edge.label);

        const hit = layout.nodes.some(
          (node) =>
            box.x + box.width > node.x &&
            box.x < node.x + node.width &&
            box.y + box.height > node.y &&
            box.y < node.y + node.height,
        );
        if (hit) collisions.push(`${id} ${edge.id} "${edge.label}"`);
      }
    }

    expect(collisions).toEqual([]);
  });

  test("labels stay attached to their own edge", () => {
    // A label sits on the path when it fits. When it cannot — the gap between
    // two adjacent nodes is narrower than the label — it drops to the lane
    // boundary directly above or below, still centred on its own segment.
    for (const { id, layout } of layouts) {
      for (const edge of layout.edges) {
        if (!edge.label || !edge.labelAt) continue;

        const anchor = edge.labelAt;
        const attached = edge.points.some((point, index) => {
          const next = edge.points[index + 1];
          if (!next) return false;
          const withinX =
            anchor.x >= Math.min(point.x, next.x) - 1 &&
            anchor.x <= Math.max(point.x, next.x) + 1;
          const withinY =
            anchor.y >= Math.min(point.y, next.y) - 1 &&
            anchor.y <= Math.max(point.y, next.y) + 1;
          const onLaneBoundary = anchor.y % LANE_HEIGHT === 0;
          return withinX && (withinY || onLaneBoundary);
        });

        expect(attached, `${id} ${edge.id} "${edge.label}"`).toBe(true);
      }
    }
  });

  test("almost every label sits on its own path", () => {
    const offPath = layouts.flatMap(({ id, layout }) =>
      layout.edges
        .filter((edge) => {
          if (!edge.label || !edge.labelAt) return false;
          const anchor = edge.labelAt;
          return !edge.points.some((point, index) => {
            const next = edge.points[index + 1];
            if (!next) return false;
            return (
              anchor.x >= Math.min(point.x, next.x) - 1 &&
              anchor.x <= Math.max(point.x, next.x) + 1 &&
              anchor.y >= Math.min(point.y, next.y) - 1 &&
              anchor.y <= Math.max(point.y, next.y) + 1
            );
          });
        })
        .map((edge) => `${id} ${edge.id}`),
    );

    // Only the short same-lane branches, where the 28px gap between two
    // adjacent nodes cannot hold a label, are moved off the line: 3 of 55.
    expect(offPath.length).toBeLessThanOrEqual(5);
    const total = layouts.reduce(
      (sum, { layout }) =>
        sum + layout.edges.filter((edge) => edge.label).length,
      0,
    );
    expect(offPath.length / total).toBeLessThan(0.1);
  });
});
