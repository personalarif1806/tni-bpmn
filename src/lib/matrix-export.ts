/**
 * XLSX export of the involvement matrix — one sheet per scope.
 *
 * The workbook contents are built as plain data by `buildExportWorkbook`, which
 * keeps it testable without SheetJS. `exportMatrixWorkbook` loads SheetJS on
 * demand: the library is ~400KB and would otherwise triple the initial bundle
 * for a button most sessions never press.
 */
import { layout } from "@/data";
import { MATRIX_SCOPES, buildMatrix } from "@/lib/matrix";
import { t } from "@/lib/i18n";

export interface ExportCell {
  /** The RASCI letter, or "" where the unit has no role at this stage. */
  value: string;
  /** Full role name and description, attached as a cell comment. */
  comment?: string;
}

export interface ExportSheet {
  /** Sheet tab name — Excel allows 31 characters and no []:*?/\ */
  name: string;
  /** Header row followed by one row per unit. */
  rows: ExportCell[][];
  /** Column widths, in characters. */
  columnWidths: number[];
}

const HEADERS = [t("Kelompok"), t("Unit")];

/** Excel rejects these in a sheet name, and caps the name at 31 characters. */
function sheetName(label: string): string {
  return label.replace(/[[\]:*?/\\]/g, " ").slice(0, 31);
}

function columnTitle(title: string, index?: number): string {
  return index ? `${index}. ${title}` : title;
}

/** One sheet per scope, as plain rows. */
export function buildExportWorkbook(): ExportSheet[] {
  return MATRIX_SCOPES.map((scope) => {
    const { groups } = buildMatrix(scope.id);

    const header: ExportCell[] = [
      ...HEADERS.map((value) => ({ value })),
      ...scope.columns.map((column) => ({
        value: columnTitle(column.title, column.index),
      })),
    ];

    const rows: ExportCell[][] = [header];

    for (const group of groups) {
      for (const row of group.rows) {
        rows.push([
          { value: group.caption },
          { value: row.sub ? `${row.name} (${row.sub})` : row.name },
          ...row.cells.map((cell) => {
            if (!cell) return { value: "" };

            const roleName = layout.RAS_LBL[cell.role];
            const flag = cell.needsConfirmation
              ? t("\n\nPeran ini masih perlu dikonfirmasi pemilik proses.")
              : "";

            return {
              value: cell.role,
              comment: `${cell.role} — ${roleName}\n${cell.description}${flag}`,
            };
          }),
        ]);
      }
    }

    return {
      name: sheetName(scope.label),
      rows,
      columnWidths: [34, 40, ...scope.columns.map(() => 16)],
    };
  });
}

/** `Matriks-Keterlibatan-Level-0_2026-09-12.xlsx` */
export function exportFileName(today = new Date()): string {
  const date = today.toISOString().slice(0, 10);
  return `Matriks-Keterlibatan-Level-0_${date}.xlsx`;
}

type SheetJS = typeof import("xlsx");

/**
 * Assembles the workbook from the sheet model. Takes SheetJS as an argument so
 * the app can load it lazily while a test can pass it in directly and read the
 * result back.
 */
export function createWorkbook(XLSX: SheetJS) {
  const workbook = XLSX.utils.book_new();

  for (const sheet of buildExportWorkbook()) {
    const worksheet = XLSX.utils.aoa_to_sheet(
      sheet.rows.map((row) => row.map((cell) => cell.value)),
    );

    // Attach the role descriptions as cell comments.
    sheet.rows.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        if (!cell.comment) return;
        const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
        const target = worksheet[address];
        if (!target) return;
        target.c = [{ a: t("Peta Proses Bisnis"), t: cell.comment }];
      });
    });

    worksheet["!cols"] = sheet.columnWidths.map((width) => ({ wch: width }));
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }

  return workbook;
}

/**
 * Builds the workbook and hands it to the browser as a download. SheetJS is
 * imported here so it is code-split into its own chunk — it is ~160KB gzipped
 * and most sessions never press the button.
 */
export async function exportMatrixWorkbook(): Promise<void> {
  const XLSX = await import("xlsx");
  XLSX.writeFile(createWorkbook(XLSX), exportFileName());
}
