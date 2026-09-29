import { Link, useParams } from "react-router";
import { Printer } from "lucide-react";
import { ProcedureDocument } from "@/components/level2/ProcedureDocument";
import { ProcedureSidebar } from "@/components/level2/ProcedureSidebar";
import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSlot,
} from "@/components/shell/Toolbar";
import { getProcedure, getProcess, proceduresForProcess } from "@/data";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrintMode } from "@/hooks/usePrintMode";
import { level1Url } from "@/lib/cross-level";
import { t } from "@/lib/i18n";

/** Same breakpoint as the Level 1 process sidebar. */
const SIDEBAR_QUERY = "(min-width: 900px)";

/** Level 2 — one procedure, rendered as its controlled document. */
export function Level2ProcedurePage() {
  const { procedureId = "" } = useParams();
  const { printPage } = usePrintMode();
  const hasSidebar = useMediaQuery(SIDEBAR_QUERY);
  const procedure = getProcedure(procedureId);

  const toolbar = (
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
  );

  if (!procedure) {
    return (
      <>
        {toolbar}
        <div className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-title font-demi">{t("Prosedur tidak ditemukan")}</h1>
          <p className="mt-2 text-body text-muted">
            {t("Kode prosedur")} “{procedureId}”{" "}
            {t("tidak ada dalam daftar prosedur Level 2.")}
          </p>
          <Link
            to="/level-2"
            className="mt-4 inline-block text-body text-cobalt hover:underline"
          >
            {t("Lihat daftar prosedur")}
          </Link>
        </div>
      </>
    );
  }

  const process = getProcess(procedure.p);
  const siblings = proceduresForProcess(procedure.p);

  return (
    <>
      {toolbar}

      {/*
       * Related procedures on the left, the document on the right, as on the
       * Level 1 page. On paper only the sheets remain.
       */}
      <div className="flex items-start">
        {hasSidebar ? <ProcedureSidebar activeId={procedureId} /> : null}

        <div className="flex min-h-[calc(100dvh-var(--header-h))] min-w-0 flex-1 flex-col bg-desk print:min-h-0 print:bg-white">
          <nav
            aria-label={t("Posisi prosedur")}
            className="px-6 pt-5 print:hidden"
          >
            <ol className="flex flex-wrap items-center gap-1 text-badge text-muted">
              <li>
                <Link to="/level-2" className="hover:text-ink hover:underline">
                  {t("Prosedur Level 2")}
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li>
                <Link
                  to={level1Url(procedure.p)}
                  className="hover:text-ink hover:underline"
                >
                  {procedure.p} · {process?.name ?? procedure.p}
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li className="text-ink">{procedure.doc}</li>
            </ol>
          </nav>

          <ProcedureDocument procedure={procedure} />

          {/* Without the sidebar, the other procedures of this process follow the document. */}
          {!hasSidebar && siblings.length > 1 ? (
            <section
              aria-labelledby="siblings-title"
              className="flex flex-col gap-2 px-4 pb-8 print:hidden"
            >
              <h2 id="siblings-title" className="text-label font-demi text-ink">
                {t("Prosedur lain dalam proses ini")}
              </h2>
              <ul className="flex flex-wrap gap-1.5">
                {siblings
                  .filter((entry) => entry.id !== procedureId)
                  .map(({ id, procedure: sibling }) => (
                    <li key={id}>
                      <Link
                        to={`/level-2/${id}`}
                        className="flex items-center gap-1.5 border border-line bg-white px-2 py-1 text-label text-ink transition-colors hover:bg-paper"
                        style={{ transitionDuration: "var(--hover-duration)" }}
                      >
                        <span className="text-badge font-demi tabular-nums text-cobalt">
                          {sibling.doc}
                        </span>
                        {sibling.n}
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
