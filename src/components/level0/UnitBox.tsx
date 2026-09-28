import {
  CONFIRMATION_LABEL,
  confirmationProps,
  dimProps,
  useMapInteraction,
} from "@/components/level0/map-focus";
import { participantNeedsConfirmation } from "@/data";
import { FocusBadge } from "@/components/level0/FocusMarkers";
import type { MapBox } from "@/lib/layout-l0";
import { t } from "@/lib/i18n";

/**
 * One box on the map. Every box is a real button; clicking opens the unit panel
 * by changing the URL (PRD 8.4).
 */
export function UnitBox({
  box,
  variant = "unit",
}: {
  box: MapBox;
  /** `gov` boxes sit on paper, `unit` boxes inside a navy block. */
  variant?: "unit" | "gov";
}) {
  const { focus, selected, select, confirmationLayer } = useMapInteraction();
  const isGovernance = variant === "gov";
  const needsConfirmation = participantNeedsConfirmation(box.unitId);
  const description = [box.tag, box.sub].filter(Boolean).join(" · ");
  // Short tags (SID, F&A) sit beside the name; a long one would squeeze it.
  const inlineTag = box.tag !== undefined && box.tag.length <= 6;

  const involved = focus.roles.has(box.unitId);
  const isOpen = selected?.kind === "unit" && selected.id === box.unitId;

  const surface = isGovernance
    ? "bg-navy text-white hover:bg-ink"
    : "bg-cyan text-navy hover:bg-cyan-hover";

  // Committees are drawn dashed (PRD 8.2). Kept in one expression so no two
  // border utilities compete for the same property.
  const border = box.committee
    ? `border-2 border-dashed ${isGovernance ? "border-white/70" : "border-navy/55"}`
    : `border ${isGovernance ? "border-navy" : "border-transparent"}`;

  const tagClass = `w-fit shrink-0 border px-1 text-badge leading-tight ${
    isGovernance ? "border-white/40 text-white/80" : "border-navy/30 text-navy/70"
  }`;

  const dim = dimProps(involved);

  return (
    <div
      className={`relative h-full ${dim.className}`}
      data-involved={dim["data-involved"]}
      {...confirmationProps(needsConfirmation)}
    >
      <button
        type="button"
        onClick={() => select("unit", box.unitId)}
        aria-pressed={isOpen}
        aria-label={`${box.name}${description ? ` (${description})` : ""}${
          confirmationLayer && needsConfirmation ? ` — ${CONFIRMATION_LABEL}` : ""
        } — ${t("lihat detail unit")}`}
        className={`flex h-full w-full flex-col gap-1 px-2 py-1.5 text-left transition-colors ${surface} ${border}`}
        style={{ transitionDuration: "var(--hover-duration)" }}
      >
        <span className="flex w-full items-start justify-between gap-1.5">
          <span className="text-label leading-tight font-demi">{box.name}</span>
          {box.tag !== undefined && inlineTag ? (
            <span className={tagClass}>{box.tag}</span>
          ) : null}
        </span>

        {box.tag !== undefined && !inlineTag ? (
          <span className={tagClass}>{box.tag}</span>
        ) : null}

        {box.sub ? (
          <span
            className={`text-badge leading-tight ${isGovernance ? "text-white/75" : "text-navy/75"}`}
          >
            {box.sub}
          </span>
        ) : null}

        {box.codes.length > 0 ? (
          <span
            className={`mt-auto text-badge font-medium ${
              isGovernance ? "text-cyan" : "text-cobalt"
            }`}
          >
            L1 · {box.codes.join(", ")}
          </span>
        ) : null}
      </button>

      <FocusBadge participantId={box.unitId} />
    </div>
  );
}
