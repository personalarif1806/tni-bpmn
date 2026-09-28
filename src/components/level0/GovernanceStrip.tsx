import { UnitBox } from "@/components/level0/UnitBox";
import {
  CENTER_WIDTH,
  GOVERNANCE,
  TOP_LEFT_CENTER,
  TOP_RIGHT_CENTER,
  type MapBox,
} from "@/lib/layout-l0";
import { t } from "@/lib/i18n";

/**
 * Governance strip — PRD 8.2 step 1. Two navy boxes joined by a dotted
 * coordination line, forking down into the two bands below.
 */
export function GovernanceStrip({
  boxes,
  caption,
}: {
  boxes: MapBox[];
  caption: string;
}) {
  const { boxWidth, linkWidth, offsetX, rightCenter, forkHeight } = GOVERNANCE;
  const forkMiddle = forkHeight / 2;

  return (
    <section aria-label={caption} style={{ width: CENTER_WIDTH }}>
      <div className="flex items-stretch" style={{ paddingLeft: offsetX }}>
        {boxes.map((box, index) => (
          <div key={box.unitId} className="contents">
            {index > 0 ? (
              <div
                className="flex items-center"
                style={{ width: linkWidth }}
                aria-hidden="true"
              >
                <span className="h-0 w-full border-t-2 border-dotted border-navy/60" />
              </div>
            ) : null}
            <div style={{ width: boxWidth }}>
              <UnitBox box={box} variant="gov" />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-1 text-center text-badge text-muted">
        {t("Garis koordinasi, bukan garis komando")}
      </p>

      <svg
        width={CENTER_WIDTH}
        height={forkHeight}
        viewBox={`0 0 ${CENTER_WIDTH} ${forkHeight}`}
        aria-hidden="true"
        className="block"
      >
        <line
          x1={rightCenter}
          y1="0"
          x2={rightCenter}
          y2={forkMiddle}
          stroke="var(--color-navy)"
          strokeWidth="1.5"
        />
        <line
          x1={TOP_LEFT_CENTER}
          y1={forkMiddle}
          x2={TOP_RIGHT_CENTER}
          y2={forkMiddle}
          stroke="var(--color-navy)"
          strokeWidth="1.5"
        />
        {[TOP_LEFT_CENTER, TOP_RIGHT_CENTER].map((x) => (
          <g key={x}>
            <line
              x1={x}
              y1={forkMiddle}
              x2={x}
              y2={forkHeight - 8}
              stroke="var(--color-navy)"
              strokeWidth="1.5"
            />
            <polygon
              points={`${x - 5},${forkHeight - 8} ${x + 5},${forkHeight - 8} ${x},${forkHeight}`}
              fill="var(--color-navy)"
            />
          </g>
        ))}
      </svg>
    </section>
  );
}
