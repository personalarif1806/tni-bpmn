import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { Network, Printer, Printer as PrinterIcon } from "lucide-react";
import { OriginBanner } from "@/components/level1/OriginBanner";
import { ProcessHeader } from "@/components/level1/ProcessHeader";
import { ProcessInfoCard } from "@/components/level1/ProcessInfoCard";
import { ProcessSidebar } from "@/components/level1/ProcessSidebar";
import { StepTable } from "@/components/level1/StepTable";
import { Swimlane } from "@/components/level1/Swimlane";
import { ProcessSelect } from "@/components/level1/ProcessSelect";
import { PrintAllProcesses } from "@/components/shared/PrintLayout";
import { usePrintMode } from "@/hooks/usePrintMode";
import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSlot,
} from "@/components/shell/Toolbar";
import { getProcess } from "@/data";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMotionConfig } from "@/hooks/useMotionConfig";
import { parseOrigin, parseSteps } from "@/lib/cross-level";
import { LANE_HEADER_WIDTH, buildSwimlaneLayout } from "@/lib/layout-l1";
import { isOutsideViewport } from "@/lib/scroll";

const SIDEBAR_QUERY = "(min-width: 900px)";

/** Level 1 — one process: header, info card, swimlane and step table (PRD 8.8). */
export function Level1ProcessPage() {
  const { processId = "" } = useParams();
  const process = getProcess(processId);
  const [searchParams] = useSearchParams();

  // Highlight set and origin both come from the URL, so a jump is shareable
  // and Back undoes it (PRD 9).
  const highlighted = useMemo(
    () => new Set(parseSteps(searchParams.get("steps"))),
    [searchParams],
  );
  const origin = useMemo(
    () => parseOrigin(searchParams.get("from")),
    [searchParams],
  );

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const swimlaneRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const { scrollBehavior } = useMotionConfig();
  const hasSidebar = useMediaQuery(SIDEBAR_QUERY);
  const { printAll, startPrintAll, printPage } = usePrintMode();

  const layout = useMemo(
    () => (process ? buildSwimlaneLayout(process) : undefined),
    [process],
  );

  /** Node → row: highlight the step and bring its row into view. */
  const selectFromDiagram = useCallback(
    (stepKey: string) => {
      setSelectedKey(stepKey);
      const row = tableRef.current?.querySelector(
        `[data-step-key="${CSS.escape(stepKey)}"]`,
      );
      if (row && isOutsideViewport(row)) {
        row.scrollIntoView({ behavior: scrollBehavior, block: "center" });
      }
    },
    [scrollBehavior],
  );

  /**
   * Row → node: highlight it and scroll the diagram sideways only when the node
   * is actually out of sight, so the lane headers never slide away for nothing.
   */
  const selectFromTable = useCallback(
    (stepKey: string) => {
      setSelectedKey(stepKey);

      const container = swimlaneRef.current;
      const node = layout?.nodes.find((item) => item.key === stepKey);
      if (!container || !node) return;

      const visibleLeft = container.scrollLeft + LANE_HEADER_WIDTH;
      const visibleRight = container.scrollLeft + container.clientWidth;
      const isVisible =
        node.x >= visibleLeft && node.x + node.width <= visibleRight;
      if (isVisible) return;

      const target = node.cx - container.clientWidth / 2;
      const maxScroll = container.scrollWidth - container.clientWidth;
      container.scrollTo({
        left: Math.max(0, Math.min(target, maxScroll)),
        behavior: scrollBehavior,
      });
    },
    [layout, scrollBehavior],
  );

  const toolbar = (
    <ToolbarSlot>
      <ToolbarGroup>
        {hasSidebar ? null : <ProcessSelect activeId={processId} />}
        <Link
          to="/level-1"
          className="flex h-8 items-center gap-1.5 border border-line bg-white px-2.5 text-label font-medium text-ink transition-colors hover:bg-paper"
          style={{ transitionDuration: "var(--hover-duration)" }}
        >
          <Network size={14} aria-hidden="true" className="text-muted" />
          <span className="hidden sm:inline">Arsitektur</span>
        </Link>
        <ToolbarButton
          icon={<Printer size={14} />}
          label="Cetak"
          title="Cetak halaman ini"
          onClick={printPage}
        />
        <ToolbarButton
          icon={<PrinterIcon size={14} />}
          label="Cetak semua"
          title="Cetak semua proses"
          onClick={startPrintAll}
        />
      </ToolbarGroup>
    </ToolbarSlot>
  );

  if (!process || !layout) {
    return (
      <>
        {toolbar}
        <div className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-title font-demi">Proses tidak ditemukan</h1>
          <p className="mt-2 text-body text-muted">
            Kode proses “{processId}” tidak ada dalam daftar 20 proses Level 1.
          </p>
          <Link
            to="/level-1"
            className="mt-4 inline-block text-body text-cobalt hover:underline"
          >
            Lihat arsitektur proses
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {toolbar}

      {printAll ? <PrintAllProcesses /> : null}

      <div
        className={`flex items-start ${printAll ? "print:hidden" : ""}`}
      >
        {hasSidebar ? <ProcessSidebar activeId={processId} /> : null}

        <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6">
          {origin ? (
            <OriginBanner origin={origin} processId={process.id} />
          ) : null}

          <ProcessHeader process={process} />
          <ProcessInfoCard process={process} layout={layout} />

          <section aria-labelledby="swimlane-title" className="flex flex-col gap-2">
            <h2 id="swimlane-title" className="text-title font-demi">
              Alur proses
            </h2>
            <Swimlane
              layout={layout}
              selectedKey={selectedKey}
              highlighted={highlighted}
              onSelect={selectFromDiagram}
              scrollRef={swimlaneRef}
            />
          </section>

          <section aria-labelledby="steps-title" className="flex flex-col gap-2">
            <h2 id="steps-title" className="text-title font-demi">
              Uraian langkah
            </h2>
            <div ref={tableRef}>
              <StepTable
                process={process}
                layout={layout}
                selectedKey={selectedKey}
                highlighted={highlighted}
                origin={{ kind: "process", id: process.id }}
                onSelect={selectFromTable}
              />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
