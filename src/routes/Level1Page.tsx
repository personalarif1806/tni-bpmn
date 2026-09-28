import { Printer, Printer as PrinterIcon } from "lucide-react";
import {
  ProcessArchitecture,
  ProcessIndexTable,
} from "@/components/level1/ProcessArchitecture";
import { ProcessSelect } from "@/components/level1/ProcessSelect";
import { PrintAllProcesses } from "@/components/shared/PrintLayout";
import { usePrintMode } from "@/hooks/usePrintMode";
import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSlot,
} from "@/components/shell/Toolbar";
import { t } from "@/lib/i18n";

/** Level 1 — process architecture overview (PRD 8.7). */
export function Level1Page() {
  const { printAll, startPrintAll, printPage } = usePrintMode();

  return (
    <>
      <ToolbarSlot>
        <ToolbarGroup>
          <ProcessSelect activeId="" />
          <ToolbarButton
            icon={<Printer size={14} />}
            label={t("Cetak")}
            title={t("Cetak halaman ini")}
            onClick={printPage}
          />
          <ToolbarButton
            icon={<PrinterIcon size={14} />}
            label={t("Cetak semua")}
            title={t("Cetak semua proses")}
            onClick={startPrintAll}
          />
        </ToolbarGroup>
      </ToolbarSlot>

      {printAll ? <PrintAllProcesses /> : null}

      <div
        className={`mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 ${
          printAll ? "print:hidden" : ""
        }`}
      >
        <header className="flex flex-col gap-2">
          <h1 className="text-display leading-tight font-demi">
            {t("Arsitektur proses Level 1")}
          </h1>
          <p className="max-w-3xl text-body text-muted">
            {t(
              "Dua puluh proses end-to-end dalam empat kelompok. Core Business Process digambar sebagai rantai, dengan empat lajur profit center berjalan paralel pada tahap C4.",
            )}
          </p>
        </header>

        <ProcessArchitecture />

        <section aria-labelledby="index-title" className="flex flex-col gap-2">
          <h2 id="index-title" className="text-title font-demi">
            {t("Daftar proses")}
          </h2>
          <ProcessIndexTable />
        </section>
      </div>
    </>
  );
}
