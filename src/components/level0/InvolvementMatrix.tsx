import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, Loader2 } from "lucide-react";
import { RasciBadge } from "@/components/shared/RasciBadge";
import { layout } from "@/data";
import { useMotionConfig } from "@/hooks/useMotionConfig";
import {
  MATRIX_SCOPES,
  buildMatrix,
  type MatrixCell,
  type MatrixColumn,
} from "@/lib/matrix";
import { exportMatrixWorkbook } from "@/lib/matrix-export";
import { t } from "@/lib/i18n";

/**
 * Involvement matrix — PRD 8.5. One tab per scope, RASCI badges in the cells,
 * and every cell or column header opens that stage back on the map.
 */
export function InvolvementMatrix({
  onOpenStage,
}: {
  onOpenStage: (stageId: string) => void;
}) {
  const [scopeId, setScopeId] = useState(MATRIX_SCOPES[0].id);
  const [exportState, setExportState] = useState<"idle" | "working" | "failed">(
    "idle",
  );
  const { duration, ease } = useMotionConfig();
  const { scope, groups } = useMemo(() => buildMatrix(scopeId), [scopeId]);

  const runExport = async () => {
    setExportState("working");
    try {
      await exportMatrixWorkbook();
      setExportState("idle");
    } catch {
      setExportState("failed");
    }
  };

  const columnTitle = (column: MatrixColumn) =>
    column.index ? `${column.index}. ${column.title}` : column.title;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div role="tablist" aria-label={t("Lingkup matriks")} className="flex flex-wrap">
        {MATRIX_SCOPES.map((tab) => {
          const isActive = tab.id === scopeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`matrix-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`matrix-panel-${tab.id}`}
              onClick={() => setScopeId(tab.id)}
              className={`relative px-3 py-2 text-label transition-colors ${
                isActive ? "font-demi text-cobalt" : "text-muted hover:text-ink"
              }`}
              style={{ transitionDuration: "var(--hover-duration)" }}
            >
              {tab.label}
              {isActive ? (
                <motion.span
                  layoutId="matrix-tab-indicator"
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-cobalt"
                  transition={{ duration: duration.tabContent, ease: ease.out }}
                />
              ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={runExport}
            disabled={exportState === "working"}
            className="flex h-8 items-center gap-1.5 border border-line bg-white px-2.5 text-label font-medium text-ink transition-colors hover:bg-paper disabled:cursor-progress disabled:text-muted"
            style={{ transitionDuration: "var(--hover-duration)" }}
          >
            {exportState === "working" ? (
              <Loader2 size={14} aria-hidden="true" className="animate-spin text-muted" />
            ) : (
              <Download size={14} aria-hidden="true" className="text-muted" />
            )}
            {t("Ekspor XLSX")}
          </button>
          <p aria-live="polite" className="text-badge text-muted">
            {exportState === "working"
              ? t("Menyiapkan berkas…")
              : exportState === "failed"
                ? t("Ekspor gagal, coba lagi.")
                : t("5 sheet, satu per lingkup")}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={scopeId}
          id={`matrix-panel-${scopeId}`}
          role="tabpanel"
          aria-labelledby={`matrix-tab-${scopeId}`}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { duration: duration.tabContent, ease: ease.out },
          }}
          exit={{ opacity: 0, transition: { duration: duration.tabContent } }}
          /*
           * One scroll container for both axes: the column header sticks to its
           * top and the unit column to its left, which page-level sticky cannot
           * do once a wrapper scrolls horizontally.
           *
           * `relative` matters: without a positioned ancestor the sticky cells
           * propagate their overflow to the document, and the whole page scrolls
           * sideways on a narrow screen.
           */
          className="relative max-h-[70vh] overflow-auto border border-line"
        >
          <table className="w-full border-collapse text-table">
            <caption className="sr-only">
              {t("Matriks keterlibatan unit pada tahapan")} {scope.label}
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky top-0 left-0 z-20 min-w-[17rem] border-r border-b border-line bg-white px-3 py-2 text-left font-demi"
                >
                  Unit
                </th>
                {scope.columns.map((column) => (
                  <th
                    key={column.stageId}
                    scope="col"
                    className="sticky top-0 z-10 w-40 border-r border-b border-line bg-white p-0 align-bottom last:border-r-0"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenStage(column.stageId)}
                      className="flex h-full w-full flex-col gap-0.5 px-2 py-2 text-left transition-colors hover:bg-paper"
                      style={{ transitionDuration: "var(--hover-duration)" }}
                    >
                      {column.index ? (
                        <span className="text-badge text-muted tabular-nums">
                          {t("Langkah")} {column.index}
                        </span>
                      ) : null}
                      <span className="text-label leading-tight font-demi text-ink">
                        {column.title}
                      </span>
                      <span className="text-badge text-cobalt">
                        {t("Buka di peta")}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            {groups.map((group) => (
              <tbody key={group.id}>
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={scope.columns.length + 1}
                    className="sticky left-0 border-y border-line bg-paper px-3 py-1.5 text-left text-label font-demi text-ink"
                  >
                    {group.caption}
                  </th>
                </tr>

                {group.rows.map((row) => (
                  <tr key={row.id} className="even:bg-paper/50">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 border-r border-b border-line bg-white px-3 py-1.5 text-left align-top font-medium"
                    >
                      <span className="block">{row.name}</span>
                      {row.sub ? (
                        <span className="block text-badge font-normal text-muted">
                          {row.sub}
                        </span>
                      ) : null}
                    </th>

                    {row.cells.map((cell, index) => (
                      <Cell
                        key={scope.columns[index].stageId}
                        cell={cell}
                        unitName={row.name}
                        stageName={columnTitle(scope.columns[index])}
                        onOpen={() =>
                          onOpenStage(scope.columns[index].stageId)
                        }
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Cell({
  cell,
  unitName,
  stageName,
  onOpen,
}: {
  cell: MatrixCell | null;
  unitName: string;
  stageName: string;
  onOpen: () => void;
}) {
  if (!cell) {
    return (
      <td className="border-r border-b border-line px-2 py-1.5 text-center text-muted last:border-r-0">
        <span aria-hidden="true">·</span>
        <span className="sr-only">
          {unitName} — {stageName} — {t("tidak terlibat")}
        </span>
      </td>
    );
  }

  const roleName = layout.RAS_LBL[cell.role];

  return (
    <td className="border-r border-b border-line p-0 last:border-r-0">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${unitName} — ${stageName} — ${roleName}`}
        title={cell.description}
        className="flex h-full w-full flex-col items-center gap-1 px-2 py-1.5 transition-colors hover:bg-paper"
        style={{ transitionDuration: "var(--hover-duration)" }}
      >
        <RasciBadge role={cell.role} size="sm" title={cell.description} />
        {cell.needsConfirmation ? (
          <span className="text-badge leading-none text-orange-ink">
            perlu dikonfirmasi
          </span>
        ) : null}
      </button>
    </td>
  );
}
