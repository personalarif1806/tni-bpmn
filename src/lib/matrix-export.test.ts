import { describe, expect, test } from "vitest";
import * as XLSX from "xlsx";
import { getStage, layout } from "@/data";
import { MATRIX_SCOPES, buildMatrix } from "@/lib/matrix";
import {
  buildExportWorkbook,
  createWorkbook,
  exportFileName,
} from "./matrix-export";

const sheets = buildExportWorkbook();

describe("workbook shape", () => {
  test("one sheet per scope, named after it", () => {
    expect(sheets.map((sheet) => sheet.name)).toEqual([
      "Value chain",
      "Certification Services",
      "Laboratory Services",
      "Inspection Services",
      "PCT Services",
    ]);
  });

  test("sheet names stay inside Excel's limits", () => {
    for (const sheet of sheets) {
      expect(sheet.name.length).toBeLessThanOrEqual(31);
      expect(sheet.name).not.toMatch(/[[\]:*?/\\]/);
    }
  });

  test("columns are the scope's stages, after the two label columns", () => {
    const lab = sheets.find((sheet) => sheet.name === "Laboratory Services")!;
    const header = lab.rows[0].map((cell) => cell.value);

    expect(header.slice(0, 2)).toEqual(["Kelompok", "Unit"]);
    expect(header.slice(2)).toEqual([
      "1. Request, quotation & contract review",
      "2. Sampling / sample receipt & registration",
      "3. Testing & calibration",
      "4. Result review & validation",
      "5. Report / certificate issuance",
      "6. Sample retention & customer follow-up",
    ]);
    expect(lab.columnWidths).toHaveLength(header.length);
  });

  test("value-chain columns have no step numbers", () => {
    const header = sheets[0].rows[0].map((cell) => cell.value).slice(2);

    expect(header).toEqual(layout.VC.map((id) => getStage(id)?.title));
  });

  test("rows match the on-screen matrix, carrying their group", () => {
    for (const scope of MATRIX_SCOPES) {
      const { groups } = buildMatrix(scope.id);
      const sheet = sheets.find(
        (item) => item.name === scope.label.slice(0, 31),
      )!;
      const bodyRows = sheet.rows.slice(1);

      expect(bodyRows).toHaveLength(
        groups.reduce((total, group) => total + group.rows.length, 0),
      );
      expect(new Set(bodyRows.map((row) => row[0].value))).toEqual(
        new Set(groups.map((group) => group.caption)),
      );
    }
  });

  test("a unit group row names its members", () => {
    const lab = sheets.find((sheet) => sheet.name === "Laboratory Services")!;
    const labels = lab.rows.map((row) => row[1]?.value);

    expect(labels).toContain(
      "Lab pengujian (Chemical, Microbiology, PSS Lab (CTS) dan NCTS Lab)",
    );
  });
});

describe("cells", () => {
  test("hold the RASCI letter, and are blank where there is no role", () => {
    const lab = sheets.find((sheet) => sheet.name === "Laboratory Services")!;
    const row = lab.rows.find((item) => item[1].value === "Laboratory Services")!;

    expect(row.slice(2).map((cell) => cell.value)).toEqual([
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
    ]);

    const support = lab.rows.find(
      (item) => item[1].value === "Lab Operation Support",
    )!;
    expect(support[2].value).toBe("");
    expect(support[3].value).toBe("S");
  });

  test("every letter matches the stage involvement it came from", () => {
    for (const scope of MATRIX_SCOPES) {
      const { groups } = buildMatrix(scope.id);
      const expected = groups.flatMap((group) =>
        group.rows.map((row) => row.cells.map((cell) => cell?.role ?? "")),
      );
      const sheet = sheets.find(
        (item) => item.name === scope.label.slice(0, 31),
      )!;

      expect(
        sheet.rows.slice(1).map((row) => row.slice(2).map((cell) => cell.value)),
      ).toEqual(expected);
    }
  });

  test("comments carry the role name and its description", () => {
    const lab = sheets.find((sheet) => sheet.name === "Laboratory Services")!;
    const row = lab.rows.find((item) => item[1].value === "Laboratory Services")!;

    expect(row[3].comment).toContain("A — Accountable");
    expect(row[3].comment).toContain("ketertelusuran");
  });

  test("comments flag the roles still awaiting confirmation", () => {
    const lab = sheets.find((sheet) => sheet.name === "Laboratory Services")!;
    const support = lab.rows.find(
      (item) => item[1].value === "Lab Operation Support",
    )!;

    expect(support[3].comment).toContain("perlu dikonfirmasi");
    const confirmed = lab.rows.find(
      (item) => item[1].value === "Laboratory Services",
    )!;
    expect(confirmed[3].comment).not.toContain("perlu dikonfirmasi");
  });

  test("blank cells carry no comment", () => {
    for (const sheet of sheets) {
      for (const row of sheet.rows.slice(1)) {
        for (const cell of row.slice(2)) {
          if (cell.value === "") expect(cell.comment).toBeUndefined();
        }
      }
    }
  });
});

describe("the written file", () => {
  const workbook = createWorkbook(XLSX);
  const roundTripped = XLSX.read(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx", cellStyles: true }),
    { type: "buffer", cellStyles: true },
  );

  test("survives a write and read as five named sheets", () => {
    expect(roundTripped.SheetNames).toEqual([
      "Value chain",
      "Certification Services",
      "Laboratory Services",
      "Inspection Services",
      "PCT Services",
    ]);
  });

  test("keeps the grid: header, units down the side, letters in the cells", () => {
    const sheet = roundTripped.Sheets["Laboratory Services"];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    expect(rows[0][1]).toBe("Unit");
    expect(rows[0][3]).toBe("2. Sampling / sample receipt & registration");
    expect(rows[1][0]).toBe("Profit center");
    expect(rows[1][1]).toBe("Laboratory Services");
    expect(rows[1][2]).toBe("A");
  });

  test("keeps the role descriptions as real cell comments", () => {
    const sheet = roundTripped.Sheets["Laboratory Services"];
    const cell = sheet.C2 as XLSX.CellObject;

    expect(cell.v).toBe("A");
    expect(cell.c).toBeDefined();
    expect(cell.c?.[0].t).toContain("Accountable");
  });

  test("carries a comment on every cell that has a role, and none elsewhere", () => {
    for (const name of roundTripped.SheetNames) {
      const sheet = roundTripped.Sheets[name];
      const range = XLSX.utils.decode_range(sheet["!ref"]!);

      for (let r = range.s.r + 1; r <= range.e.r; r += 1) {
        for (let c = 2; c <= range.e.c; c += 1) {
          const cell = sheet[XLSX.utils.encode_cell({ r, c })] as
            | XLSX.CellObject
            | undefined;
          if (cell?.v) {
            expect(cell.c, `${name} ${r},${c}`).toBeDefined();
          } else {
            expect(cell?.c, `${name} ${r},${c}`).toBeUndefined();
          }
        }
      }
    }
  });
});

describe("file name", () => {
  test("is dated", () => {
    expect(exportFileName(new Date("2026-09-12T04:00:00Z"))).toBe(
      "Matriks-Keterlibatan-Level-0_2026-09-12.xlsx",
    );
  });
});
