import { Fragment } from "react";
import { getStage, getUnit, layout, units } from "@/data";
import {
  STANDARD_ORDER,
  TOPIC_STANDARDS,
  clauseCoverage,
  clauseTitle,
  codesFor,
  standardName,
  standardNote,
  type StandardId,
} from "@/data/clauses";
import type { UnitCategory } from "@/data/types";
import { useDetailPanel } from "@/hooks/useDetailPanel";
import { t } from "@/lib/i18n";

/** A row of the table: a stage (opens the stage panel) or a unit. */
interface Row {
  id: string;
  kind: "stage" | "unit";
  label: string;
}

interface RowGroup {
  title: string;
  /** Profit-center groups open their unit from the heading. */
  unitId?: string;
  rows: Row[];
}

/** Units below the core process, in the order the map reads them. */
const UNIT_CATEGORIES: readonly UnitCategory[] = ["gov", "strat", "qgov", "sup", "ext"];

function rowGroups(): RowGroup[] {
  const valueChain: RowGroup = {
    title: layout.CATS.vc,
    rows: layout.VC.map((id) => ({
      id,
      kind: "stage" as const,
      label: getStage(id)?.title ?? id,
    })),
  };

  const profitCenters: RowGroup[] = layout.PCS.map((pcId) => {
    const steps = getUnit(pcId)?.steps ?? [];
    return {
      title: getUnit(pcId)?.name ?? pcId,
      unitId: pcId,
      rows: steps.map((step, index) => ({
        id: `${pcId}_${index + 1}`,
        kind: "stage" as const,
        label: `${index + 1}. ${step}`,
      })),
    };
  });

  const unitGroups: RowGroup[] = UNIT_CATEGORIES.map((category) => ({
    title: layout.CATS[category],
    rows: Object.entries(units)
      .filter(([, unit]) => unit.cat === category)
      .map(([id, unit]) => ({ id, kind: "unit" as const, label: unit.name })),
  }));

  return [valueChain, ...profitCenters, ...unitGroups];
}

/** Short clause codes in a cell, each with its title on hover. */
function ClauseCodes({ elementId, standard }: { elementId: string; standard: StandardId }) {
  const codes = codesFor(elementId, standard);
  if (codes.length === 0) return <span className="text-muted/60">—</span>;

  return (
    <ul className="flex flex-wrap gap-1">
      {codes.map((code) => {
        const title = clauseTitle(standard, code);
        return (
          <li key={code}>
            <abbr
              title={TOPIC_STANDARDS.has(standard) ? undefined : title}
              className="block border border-line bg-white px-1 text-badge leading-snug tabular-nums no-underline"
            >
              {TOPIC_STANDARDS.has(standard) ? title : code}
            </abbr>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Standards compliance for Level 0: which clauses of ISO 9001, ISO 14001,
 * ISO/IEC 27001 and K-RL 550 each stage and unit carries, and — the other way
 * round — which elements carry each clause. Every name opens its panel.
 */
export function StandardsCompliance() {
  const { open } = useDetailPanel();
  const groups = rowGroups();
  /* Lane steps repeat across profit centers, so they carry their center's name. */
  const nameOf = (id: string) => {
    const stage = getStage(id);
    if (stage?.pcId) return `${getUnit(stage.pcId)?.name ?? stage.pcId} · ${stage.title}`;
    return getUnit(id)?.name ?? stage?.title ?? id;
  };
  const kindOf = (id: string): "stage" | "unit" => (getStage(id) ? "stage" : "unit");

  return (
    <div className="flex flex-col gap-6">
      {/* Coverage at a glance. */}
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {STANDARD_ORDER.map((standard) => {
          const coverage = clauseCoverage(standard);
          const byTopic = TOPIC_STANDARDS.has(standard);
          const pool = byTopic ? coverage : coverage.filter((clause) => clause.required);
          const covered = pool.filter((clause) => clause.elements.length > 0).length;
          const note = standardNote(standard);
          return (
            <li key={standard} className="flex flex-col gap-1 border border-line bg-white p-3">
              <span className="text-label font-demi text-ink">{standardName(standard)}</span>
              <span className="text-title leading-none font-demi tabular-nums text-cobalt">
                {covered}/{pool.length}
              </span>
              <span className="text-badge text-muted">
                {byTopic
                  ? t("bidang kebijakan terpetakan")
                  : t("klausul persyaratan terpetakan")}
              </span>
              {note ? (
                <span className="text-badge leading-snug text-muted italic">{note}</span>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* Clauses per stage and unit. */}
      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[56rem] border-collapse text-table">
          <caption className="sr-only">{t("Klausul standar per tahapan dan unit")}</caption>
          <thead>
            <tr className="border-b border-line bg-paper text-left">
              <th scope="col" className="w-64 px-3 py-2 font-demi">
                {t("Tahapan / unit")}
              </th>
              {STANDARD_ORDER.map((standard) => (
                <th key={standard} scope="col" className="px-3 py-2 font-demi">
                  {standardName(standard)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.title}>
                <tr className="border-b border-line bg-paper/60">
                  <th
                    scope="colgroup"
                    colSpan={STANDARD_ORDER.length + 1}
                    className="px-3 py-1.5 text-left text-badge font-demi tracking-wide text-muted"
                  >
                    {group.unitId ? (
                      <button
                        type="button"
                        onClick={() => open("unit", group.unitId!)}
                        className="hover:text-ink hover:underline"
                      >
                        {group.title}
                      </button>
                    ) : (
                      group.title
                    )}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.id} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-3 py-2 text-left align-top font-normal">
                      <button
                        type="button"
                        onClick={() => open(row.kind, row.id)}
                        className="text-left font-demi text-cobalt hover:underline"
                      >
                        {row.label}
                      </button>
                    </th>
                    {STANDARD_ORDER.map((standard) => (
                      <td key={standard} className="px-3 py-2 align-top">
                        <ClauseCodes elementId={row.id} standard={standard} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* The other way round: each clause and where it lives. */}
      <div className="flex flex-col gap-2">
        <h3 className="text-label font-demi text-ink">{t("Klausul dan pelaksananya")}</h3>
        {STANDARD_ORDER.map((standard) => (
          <details key={standard} className="border border-line bg-white">
            <summary className="cursor-pointer px-3 py-2 text-table font-demi">
              {standardName(standard)}
            </summary>
            <ul className="flex flex-col border-t border-line">
              {clauseCoverage(standard)
                .filter((clause) => clause.elements.length > 0)
                .map((clause) => (
                  <li
                    key={clause.code}
                    className="grid gap-x-3 gap-y-1 border-b border-line px-3 py-2 last:border-b-0 sm:grid-cols-[18rem_1fr]"
                  >
                    <span className="flex gap-2 text-table">
                      {TOPIC_STANDARDS.has(standard) ? null : (
                        <span className="w-12 shrink-0 font-demi tabular-nums text-cobalt">
                          {clause.code}
                        </span>
                      )}
                      <span>{clause.title}</span>
                    </span>
                    <ul className="flex flex-wrap gap-1">
                      {clause.elements.map((elementId) => (
                        <li key={elementId}>
                          <button
                            type="button"
                            onClick={() => open(kindOf(elementId), elementId)}
                            className="border border-line bg-paper px-1.5 py-0.5 text-badge text-ink transition-colors hover:bg-paper-hover"
                            style={{ transitionDuration: "var(--hover-duration)" }}
                          >
                            {nameOf(elementId)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}
