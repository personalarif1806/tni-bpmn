import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { BandGroup } from "@/components/level0/BandGroup";
import { ExternalColumn } from "@/components/level0/ExternalColumn";
import { GovernanceStrip } from "@/components/level0/GovernanceStrip";
import { MapLegend } from "@/components/level0/MapLegend";
import { ProfitCenterLane } from "@/components/level0/ProfitCenterLane";
import { ValueChain } from "@/components/level0/ValueChain";
import { useMapInteraction } from "@/components/level0/map-focus";
import { layout } from "@/data";
import { useMotionConfig } from "@/hooks/useMotionConfig";
import {
  CANVAS_WIDTH,
  CENTER_OFFSET,
  CENTER_WIDTH,
  CORE_INNER_WIDTH,
  mapSizerSize,
  type MapModel,
} from "@/lib/layout-l0";
import { t } from "@/lib/i18n";

const CANVAS_PADDING = 24;
const CONTENT_WIDTH = CANVAS_WIDTH - CANVAS_PADDING * 2;

/**
 * The Level 0 map — PRD 8.2. A fixed 2040px canvas inside a scrollable,
 * zoomable viewport; the wrapper carries the scaled size so scrollbars match
 * what is on screen.
 */
export function ProcessMap({
  model,
  zoom,
  animated,
  measureRef,
}: {
  model: MapModel;
  zoom: number;
  /** Animate the zoom transform — false for resize-driven re-fits. */
  animated: boolean;
  /**
   * The element fit-to-width measures. It is the non-scrolling wrapper, never
   * the scroll container inside it: a scroll container's own scrollbar changes
   * its clientWidth, and that width is the input to the zoom that raised the
   * scrollbar in the first place.
   */
  measureRef: RefObject<HTMLDivElement | null>;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const { cssDuration } = useMotionConfig();
  const { focus, confirmationLayer } = useMapInteraction();

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const measure = () => setCanvasHeight(canvas.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={measureRef} className="map-measure border-y border-line bg-white">
      <div
        role="region"
        aria-label={t("Kanvas peta proses Level 0")}
        tabIndex={0}
        className="map-viewport overflow-auto"
      >
        <div className="map-sizer" style={mapSizerSize(canvasHeight, zoom)}>
          <div
            ref={canvasRef}
            className={`map-canvas origin-top-left ${focus.active ? "focus-mode" : ""} ${
              confirmationLayer ? "layer-confirmation" : ""
            }`}
            style={
              {
                width: CANVAS_WIDTH,
                padding: CANVAS_PADDING,
                transform: `scale(${zoom})`,
                transitionProperty: animated ? "transform" : "none",
                transitionDuration: cssDuration("zoom"),
                transitionTimingFunction: "ease-out",
                "--focus-on-duration": cssDuration("focusOn"),
                "--focus-off-duration": cssDuration("focusOff"),
              } as React.CSSProperties
            }
          >
            <div className="flex flex-col gap-5">
              <div style={{ marginLeft: CENTER_OFFSET }}>
                <GovernanceStrip
                  boxes={model.governance}
                  caption={layout.CATS.gov}
                />
              </div>

              <div className="flex gap-6" style={{ marginLeft: CENTER_OFFSET }}>
                <BandGroup band={model.strategy} />
                <BandGroup band={model.governanceQuality} />
              </div>

              <div className="flex gap-6">
                <ExternalColumn
                  entries={model.external.left}
                  side="left"
                  caption={t("Masukan dari pihak eksternal")}
                />

                <div className="bg-navy" style={{ width: CENTER_WIDTH }}>
                  <h2 className="bg-yellow px-3 py-1 text-label font-demi text-navy">
                    {model.valueChain.caption}
                  </h2>
                  <div className="px-5 py-4">
                    <ValueChain
                      valueChain={model.valueChain}
                      width={CORE_INNER_WIDTH}
                    />
                  </div>

                  <h2 className="bg-yellow px-3 py-1 text-label font-demi text-navy">
                    {model.profitCenters.caption}
                  </h2>
                  <div className="px-5 py-2">
                    {model.profitCenters.lanes.map((lane) => (
                      <ProfitCenterLane key={lane.unitId} lane={lane} />
                    ))}
                  </div>
                </div>

                <ExternalColumn
                  entries={model.external.right}
                  side="right"
                  caption={t("Keluaran ke pihak eksternal")}
                />
              </div>

              <div style={{ marginLeft: CENTER_OFFSET }}>
                <BandGroup band={model.support} />
              </div>

              <MapLegend
                width={CONTENT_WIDTH}
                showConfirmation={confirmationLayer}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
