import { describe, expect, test } from "vitest";
import {
  formatDocDate,
  isProcedureNumber,
  parentProcedure,
  parseDocNumber,
} from "@/lib/doc-number";

describe("parseDocNumber", () => {
  /* The worked examples of spec §1.1, which must all be accepted. */
  test.each([
    ["PCR-TNI-01", "procedure"],
    ["FCR-TNI-01A", "form"],
    ["FCR-TNI-06A", "form"],
    ["PHR-TNI-03", "procedure"],
    ["WCAL-TNI-02B", "work-instruction"],
    ["PSC-Q-TNI-01", "procedure-scs"],
    ["MU-04_02", "method"],
    ["MK-03_01", "method"],
    ["MI-TNI-01", "integration-manual"],
    ["PIT-TNI-06", "procedure"],
    ["PSC-EnA-TNI-02", "procedure-scs"],
  ])("accepts %s as a %s", (value, kind) => {
    expect(parseDocNumber(value)?.kind).toBe(kind);
  });

  test.each([
    "PR-IT-01", // the project's old ad-hoc format
    "PIT-TNID-01", // TNID is unconfirmed (spec §11 #1)
    "pit-tni-01", // codes are case-sensitive
    "PSC-EN-TNI-01", // `En`, not `EN`
    "PIT-TNI-00", // numbering starts at 01
    "PIT-TNI-1", // two digits
    "PXX-TNI-01", // unknown department
    "FIT-TNI-01", // a form needs its Z
    "FIT-TNI-01a", // Z is a capital
    "MU-14_01", // testing categories stop at 13
    "MK-11_01", // calibration categories stop at 10
    "MI-TNI-02", // there is one Integration Manual
    "PSC-VE-TNI-01", // PCT schemes are not confirmed for this format
  ])("rejects %s", (value) => {
    expect(parseDocNumber(value)).toBeNull();
  });

  test("reads the parts of a number", () => {
    expect(parseDocNumber("WCAL-TNI-02B")).toEqual({
      kind: "work-instruction",
      x: "CAL",
      yy: "02",
      z: "B",
    });
    expect(parseDocNumber("MU-04_02")).toEqual({
      kind: "method",
      method: "U",
      bb: "04",
      yy: "02",
    });
  });
});

describe("derived documents", () => {
  test("a form or work instruction descends from the same X and YY", () => {
    expect(parentProcedure("FCR-TNI-01A")).toBe("PCR-TNI-01");
    expect(parentProcedure("WCAL-TNI-02B")).toBe("PCAL-TNI-02");
  });

  test("a procedure has no parent", () => {
    expect(parentProcedure("PCR-TNI-01")).toBeNull();
  });

  test("both procedure formats count as procedures", () => {
    expect(isProcedureNumber("PIT-TNI-01")).toBe(true);
    expect(isProcedureNumber("PSC-Q-TNI-01")).toBe(true);
    expect(isProcedureNumber("FIT-TNI-01A")).toBe(false);
  });
});

test("header dates read DD.MM.YYYY", () => {
  expect(formatDocDate("2026-09-17")).toBe("17.09.2026");
});
