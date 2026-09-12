/**
 * Swimlane geometry and edge routing — PRD 8.8.
 *
 * Two corridors make routing safe by construction:
 *
 *  - vertical segments run on a **column boundary**. Nodes are 132px wide in a
 *    160px column, so a boundary is always ≥14px clear of every node.
 *  - horizontal detours run in a **lane band** at `laneTop + 100`, below the
 *    tallest shape (a decision diamond ends at `laneTop + 91`).
 *
 * A path built from those two can never cross a node box, which is what the
 * fallback route uses. The direct routes are tried first because they read
 * better, and each one is collision-tested before it is accepted.
 */
import { getLane, getProcess } from "@/data";
import type { Process, Step, StepNext } from "@/data/types";

export const LANE_HEADER_WIDTH = 184;
export const LANE_HEIGHT = 112;
export const COLUMN_WIDTH = 160;

/** Shape sizes, chosen to leave the corridors clear. */
const SHAPE_SIZE = {
  terminal: { width: 132, height: 44 },
  activity: { width: 132, height: 60 },
  decision: { width: 124, height: 70 },
} as const;

/** Keep-out margin when testing a path against a node box. */
const CLEARANCE = 5;

export type NodeShape = keyof typeof SHAPE_SIZE;

export interface SwimlaneLane {
  id: string;
  index: number;
  name: string;
  /** Parent organisation. */
  org?: string;
  /** External parties get a cobalt header (PRD 8.8). */
  external: boolean;
  y: number;
}

export interface SwimlaneNode {
  key: string;
  step: Step;
  shape: NodeShape;
  laneIndex: number;
  column: number;
  /** Centre. */
  cx: number;
  cy: number;
  /** Top-left corner and size. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Step number, absent on start and end nodes. */
  number?: string;
}

export interface Point {
  x: number;
  y: number;
}

export type ArrowDirection = "right" | "left" | "up" | "down";

export interface SwimlaneEdge {
  id: string;
  from: string;
  to: string;
  points: Point[];
  /** Branch label, drawn in a small white box on the path. */
  label?: string;
  labelAt?: Point;
  /** Loops back to an earlier column — drawn dashed in red. */
  backward: boolean;
  arrow: ArrowDirection;
}

export interface SwimlaneLayout {
  lanes: SwimlaneLane[];
  nodes: SwimlaneNode[];
  edges: SwimlaneEdge[];
  columns: number;
  /** Including the lane header column. */
  width: number;
  height: number;
}

/* -------------------------------------------------------------- Geometry */

export function nodeCenterX(column: number): number {
  return LANE_HEADER_WIDTH + column * COLUMN_WIDTH + COLUMN_WIDTH / 2;
}

export function laneCenterY(laneIndex: number): number {
  return laneIndex * LANE_HEIGHT + LANE_HEIGHT / 2;
}

/** Left edge of a column — a vertical corridor with no nodes in it. */
export function columnBoundaryX(column: number): number {
  return LANE_HEADER_WIDTH + column * COLUMN_WIDTH;
}

/** A horizontal corridor inside a lane, above or below every shape. */
export function laneBandY(laneIndex: number, side: "top" | "bottom"): number {
  return laneIndex * LANE_HEIGHT + (side === "top" ? 12 : 100);
}

function shapeFor(step: Step): NodeShape {
  if (step.y === "s" || step.y === "e") return "terminal";
  if (step.y === "d") return "decision";
  return "activity";
}

function nextKey(next: StepNext): string {
  return typeof next === "string" ? next : next[0];
}

function nextLabel(next: StepNext): string | undefined {
  return typeof next === "string" ? undefined : next[1];
}

/* ------------------------------------------------------- Collision testing */

function segmentHitsRect(a: Point, b: Point, node: SwimlaneNode): boolean {
  const left = node.x - CLEARANCE;
  const right = node.x + node.width + CLEARANCE;
  const top = node.y - CLEARANCE;
  const bottom = node.y + node.height + CLEARANCE;

  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);

  return maxX > left && minX < right && maxY > top && minY < bottom;
}

/** Does this path cross any node it is not attached to? */
export function pathHitsNode(
  points: Point[],
  nodes: SwimlaneNode[],
  exclude: readonly string[],
): boolean {
  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index];
    const b = points[index + 1];
    for (const node of nodes) {
      if (exclude.includes(node.key)) continue;
      if (segmentHitsRect(a, b, node)) return true;
    }
  }
  return false;
}

/* ----------------------------------------------------------------- Routing */

