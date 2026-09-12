import { describe, expect, test } from "vitest";
import { getProcess } from "@/data";
import { MAX_PER_GROUP, flatten, search } from "./search";

describe("query handling", () => {
  test("ignores queries shorter than two characters", () => {
    expect(search("")).toEqual([]);
    expect(search("c")).toEqual([]);
    expect(search("  ")).toEqual([]);
  });

  test("is case and accent insensitive", () => {
    const upper = search("TÜV NORD");
    const lower = search("tuv nord");

    expect(upper.length).toBeGreaterThan(0);
    expect(flatten(lower).map((r) => r.id)).toEqual(
      flatten(upper).map((r) => r.id),
    );
  });

  test("finds nothing for a term that is not in the data", () => {
    expect(search("zzzznothing")).toEqual([]);
  });
});

describe("grouping", () => {
  test("groups appear in a fixed order and only when they have hits", () => {
    const groups = search("lab");

    expect(groups.map((group) => group.kind)).toEqual(
      ["unit", "dept", "process", "step"].filter((kind) =>
        groups.some((group) => group.kind === kind),
      ),
    );
    expect(groups.every((group) => group.results.length > 0)).toBe(true);
  });

  test("each group is capped so one kind cannot flood the list", () => {
    for (const group of search("a")) {
      expect(group.results.length).toBeLessThanOrEqual(MAX_PER_GROUP);
    }
    for (const group of search("re")) {
      expect(group.results.length).toBeLessThanOrEqual(MAX_PER_GROUP);
    }
  });

  test("covers all four kinds across the data", () => {
    const kinds = new Set([
      ...search("laboratory").map((g) => g.kind),
      ...search("chemical").map((g) => g.kind),
      ...search("sampling").map((g) => g.kind),
    ]);

    expect(kinds).toContain("unit");
    expect(kinds).toContain("dept");
    expect(kinds).toContain("process");
    expect(kinds).toContain("step");
  });
});

describe("ranking", () => {
  test("an exact name wins over a partial one", () => {
    const units = search("Procurement").find((g) => g.kind === "unit");

    expect(units?.results[0]?.label).toBe("Procurement");
  });

  test("a prefix match beats a match buried mid-string", () => {
    const results = search("calibration").find((g) => g.kind === "dept");

    expect(results?.results[0]?.label).toBe("Calibration Lab");
  });
});

describe("result targets", () => {
  test("a unit opens its Level 0 panel", () => {
    const unit = search("Corporate Management System")
      .find((g) => g.kind === "unit")
      ?.results[0];

    expect(unit?.href).toBe("/level-0?unit=cms");
  });

  test("a department opens its Level 0 panel", () => {
    const dept = search("Chemical Lab").find((g) => g.kind === "dept")
      ?.results[0];

    expect(dept?.href).toBe("/level-0?dept=lab_chem");
  });

  test("a process opens its Level 1 page with no highlight", () => {
    const process = search("Service Delivery: Laboratory")
      .find((g) => g.kind === "process")
      ?.results[0];

    expect(process?.href).toBe("/level-1/C4.2");
    expect(process?.badge).toBe("C4.2");
  });

  test("a step opens its process and highlights just that step", () => {
    const step = search("Registrasi & pengodean sampel")
      .find((g) => g.kind === "step")
      ?.results[0];

    expect(step?.href).toBe("/level-1/C4.2?steps=e");
    expect(step?.badge).toBe("C4.2-04");
    expect(step?.context).toContain("C4.2");
  });

  test("a multi-word query matches words that are not adjacent", () => {
    // "sample" and "receipt" never appear together in a Level 1 step title.
    const loose = flatten(search("sampel registrasi"));

    expect(loose.length).toBeGreaterThan(0);
    expect(loose.some((result) => result.kind === "step")).toBe(true);
  });

  test("every step result points at a step that exists", () => {
    for (const query of ["review", "audit", "laporan", "sampel"]) {
      for (const result of flatten(search(query))) {
        if (result.kind !== "step") continue;
        const [, processId, stepKey] = result.id.split(":");
        expect(
          getProcess(processId)?.steps.some((step) => step.k === stepKey),
          result.id,
        ).toBe(true);
      }
    }
  });

  test("every result has a label, context and href", () => {
    for (const result of flatten(search("re"))) {
      expect(result.label.length).toBeGreaterThan(0);
      expect(result.context.length).toBeGreaterThan(0);
      expect(result.href.startsWith("/level-")).toBe(true);
    }
  });
});

describe("flatten", () => {
  test("walks the groups in display order", () => {
    const groups = search("lab");
    const flat = flatten(groups);

    expect(flat).toHaveLength(
      groups.reduce((total, group) => total + group.results.length, 0),
    );
    expect(flat[0]).toBe(groups[0].results[0]);
  });
});
