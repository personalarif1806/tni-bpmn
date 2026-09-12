import { Link } from "react-router";
import { layout, shortName, units } from "@/data";
import type { UnitCategory } from "@/data/types";
import { unitTags } from "@/lib/crosslinks";

const CATEGORY_ORDER = Object.keys(layout.CATS) as UnitCategory[];

/**
 * Responsibility catalogue — PRD 8.6. Every unit with its tasks and outputs,
 * grouped by the Level 0 categories of the map.
 */
export function ResponsibilityCatalog({
  onOpenUnit,
}: {
  onOpenUnit: (unitId: string) => void;
}) {
  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    caption: layout.CATS[category],
    entries: Object.entries(units).filter(
      ([, unit]) => unit.cat === category,
    ),
  })).filter((group) => group.entries.length > 0);

  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full border-collapse text-table">
        <caption className="sr-only">
          Katalog tugas dan tanggung jawab setiap unit Level 0
        </caption>
        <thead>
          <tr className="border-b border-line bg-white">
            <th scope="col" className="w-[19rem] px-3 py-2 text-left font-demi">
              Unit
            </th>
            <th scope="col" className="w-[17rem] px-3 py-2 text-left font-demi">
              Peran dalam proses
            </th>
            <th scope="col" className="px-3 py-2 text-left font-demi">
              Tugas dan tanggung jawab
            </th>
            <th scope="col" className="w-[15rem] px-3 py-2 text-left font-demi">
              Output utama
            </th>
          </tr>
        </thead>

        {byCategory.map((group) => (
          <tbody key={group.category}>
            <tr>
              <th
                scope="colgroup"
                colSpan={4}
                className="border-y border-line bg-paper px-3 py-1.5 text-left text-label font-demi text-ink"
              >
                {group.caption}
              </th>
            </tr>

            {group.entries.map(([unitId, unit]) => {
              const codes = unitTags(unitId);
              // Profit centers list department ids, value-chain stages list
              // plain names; `shortName` resolves the first and passes the
              // second through unchanged.
              const departmentLabels = (unit.depts ?? []).map(shortName);

              return (
                <tr key={unitId} className="border-b border-line align-top">
                  <th scope="row" className="px-3 py-2 text-left font-normal">
                    <button
                      type="button"
                      onClick={() => onOpenUnit(unitId)}
                      className="text-left text-table font-demi text-cobalt hover:underline"
                    >
                      {unit.name}
                    </button>
                    <span className="mt-0.5 block text-badge text-muted">
                      {unit.org}
                    </span>
                    {unit.std ? (
                      <span className="block text-badge text-muted">
                        {unit.std}
                      </span>
                    ) : null}
                    {unit.sys?.length ? (
                      <span className="block text-badge text-muted">
                        Sistem: {unit.sys.join(", ")}
                      </span>
                    ) : null}

                    {departmentLabels.length > 0 ? (
                      <ul className="mt-1 flex flex-wrap gap-1">
                        {departmentLabels.map((label) => (
                          <li
                            key={label}
                            className="border border-line bg-paper px-1 text-badge text-muted"
                          >
                            {label}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {codes.length > 0 ? (
                      <span className="mt-1 flex flex-wrap items-baseline gap-1 text-badge">
                        <span className="text-muted">L1 ·</span>
                        {codes.map((code) => (
                          <Link
                            key={code}
                            to={`/level-1/${code}`}
                            className="font-medium text-cobalt hover:underline"
                          >
                            {code}
                          </Link>
                        ))}
                      </span>
                    ) : null}
                  </th>

                  <td className="px-3 py-2">{unit.role}</td>

                  <td className="px-3 py-2">
                    {unit.tasks?.length ? (
                      <ul className="flex flex-col gap-1">
                        {unit.tasks.map((task) => (
                          <li
                            key={task}
                            className="flex gap-2 before:mt-[0.45rem] before:block before:h-1 before:w-1 before:shrink-0 before:bg-cyan"
                          >
                            {task}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>

                  <td className="px-3 py-2">
                    {(unit.outputs ?? unit.receives)?.length ? (
                      <ul className="flex flex-col gap-1">
                        {(unit.outputs ?? unit.receives ?? []).map((output) => (
                          <li key={output}>{output}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}
