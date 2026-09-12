import { Link } from "react-router";
import type { Process } from "@/data/types";
import { getL0StepRef } from "@/lib/crosslinks";
import { level0Url, type Origin } from "@/lib/cross-level";
import type { SwimlaneLayout } from "@/lib/layout-l1";

const KIND_LABEL: Record<string, string> = {
  s: "Pemicu",
  d: "Keputusan",
  e: "Hasil akhir",
};

/**
 * Step table — PRD 8.8. Mirrors the diagram row for row, and the last column
 * links each step back to the Level 0 lane step it details.
 */
export function StepTable({
  process,
  layout,
  selectedKey,
  highlighted,
  origin,
  onSelect,
}: {
  process: Process;
  layout: SwimlaneLayout;
  selectedKey: string | null;
  highlighted: ReadonlySet<string>;
  /** Carried into the Level 0 links so the user can come back (PRD 9). */
  origin: Origin;
  onSelect: (stepKey: string) => void;
}) {
  const laneName = (laneId: string) =>
    layout.lanes.find((lane) => lane.id === laneId)?.name ?? laneId;

  return (
    <div className="overflow-x-auto border border-line bg-white">
      <table className="w-full border-collapse text-table">
        <caption className="sr-only">
          Uraian langkah proses {process.id} {process.name}
        </caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="w-24 px-3 py-2 text-left font-demi">
              Nomor
            </th>
            <th scope="col" className="w-56 px-3 py-2 text-left font-demi">
              Aktivitas
            </th>
            <th scope="col" className="w-44 px-3 py-2 text-left font-demi">
              Pelaksana
            </th>
            <th scope="col" className="px-3 py-2 text-left font-demi">
              Uraian
            </th>
            <th scope="col" className="w-52 px-3 py-2 text-left font-demi">
              Output / rekaman
            </th>
            <th scope="col" className="w-48 px-3 py-2 text-left font-demi">
              Di Level 0
            </th>
          </tr>
        </thead>
        <tbody>
          {process.steps.map((step) => {
            const isSelected = step.k === selectedKey;
            const isHighlighted = highlighted.has(step.k);
            const level0 = getL0StepRef(process.id, step.k);

            return (
              <tr
                key={step.k}
                data-step-key={step.k}
                aria-selected={isSelected}
                onClick={() => onSelect(step.k)}
                className={`scroll-mt-[calc(var(--header-h)+1rem)] border-b border-line align-top ${
                  isSelected
                    ? "bg-yellow/25"
                    : isHighlighted
                      ? "bg-orange/10"
                      : "even:bg-paper/60"
                }`}
              >
                <th scope="row" className="px-3 py-2 text-left font-normal">
                  <button
                    type="button"
                    onClick={() => onSelect(step.k)}
                    aria-pressed={isSelected}
                    aria-label={`Sorot langkah ${step.t} pada diagram`}
                    className="text-left font-demi text-cobalt tabular-nums hover:underline"
                  >
                    {process.num[step.k] ?? KIND_LABEL[step.y ?? ""] ?? "—"}
                  </button>
                </th>
                <td className="px-3 py-2 font-medium">{step.t}</td>
                <td className="px-3 py-2">{laneName(step.l)}</td>
                <td className="px-3 py-2 text-ink/85">{step.d ?? "—"}</td>
                <td className="px-3 py-2">{step.o ?? "—"}</td>
                <td className="px-3 py-2">
                  {level0 ? (
                    <Link
                      to={level0Url(
                        { kind: "stage", id: level0.stageId },
                        { from: origin },
                      )}
                      className="text-cobalt hover:underline"
                    >
                      {level0.stepIndex}. {level0.title}
                    </Link>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
