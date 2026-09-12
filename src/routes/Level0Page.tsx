import { useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router";
import { BadgeAlert, ListChecks, Printer, Table2 } from "lucide-react";
import { DetailPanel } from "@/components/level0/DetailPanel";
import { InvolvementMatrix } from "@/components/level0/InvolvementMatrix";
import { MapInteractionProvider } from "@/components/level0/MapFocusContext";
import { ProcessMap } from "@/components/level0/ProcessMap";
import { ResponsibilityCatalog } from "@/components/level0/ResponsibilityCatalog";
import {
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  ToolbarSlot,
} from "@/components/shell/Toolbar";
import { ZoomControl } from "@/components/shell/ZoomControl";
import { useDetailPanel } from "@/hooks/useDetailPanel";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMotionConfig } from "@/hooks/useMotionConfig";
import { useStageFocus } from "@/hooks/useStageFocus";
import { useZoomToFit } from "@/hooks/useZoomToFit";
import { confirmationIndex } from "@/data";
import { CANVAS_WIDTH, MAP_FIT_GUTTER, mapModel } from "@/lib/layout-l0";
import { PANEL_SHRINK_QUERY, PANEL_WIDTH } from "@/lib/panel";
import { scrollToSection } from "@/lib/scroll";

/** Sections clear the sticky header when scrolled to. */
const SECTION_OFFSET = "scroll-mt-[calc(var(--header-h)+1rem)]";

/** Level 0 — the map, the involvement matrix and the catalogue (PRD 8.2–8.6). */
export function Level0Page() {
  const measureRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLElement>(null);
  const catalogRef = useRef<HTMLElement>(null);

  /*
   * Fit-to-width measures `measureRef`, the wrapper around the map's scroll
   * container — never the scroll container itself. Anything that scrolls can
   * lose width to its own scrollbar, and that width is the input to the zoom
   * that decides whether the scrollbar is needed at all.
   *
   * The gutter is the second guard: the map is fitted to slightly less than
   * the full width so the canvas is never the thing that raises a scrollbar.
   * It costs ~1% of map size.
   */
  const { zoom, animated, setZoom, fitToWidth } = useZoomToFit(
    measureRef,
    CANVAS_WIDTH,
    MAP_FIT_GUTTER,
  );

  const { target, open } = useDetailPanel();
  const [searchParams, setSearchParams] = useSearchParams();

  // The layer is URL state so a process owner can share the flagged view.
  // Toggling replaces the entry rather than stacking one per click.
  const confirmationLayer = searchParams.get("layer") === "confirmation";
  const toggleConfirmationLayer = useCallback(() => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (next.get("layer") === "confirmation") {
          next.delete("layer");
        } else {
          next.set("layer", "confirmation");
        }
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }, [setSearchParams]);
  const focus = useStageFocus(target?.kind === "stage" ? target.id : null);
  const { cssDuration, ease, scrollBehavior } = useMotionConfig();

  // Wide enough to sit beside the map; below this the panel overlays it.
  const shrinksForPanel = useMediaQuery(PANEL_SHRINK_QUERY);

  const interaction = useMemo(
    () => ({ focus, selected: target, select: open, confirmationLayer }),
    [confirmationLayer, focus, open, target],
  );

  const flaggedCount =
    confirmationIndex.stages.size + confirmationIndex.participants.size;

  /**
   * Matrix cells and column headers open the stage back on the map. The matrix
   * always sits below the map, and the map is taller than the viewport, so this
   * scrolls unconditionally: testing "is it visible" would pass on a sliver of
   * the map's bottom edge and leave the user looking at nothing.
   */
  const openStageOnMap = (stageId: string) => {
    open("stage", stageId);
    scrollToSection(mapRef.current, scrollBehavior);
  };

  return (
    <MapInteractionProvider value={interaction}>
      <h1 className="sr-only">
        Peta proses bisnis Level 0 — PT TÜV NORD Indonesia
      </h1>

      <ToolbarSlot>
        <ZoomControl zoom={zoom} onZoomChange={setZoom} onFit={fitToWidth} />
        <ToolbarDivider />
        <ToolbarGroup>
          <ToolbarButton
            icon={<Table2 size={14} />}
            label="Matriks"
            title="Matriks keterlibatan"
            onClick={() => scrollToSection(matrixRef.current, scrollBehavior)}
          />
          <ToolbarButton
            icon={<ListChecks size={14} />}
            label="Katalog"
            title="Katalog tugas & tanggung jawab"
            onClick={() => scrollToSection(catalogRef.current, scrollBehavior)}
          />
          <ToolbarButton
            icon={<BadgeAlert size={14} />}
            label="Status konfirmasi"
            title={`Tandai ${flaggedCount} kotak yang memuat peran belum dikonfirmasi`}
            pressed={confirmationLayer}
            onClick={toggleConfirmationLayer}
          />
          <ToolbarButton
            icon={<Printer size={14} />}
            label="Cetak"
            title="Cetak halaman ini"
            onClick={() => window.print()}
          />
        </ToolbarGroup>
      </ToolbarSlot>

      {/*
        The map gives up width rather than being covered (PRD 8.3). A margin
        transition is what the PRD prescribes here; it is one element, not the
        hundreds inside the map.
      */}
      <div
        style={{
          marginRight: target && shrinksForPanel ? PANEL_WIDTH : 0,
          transitionProperty: "margin-right",
          transitionDuration: cssDuration("panel"),
          transitionTimingFunction: `cubic-bezier(${ease.panel.join(",")})`,
        }}
      >
        <div ref={mapRef} className={SECTION_OFFSET}>
          <ProcessMap
            model={mapModel}
            zoom={zoom}
            animated={animated}
            measureRef={measureRef}
          />
        </div>

        <section
          ref={matrixRef}
          id="matriks"
          aria-labelledby="matriks-title"
          className={`px-4 pt-8 pb-4 ${SECTION_OFFSET}`}
        >
          <h2 id="matriks-title" className="text-title font-demi">
            Matriks keterlibatan
          </h2>
          <p className="mt-1 mb-3 max-w-3xl text-table text-muted">
            Peran setiap unit pada tahapan inti. Klik sel atau judul kolom untuk
            membuka tahapan tersebut di peta.
          </p>
          <InvolvementMatrix onOpenStage={openStageOnMap} />
        </section>

        <section
          ref={catalogRef}
          id="katalog"
          aria-labelledby="katalog-title"
          className={`px-4 pt-8 pb-12 ${SECTION_OFFSET}`}
        >
          <h2 id="katalog-title" className="text-title font-demi">
            Katalog tugas &amp; tanggung jawab
          </h2>
          <p className="mt-1 mb-3 max-w-3xl text-table text-muted">
            Seluruh unit Level 0 beserta peran, tugas, dan output utamanya.
          </p>
          <ResponsibilityCatalog onOpenUnit={(unitId) => open("unit", unitId)} />
        </section>
      </div>

      <DetailPanel />
    </MapInteractionProvider>
  );
}