function arrowFor(points: Point[]): ArrowDirection {
  const end = points[points.length - 1];
  const before = points[points.length - 2] ?? end;
  if (end.x !== before.x) return end.x > before.x ? "right" : "left";
  return end.y > before.y ? "down" : "up";
}

/** Where an edge leaves its source node. */
type ExitSide = "right" | "bottom" | "top";

function exitPoint(node: SwimlaneNode, side: ExitSide): Point {
  if (side === "right") return { x: node.x + node.width, y: node.cy };
  if (side === "bottom") return { x: node.cx, y: node.y + node.height };
  return { x: node.cx, y: node.y };
}

/**
 * Candidate paths from best-looking to most defensive. The last one only uses
 * the two safe corridors, so it always survives the collision test.
 */
function candidatePaths(
  source: SwimlaneNode,
  targetNode: SwimlaneNode,
  exit: ExitSide,
): Point[][] {
  const sourceCenterY = laneCenterY(source.laneIndex);
  const targetCenterY = laneCenterY(targetNode.laneIndex);
  const entryLeft = { x: targetNode.x, y: targetCenterY };
  const entryTop = { x: targetNode.cx, y: targetNode.y };
  const entryBottom = { x: targetNode.cx, y: targetNode.y + targetNode.height };

  const goingDown = targetNode.laneIndex > source.laneIndex;
  const backward = targetNode.column < source.column;
  const sameLane = targetNode.laneIndex === source.laneIndex;

  const start = exitPoint(source, exit);
  const corridorX = columnBoundaryX(targetNode.column);
  const candidates: Point[][] = [];

  if (exit === "right") {
    // Straight across the lane.
    if (sameLane && !backward) {
      candidates.push([start, entryLeft]);
    }
    // Out, down the target column boundary, in.
    if (!backward) {
      candidates.push([
        start,
        { x: corridorX, y: sourceCenterY },
        { x: corridorX, y: targetCenterY },
        entryLeft,
      ]);
    }
  }

  // Drop into the source lane's band, run across it, then up or down the
  // target's column boundary. Always clear of every node.
  const bandSide: "top" | "bottom" =
    exit === "top" || (exit === "right" && !goingDown && !sameLane && !backward)
      ? "top"
      : "bottom";
  const bandY = laneBandY(source.laneIndex, bandSide);
  const bandStart =
    exit === "right"
      ? [start, { x: start.x + CLEARANCE * 2, y: sourceCenterY }, { x: start.x + CLEARANCE * 2, y: bandY }]
      : [start, { x: source.cx, y: bandY }];

  // Entering a node in the same lane from below reads better than looping
  // around to its left edge.
  const sameLaneReturn = sameLane || targetNode.laneIndex === source.laneIndex;
  if (sameLaneReturn) {
    candidates.push([
      ...bandStart,
      { x: targetNode.cx, y: bandY },
      bandSide === "bottom" ? entryBottom : entryTop,
    ]);
  }

  candidates.push([
    ...bandStart,
    { x: corridorX, y: bandY },
    { x: corridorX, y: targetCenterY },
    entryLeft,
  ]);

  return candidates;
}

function dedupePoints(points: Point[]): Point[] {
  return points.filter(
    (point, index) =>
      index === 0 ||
      point.x !== points[index - 1].x ||
      point.y !== points[index - 1].y,
  );
}

/** Rough box a branch label occupies, for collision testing. */
export function labelBox(
  anchor: Point,
  label: string,
): { x: number; y: number; width: number; height: number } {
  const width = Math.min(104, label.length * 5.6 + 12);
  return { x: anchor.x - width / 2, y: anchor.y - 10, width, height: 20 };
}

/** Labels only have to avoid covering a node, so they need less room than a line. */
const LABEL_CLEARANCE = 2;

function boxHitsNode(
  box: { x: number; y: number; width: number; height: number },
  nodes: SwimlaneNode[],
): boolean {
  return nodes.some(
    (node) =>
      box.x + box.width > node.x - LABEL_CLEARANCE &&
      box.x < node.x + node.width + LABEL_CLEARANCE &&
      box.y + box.height > node.y - LABEL_CLEARANCE &&
      box.y < node.y + node.height + LABEL_CLEARANCE,
  );
}

/**
 * Where a branch label sits on the path. Longer segments are preferred, and
 * each candidate is tested so a label never lands on a node box — an edge can
 * clear a node and still have its label cover one.
 */
