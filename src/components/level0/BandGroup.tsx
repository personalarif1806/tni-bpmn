import { FlowArrow } from "@/components/level0/Connectors";
import { dimProps } from "@/components/level0/map-focus";
import { UnitBox } from "@/components/level0/UnitBox";
import type { MapBand } from "@/lib/layout-l0";

/**
 * A category band — PRD 8.2 steps 2 and 4: a yellow category caption over a navy
 * block of cyan unit boxes, with each box's flow labels and an arrow pointing at
 * the core process.
 */
export function BandGroup({ band }: { band: MapBand }) {
  // Flow labels are context for the core process, so they dim with everything
  // else that is not involved in the open stage (PRD 8.3).
  const dim = dimProps(false);

  const flowRow = (
    <div className={`flex gap-3 px-3 ${dim.className}`} data-involved={dim["data-involved"]}>
      {band.boxes.map((box) => (
        <div
          key={box.unitId}
          className="flex flex-1 flex-col items-center gap-1"
        >
          {band.direction === "up" ? <FlowArrow direction="up" /> : null}
          <ul className="text-center text-badge leading-tight text-muted">
            {box.flow.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
          {band.direction === "down" ? <FlowArrow direction="down" /> : null}
        </div>
      ))}
    </div>
  );

  return (
    <section
      aria-label={band.caption}
      className="flex flex-col"
      style={band.width ? { width: band.width } : undefined}
    >
      {band.direction === "up" ? flowRow : null}

      <h2 className="bg-yellow px-3 py-1 text-label font-demi text-navy">
        {band.caption}
      </h2>
      <div className="flex flex-1 gap-3 bg-navy p-3">
        {band.boxes.map((box) => (
          <div key={box.unitId} className="flex-1">
            <UnitBox box={box} />
          </div>
        ))}
      </div>

      {band.direction === "down" ? flowRow : null}
    </section>
  );
}
