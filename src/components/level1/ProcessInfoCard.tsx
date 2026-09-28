import { Link } from "react-router";
import { getProcess } from "@/data";
import type { Process } from "@/data/types";
import type { SwimlaneLayout } from "@/lib/layout-l1";
import { GROUP_ACCENT } from "@/lib/process-groups";
import { t } from "@/lib/i18n";

/** Info card — PRD 8.8. Trigger and outcome are read off the diagram's own nodes. */
export function ProcessInfoCard({
  process,
  layout,
}: {
  process: Process;
  layout: SwimlaneLayout;
}) {
  const trigger = process.steps.find((step) => step.y === "s")?.t;
  const outcomes = process.steps
    .filter((step) => step.y === "e")
    .map((step) => step.t);

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: t("Pemilik proses"), value: process.owner },
    { label: t("Pemicu"), value: trigger ?? "—" },
    {
      label: t("Hasil akhir"),
      value: outcomes.length > 0 ? outcomes.join(" · ") : "—",
    },
    {
      label: "KPI",
      value: (
        <ul className="flex flex-col gap-0.5">
          {process.kpi.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ),
    },
    { label: t("Sistem"), value: process.sys.join(", ") || "—" },
    { label: t("Acuan"), value: process.ref },
    {
      label: t("Unit terlibat"),
      value: layout.lanes.map((lane) => lane.name).join(" · "),
    },
  ];

  return (
    <section
      aria-label={t("Informasi proses")}
      className="border border-line bg-white"
    >
      <dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className="flex flex-col gap-0.5">
            <dt className="text-badge font-medium text-muted">{fact.label}</dt>
            <dd className="text-table text-ink">{fact.value}</dd>
          </div>
        ))}

        {process.rel.length > 0 ? (
          <div className="flex flex-col gap-1">
            <dt className="text-badge font-medium text-muted">
              {t("Proses terkait")}
            </dt>
            <dd className="flex flex-wrap gap-1.5">
              {process.rel.map((relatedId) => {
                const related = getProcess(relatedId);
                return (
                  <Link
                    key={relatedId}
                    to={`/level-1/${relatedId}`}
                    title={related?.name}
                    className={`flex items-center gap-1.5 border border-line bg-white py-0.5 pr-2 pl-0 text-label text-ink transition-colors hover:bg-paper`}
                    style={{ transitionDuration: "var(--hover-duration)" }}
                  >
                    <span
                      className={`px-1.5 py-0.5 text-badge font-demi ${
                        related ? GROUP_ACCENT[related.g].chip : ""
                      }`}
                    >
                      {relatedId}
                    </span>
                    <span className="max-w-40 truncate">{related?.name}</span>
                  </Link>
                );
              })}
            </dd>
          </div>
        ) : null}
      </dl>

      {process.note ? (
        <p className="border-t border-line bg-yellow/10 px-4 py-2 text-badge text-muted">
          {t("Catatan")}: {process.note}
        </p>
      ) : null}
    </section>
  );
}