function labelAnchor(
  points: Point[],
  label: string | undefined,
  nodes: SwimlaneNode[],
): Point {
  const segments = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index];
    const b = points[index + 1];
    segments.push({
      a,
      b,
      length: Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
    });
  }
  segments.sort((first, second) => second.length - first.length);

  const fallback = segments[0]
    ? { x: (segments[0].a.x + segments[0].b.x) / 2, y: (segments[0].a.y + segments[0].b.y) / 2 }
    : points[0];
  if (!label) return fallback;

  // Try the middle of each segment first, then points either side of it.
  for (const segment of segments) {
    for (const fraction of [0.5, 0.35, 0.65, 0.2, 0.8]) {
      const candidate = {
        x: segment.a.x + (segment.b.x - segment.a.x) * fraction,
        y: segment.a.y + (segment.b.y - segment.a.y) * fraction,
      };
      if (!boxHitsNode(labelBox(candidate, label), nodes)) return candidate;
    }
  }

  // Nothing fits on the line: the gap between two adjacent nodes is 28px and
  // even a short label needs more. Park it on a lane boundary instead, which
  // is the one horizontal line no shape ever reaches (the tallest, a decision
  // diamond, stops 21px inside its lane).
  const laneCount = Math.max(...nodes.map((node) => node.laneIndex)) + 1;

  for (const segment of segments) {
    const midX = (segment.a.x + segment.b.x) / 2;
    const laneIndex = Math.floor(
      ((segment.a.y + segment.b.y) / 2) / LANE_HEIGHT,
    );

    for (const boundary of [laneIndex + 1, laneIndex]) {
      if (boundary <= 0 || boundary > laneCount) continue;
      const candidate = { x: midX, y: boundary * LANE_HEIGHT };
      if (!boxHitsNode(labelBox(candidate, label), nodes)) return candidate;
    }
  }

  return fallback;
}

/* ------------------------------------------------------------------ Layout */

export function buildSwimlaneLayout(process: Process): SwimlaneLayout {
  const lanes: SwimlaneLane[] = process.lanes.map((laneId, index) => {
    const lane = getLane(laneId);
    return {
      id: laneId,
      index,
      name: lane?.n ?? laneId,
      org: lane?.t,
      external: lane?.ext === 1,
      y: index * LANE_HEIGHT,
    };
  });

  const laneIndexById = new Map(lanes.map((lane) => [lane.id, lane.index]));

  const nodes: SwimlaneNode[] = process.steps.map((step) => {
    const shape = shapeFor(step);
    const { width, height } = SHAPE_SIZE[shape];
    const laneIndex = laneIndexById.get(step.l) ?? 0;
    const cx = nodeCenterX(step.c);
    const cy = laneCenterY(laneIndex);

    return {
      key: step.k,
      step,
      shape,
      laneIndex,
      column: step.c,
      cx,
      cy,
      x: cx - width / 2,
      y: cy - height / 2,
      width,
      height,
      number: process.num[step.k],
    };
  });

  const nodeByKey = new Map(nodes.map((node) => [node.key, node]));
  const edges: SwimlaneEdge[] = [];

  for (const node of nodes) {
    const outgoing = node.step.n ?? [];

    outgoing.forEach((next, order) => {
      const target = nodeByKey.get(nextKey(next));
      if (!target) return;

      const backward = target.column < node.column;

      // A decision's first branch leaves from the right vertex; the rest leave
      // from the top or bottom vertex (PRD 8.8).
      let exit: ExitSide = "right";
      if (backward) {
        exit = "bottom";
      } else if (node.shape === "decision" && order > 0) {
        exit = target.laneIndex < node.laneIndex ? "top" : "bottom";
      } else if (outgoing.length > 1 && order > 0) {
        exit = target.laneIndex < node.laneIndex ? "top" : "bottom";
      }

      const candidates = candidatePaths(node, target, exit);
      const clean = candidates.find(
        (points) =>
          !pathHitsNode(dedupePoints(points), nodes, [node.key, target.key]),
      );
      const points = dedupePoints(clean ?? candidates[candidates.length - 1]);

      const label = nextLabel(next);

      edges.push({
        id: `${node.key}->${target.key}`,
        from: node.key,
        to: target.key,
        points,
        label,
        labelAt: labelAnchor(points, label, nodes),
        backward,
        arrow: arrowFor(points),
      });
    });
  }

  const columns = Math.max(...process.steps.map((step) => step.c)) + 1;

  return {
    lanes,
    nodes,
    edges,
    columns,
    width: LANE_HEADER_WIDTH + columns * COLUMN_WIDTH,
    height: lanes.length * LANE_HEIGHT,
  };
}

/** Layout for a process id, or undefined when the id is unknown. */
export function getSwimlaneLayout(processId: string): SwimlaneLayout | undefined {
  const process = getProcess(processId);
  return process ? buildSwimlaneLayout(process) : undefined;
}
