import { Link } from "react-router";
import { listProcessGroups } from "@/data";
import type { Process, ProcessGroupId } from "@/data/types";
import { GROUP_ACCENT, chainStages } from "@/lib/process-groups";
import { t } from "@/lib/i18n";

function ProcessBlock({ process }: { process: Process }) {
  return (
    <Link
      to={`/level-1/${process.id}`}
      className="flex w-44 flex-col gap-1 border border-line bg-white p-2 transition-colors hover:bg-paper"
      style={{ transitionDuration: "var(--hover-duration)" }}
    >
      <span
        className={`w-fit px-1.5 py-0.5 text-badge font-demi tabular-nums ${GROUP_ACCENT[process.g].chip}`}
      >
        {process.id}
      </span>
      <span className="text-label leading-tight font-medium text-ink">
        {process.name}
      </span>
      <span className="text-badge leading-tight text-muted">
        {process.owner}
      </span>
    </Link>
  );
}

function ChainArrow() {
  return (
    <svg
      width="28"
      height="12"
      viewBox="0 0 28 12"
      aria-hidden="true"
      className="shrink-0 self-center"
    >
      <line x1="0" y1="6" x2="20" y2="6" stroke="var(--color-navy)" strokeWidth="1.5" />
      <polygon points="18,1 28,6 18,11" fill="var(--color-navy)" />
    </svg>
  );
}

/** Architecture page — PRD 8.7: the four groups, with C drawn as a chain. */
export function ProcessArchitecture() {
  const groups = listProcessGroups();

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => {
        const isChain = group.id === "C";
        const stages = isChain ? chainStages(group.processes) : [];

        return (
          <section
            key={group.id}
            aria-labelledby={`group-${group.id}`}
            className={`border-l-4 bg-white p-4 ${GROUP_ACCENT[group.id as ProcessGroupId].block} border-y border-r border-y-line border-r-line`}
          >
            <h2
              id={`group-${group.id}`}
              className="mb-3 flex items-baseline gap-2 text-label font-demi text-ink"
            >
              <span className="tabular-nums">{group.id}</span>
              <span>{group.group.n}</span>
              <span className="text-badge font-normal text-muted">
                {group.processes.length} {t("proses")}
              </span>
            </h2>

            {isChain ? (
              <div className="flex flex-wrap items-center gap-1">
                {stages.map((members, index) => (
                  <div key={members[0].id} className="flex items-center gap-1">
                    {index > 0 ? <ChainArrow /> : null}
                    <div className="flex flex-col gap-1">
                      {members.map((process) => (
                        <ProcessBlock key={process.id} process={process} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {group.processes.map((process) => (
                  <ProcessBlock key={process.id} process={process} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/** Index of all 20 processes — PRD 8.7. */
export function ProcessIndexTable() {
  const groups = listProcessGroups();

  return (
    <div className="overflow-x-auto border border-line bg-white">
      <table className="w-full border-collapse text-table">
        <caption className="sr-only">{t("Daftar 20 proses Level 1")}</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="w-20 px-3 py-2 text-left font-demi">
              {t("Kode")}
            </th>
            <th scope="col" className="w-72 px-3 py-2 text-left font-demi">
              {t("Nama proses")}
            </th>
            <th scope="col" className="w-60 px-3 py-2 text-left font-demi">
              {t("Pemilik proses")}
            </th>
            <th scope="col" className="px-3 py-2 text-left font-demi">
              {t("Tujuan")}
            </th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.id}>
            <tr>
              <th
                scope="colgroup"
                colSpan={4}
                className="border-y border-line bg-paper px-3 py-1.5 text-left text-label font-demi"
              >
                {group.id} · {group.group.n}
              </th>
            </tr>
            {group.processes.map((process) => (
              <tr key={process.id} className="border-b border-line align-top">
                <th scope="row" className="px-3 py-2 text-left">
                  <Link
                    to={`/level-1/${process.id}`}
                    className="font-demi text-cobalt tabular-nums hover:underline"
                  >
                    {process.id}
                  </Link>
                </th>
                <td className="px-3 py-2 font-medium">{process.name}</td>
                <td className="px-3 py-2">{process.owner}</td>
                <td className="px-3 py-2 text-ink/85">{process.purpose}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
