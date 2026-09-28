import { Link, useParams } from "react-router";
import { Printer } from "lucide-react";
import { ProcedureDocument } from "@/components/level2/ProcedureDocument";
import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSlot,
} from "@/components/shell/Toolbar";
import { getProcedure, getProcess, proceduresForProcess } from "@/data";
import { usePrintMode } from "@/hooks/usePrintMode";
import { level1Url } from "@/lib/cross-level";
import { t } from "@/lib/i18n";

/** Level 2 — one procedure, rendered as its controlled document. */
export function Level2ProcedurePage() {
  const { procedureId = "" } = useParams();
  const { printPage } = usePrintMode();
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

      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6">
        <nav aria-label={t("Posisi prosedur")}>
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

        {siblings.length > 1 ? (
          <section aria-labelledby="siblings-title" className="flex flex-col gap-2">
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
    </>
  );
}
