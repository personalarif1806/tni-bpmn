import { ExternalArrow } from "@/components/level0/Connectors";
import { dimProps, useMapInteraction } from "@/components/level0/map-focus";
import {
  EXTERNAL_COLUMN_WIDTH,
  type ExternalEntry,
} from "@/lib/layout-l0";

/**
 * External parties flanking the core process — PRD 8.2 step 5. Inputs on the
 * left, outputs on the right, each with a horizontal arrow.
 */
export function ExternalColumn({
  entries,
  side,
  caption,
}: {
  entries: ExternalEntry[];
  side: "left" | "right";
  caption: string;
}) {
  const { select } = useMapInteraction();
  const arrow = <ExternalArrow width={EXTERNAL_COLUMN_WIDTH} />;
  // The external columns dim together in focus mode (PRD 8.3).
  const dim = dimProps(false);

  return (
    <section
      aria-label={caption}
      className={`flex flex-col gap-5 ${dim.className}`}
      data-involved={dim["data-involved"]}
      style={{ width: EXTERNAL_COLUMN_WIDTH }}
    >
      <h2 className="border-b border-line pb-1 text-badge font-demi text-muted">
        {caption}
      </h2>

      {entries.map((entry) => (
        <article key={`${entry.unitId}-${entry.text}`} className="flex flex-col gap-1">
          {side === "right" ? arrow : null}

          <button
            type="button"
            onClick={() => select("unit", entry.unitId)}
            aria-label={`${entry.name} — lihat detail pihak eksternal`}
            className="flex flex-col gap-1 border border-teal bg-white px-2 py-1.5 text-left transition-colors hover:bg-paper"
            style={{ transitionDuration: "var(--hover-duration)" }}
          >
            <span className="text-label leading-tight font-demi text-ink">
              {entry.name}
            </span>
            {entry.sub ? (
              <span className="text-badge leading-tight text-muted">
                {entry.sub}
              </span>
            ) : null}
            <span className="border-t border-line pt-1 text-badge leading-tight text-ink/85">
              {entry.text}
            </span>
            {entry.source ? (
              <span className="text-badge leading-tight text-muted">
                Dari: {entry.source}
              </span>
            ) : null}
          </button>

          {side === "left" ? arrow : null}
        </article>
      ))}
    </section>
  );
}
