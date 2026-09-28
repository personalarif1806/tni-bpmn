import { describe, expect, test } from "vitest";
import translations from "@/data/translations.json";
import departmentsJson from "@/data/l0-departments.json";
import layoutJson from "@/data/l0-layout.json";
import involvementJson from "@/data/l0-stage-involvement.json";
import unitGroupsJson from "@/data/l0-unit-groups.json";
import unitsJson from "@/data/l0-units.json";
import groupsJson from "@/data/l1-groups.json";
import lanesJson from "@/data/l1-lanes.json";
import processesJson from "@/data/l1-processes.json";

/**
 * The guarantee behind the language switch: every string that can reach the
 * screen has an English entry, so the English view cannot fall back to
 * Indonesian for a sentence somebody forgot.
 *
 * Two sources feed it. UI text is found by scanning for `t("…")` literals,
 * which is why the dictionary is keyed by the Indonesian rather than by invented
 * ids — the call site is the key. Content text is collected from the shipped
 * JSON using the same field rules `localize.ts` applies.
 */

const DICTIONARY = translations as Record<string, Record<string, string>>;

/** Every source file, as text. Vite resolves this; no node APIs needed. */
const SOURCES = import.meta.glob("/src/**/*.{ts,tsx}", {
  query: "?raw",
  eager: true,
  import: "default",
}) as Record<string, string>;

/** Every `t("…")` in the app, with escapes resolved to what `t` receives. */
function uiStrings(): string[] {
  const found = new Set<string>();
  for (const [path, source] of Object.entries(SOURCES)) {
    if (path.includes(".test.")) continue;
    for (const match of source.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) {
      found.add(match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'));
    }
  }
  return [...found];
}

/** Mirrors `localize.ts`. Both must change together, and this test says so. */
function contentStrings(): string[] {
  const found = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value === "string" && value.trim().length > 1) found.add(value);
  };
  const addAll = (values: unknown) => {
    if (Array.isArray(values)) values.forEach(add);
  };

  for (const unit of Object.values(unitsJson as Record<string, Record<string, unknown>>)) {
    add(unit.org);
    add(unit.role);
    add(unit.sub);
    add(unit.tag);
    if (unit.cat === "vc") {
      add(unit.name);
      addAll(unit.depts);
    }
    for (const key of ["tasks", "outputs", "gives", "receives", "flow", "steps", "links"]) {
      addAll(unit[key]);
    }
  }

  const layout = layoutJson as Record<string, unknown>;
  addAll(layout.VC_LINKS);
  for (const key of ["CATS", "RAS_LBL", "RAS_DESC"]) {
    Object.values(layout[key] as Record<string, string>).forEach(add);
  }
  for (const row of layout.EXT_L as [string, string][]) add(row[1]);
  for (const row of layout.EXT_R as [string, string, string][]) {
    add(row[1]);
    add(row[2]);
  }

  for (const group of Object.values(unitGroupsJson as Record<string, Record<string, unknown>>)) {
    add(group.n);
    add(group.sub);
  }
  for (const group of Object.values(groupsJson as Record<string, Record<string, unknown>>)) {
    add(group.n);
    add(group.l0);
  }
  for (const lane of Object.values(lanesJson as Record<string, Record<string, unknown>>)) {
    add(lane.n);
    add(lane.t);
  }

  const involvement = involvementJson as unknown as {
    vc: Record<string, [string, string, string, boolean?][]>;
    pc: Record<string, [string, string, string, boolean?][][]>;
  };
  for (const rows of Object.values(involvement.vc)) for (const row of rows) add(row[2]);
  for (const lanes of Object.values(involvement.pc)) {
    for (const rows of lanes) for (const row of rows) add(row[2]);
  }

  for (const process of processesJson as Record<string, unknown>[]) {
    for (const key of ["l0", "owner", "purpose", "ref", "note"]) add(process[key]);
    addAll(process.kpi);
    for (const step of process.steps as Record<string, unknown>[]) {
      for (const key of ["t", "d", "o"]) add(step[key]);
      for (const next of (step.n as unknown[]) ?? []) {
        if (Array.isArray(next)) add(next[1]);
      }
    }
  }

  return [...found];
}

describe("translation completeness", () => {
  test("every UI string has an entry in both languages", () => {
    const missing = uiStrings().filter((s) => !(s in DICTIONARY));
    expect(missing, `Tanpa terjemahan:\n${missing.join("\n")}`).toEqual([]);
  });

  test("every content string has an entry in both languages", () => {
    const missing = contentStrings().filter((s) => !(s in DICTIONARY));
    expect(
      missing.length,
      `${missing.length} string konten tanpa terjemahan, contoh:\n${missing.slice(0, 15).join("\n")}`,
    ).toBe(0);
  });

  test("no entry is left blank on either side", () => {
    const blank = Object.entries(DICTIONARY)
      .filter(([, pair]) => !pair.id?.trim() || !pair.en?.trim())
      .map(([source]) => source);
    expect(blank, `Sisi yang masih kosong:\n${blank.slice(0, 15).join("\n")}`).toEqual([]);
  });

  /*
   * A dictionary that keeps entries for strings nobody renders drifts: the next
   * person cannot tell which wording is live. Deleting a unit should delete its
   * sentences with it.
   */
  test("no entry is left behind after the string it translated is gone", () => {
    const live = new Set([...uiStrings(), ...contentStrings()]);
    const orphans = Object.keys(DICTIONARY).filter((source) => !live.has(source));
    expect(
      orphans,
      `Entri tanpa pemakai — jalankan: node scripts/i18n-todo.mjs all --orphans\n${orphans.slice(0, 15).join("\n")}`,
    ).toEqual([]);
  });

  /*
   * Some department names are also Level 1 lane names, so they do reach the
   * dictionary. What must never happen is one of them being rewritten: an
   * entry for a department name has to be the same string on both sides.
   */
  test("department names read the same in both languages", () => {
    for (const department of Object.values(departmentsJson as Record<string, { n: string }>)) {
      const entry = DICTIONARY[department.n];
      if (!entry) continue;
      expect(entry.id, department.n).toBe(department.n);
      expect(entry.en, department.n).toBe(department.n);
    }
  });
});
