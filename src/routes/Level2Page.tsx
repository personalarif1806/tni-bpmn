import { Link } from "react-router";
import { ArrowRight, Printer } from "lucide-react";
import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSlot,
} from "@/components/shell/Toolbar";
import { proceduresForProcess, processesWithProcedures } from "@/data";
import { usePrintMode } from "@/hooks/usePrintMode";
import { GROUP_ACCENT } from "@/lib/process-groups";
import { t } from "@/lib/i18n";

/** Level 2 — the index of controlled procedures, grouped by their process. */
export function Level2Page() {
  const { printPage } = usePrintMode();
  const detailed = processesWithProcedures();

  return (
    <>
      <ToolbarSlot>
        <ToolbarGroup>
          <ToolbarButton
            icon={<Printer size={14} />}
            label={t("Cetak")}
            title={t("Cetak halaman ini")}
            onClick={printPage}
          />
        </ToolbarGroup>
      </ToolbarSlot>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-display leading-tight font-demi">
            {t("Prosedur Level 2")}
          </h1>
          <p className="max-w-3xl text-body text-muted">
            {t(
              "Dokumen terkendali yang merinci langkah Level 1 menjadi instruksi kerja. Satu prosedur menaungi satu kegiatan utuh, bukan satu kotak diagram, dan setiap langkah proses dirinci tepat oleh satu prosedur.",
            )}
          </p>
        </header>

        {detailed.length === 0 ? (
          <p className="text-body text-muted">
            {t("Belum ada proses yang dirinci sampai Level 2.")}
          </p>
        ) : null}

        {detailed.map((process) => (
          <section
            key={process.id}
            aria-labelledby={`procedures-${process.id}`}
            className="flex flex-col gap-3"
          >
            <div className="flex items-baseline gap-2">
              <span
                className={`px-1.5 py-0.5 text-badge font-demi tabular-nums ${GROUP_ACCENT[process.g].chip}`}
              >
                {process.id}
              </span>
              <h2 id={`procedures-${process.id}`} className="text-title font-demi">
                {process.name}
              </h2>
            </div>

            <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {proceduresForProcess(process.id).map(({ id, procedure }) => (
                <li key={id}>
                  <Link
                    to={`/level-2/${id}`}
                    className="flex h-full items-start gap-2 border border-line bg-white p-3 transition-colors hover:bg-paper"
                    style={{ transitionDuration: "var(--hover-duration)" }}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-badge font-demi tabular-nums text-cobalt">
                        {procedure.doc}
                      </span>
                      <span className="text-table leading-tight font-medium text-ink">
                        {procedure.n}
                      </span>
                      <span className="text-badge leading-tight text-muted">
                        {procedure.purpose}
                      </span>
                      <span className="mt-0.5 text-badge text-muted tabular-nums">
                        {t("Rev.")} {procedure.rev} · {procedure.wi.length}{" "}
                        {t("instruksi kerja")}
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
        ))}
      </div>
    </>
  );
}
