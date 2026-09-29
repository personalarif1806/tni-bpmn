import { describe, expect, test } from "vitest";
import { paginate, type MeasuredBlock } from "@/lib/paginate";

const text = (height: number): MeasuredBlock => ({
  height,
  row: false,
  keepWithNext: false,
});
const heading = (height: number): MeasuredBlock => ({
  height,
  row: false,
  keepWithNext: true,
});
const row = (height: number): MeasuredBlock => ({
  height,
  row: true,
  keepWithNext: false,
});

describe("paginate", () => {
  test("fills a page before starting the next", () => {
    expect(paginate([text(40), text(40), text(40)], 100, 0)).toEqual([
      [0, 1],
      [2],
    ]);
  });

  test("never leaves a heading alone at the foot of a page", () => {
    expect(paginate([text(60), heading(20), text(40)], 100, 0)).toEqual([
      [0],
      [1, 2],
    ]);
  });

  test("charges the table heading again when rows continue on a new page", () => {
    // 10 heading + 3 × 30 rows = 100 fits; the fourth row reopens the table.
    expect(paginate([row(30), row(30), row(30), row(30)], 100, 10)).toEqual([
      [0, 1, 2],
      [3],
    ]);
  });

  test("a heading keeps the first row and its table heading with it", () => {
    expect(paginate([text(60), heading(10), row(30)], 100, 10)).toEqual([
      [0],
      [1, 2],
    ]);
  });

  test("a block taller than a page gets a page of its own", () => {
    expect(paginate([text(20), text(150), text(20)], 100, 0)).toEqual([
      [0],
      [1],
      [2],
    ]);
  });
});
