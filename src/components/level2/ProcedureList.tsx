import { Link } from "react-router";
import { ArrowRight, FileText } from "lucide-react";
import { proceduresForProcess } from "@/data";
import { t } from "@/lib/i18n";

/**
 * The procedures detailing one Level 1 process, shown on its own page so the
 * way down to Level 2 is visible from the diagram rather than only from the
 * Level 2 index. Renders nothing for a process that has no procedures yet,
 * which is most of them.
 */
export function ProcedureList({ processId }: { processId: string }) {
  const entries = proceduresForProcess(processId);
  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="procedures-title" className="flex flex-col gap-2">
      <h2 id="procedures-title" className="text-title font-demi">
        {t("Prosedur Level 2")}
      </h2>
      <p className="max-w-3xl text-body text-muted">
        {t(
          "Dokumen terkendali yang merinci langkah di atas menjadi instruksi kerja.",
        )}
      </p>

      <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {entries.map(({ id, procedure }) => (
          <li key={id}>
            <Link
              to={`/level-2/${id}`}
              className="flex h-full items-start gap-2 border border-line bg-white p-3 transition-colors hover:bg-paper"
              style={{ transitionDuration: "var(--hover-duration)" }}
            >
              <FileText
                size={14}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-muted"
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-badge font-demi tabular-nums text-cobalt">
                  {procedure.doc}
                </span>
                <span className="text-table leading-tight font-medium text-ink">
                  {procedure.n}
                </span>
                <span className="text-badge leading-tight text-muted">
                  {procedure.wi.length} {t("instruksi kerja")} ·{" "}
                  {procedure.steps.length} {t("langkah dirinci")}
                </span>
              </span>
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-cobalt"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
