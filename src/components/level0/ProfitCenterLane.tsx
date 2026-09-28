import { FocusBadge, StageOutline } from "@/components/level0/FocusMarkers";
import {
  CONFIRMATION_LABEL,
  confirmationProps,
  dimProps,
  useMapInteraction,
} from "@/components/level0/map-focus";
import {
  participantNeedsConfirmation,
  stageNeedsConfirmation,
} from "@/data";
import {
  PC_HEADER_WIDTH,
  PC_STEPS_WIDTH,
  type ProfitCenterLaneModel,
} from "@/lib/layout-l0";
import { t } from "@/lib/i18n";

/**
 * One profit-center lane — PRD 8.2 step 3: header box, six numbered steps, and
 * the department chips underneath.
 */
export function ProfitCenterLane({ lane }: { lane: ProfitCenterLaneModel }) {
  const { focus, selected, select, confirmationLayer } = useMapInteraction();
  const meta = [lane.std, lane.bu].filter(Boolean);

  const headerDim = dimProps(focus.roles.has(lane.unitId));
  const headerNeedsConfirmation = participantNeedsConfirmation(lane.unitId);

  /** Appended to a label so the tint is never the only signal. */
  const confirmationSuffix = (needsConfirmation: boolean) =>
    confirmationLayer && needsConfirmation ? ` — ${CONFIRMATION_LABEL}` : "";

  return (
    <section
      aria-label={`${t("Lajur")} ${lane.name}`}
      className="flex gap-4 border-t border-white/15 py-3 first:border-t-0"
    >
      <div
        className={`relative ${headerDim.className}`}
        data-involved={headerDim["data-involved"]}
        {...confirmationProps(headerNeedsConfirmation)}
        style={{ width: PC_HEADER_WIDTH }}
      >
        <button
          type="button"
          onClick={() => select("unit", lane.unitId)}
          aria-pressed={selected?.kind === "unit" && selected.id === lane.unitId}
          aria-label={`${lane.name}${lane.std ? `, ${lane.std}` : ""}${confirmationSuffix(headerNeedsConfirmation)} — ${t("lihat detail unit")}`}
          className="flex h-full w-full flex-col gap-1 bg-cyan px-2.5 py-2 text-left text-navy transition-colors hover:bg-cyan-hover"
          style={{ transitionDuration: "var(--hover-duration)" }}
        >
          <span className="text-body leading-tight font-demi">{lane.name}</span>
          {meta.map((line) => (
            <span key={line} className="text-badge leading-tight text-navy/80">
              {line}
            </span>
          ))}
          {lane.sys.length > 0 ? (
            <span className="text-badge leading-tight text-navy/80">
              {lane.sys.join(" · ")}
            </span>
          ) : null}
          {lane.codes.length > 0 ? (
            <span className="mt-auto text-badge font-medium text-cobalt">
              L1 · {lane.codes.join(", ")}
            </span>
          ) : null}
        </button>

        <FocusBadge participantId={lane.unitId} />
      </div>

      <div className="flex flex-col gap-2" style={{ width: PC_STEPS_WIDTH }}>
        <ol className="flex gap-3">
          {lane.steps.map((step) => {
            const isOpen = focus.stageId === step.stageId;
            const stepNeedsConfirmation = stageNeedsConfirmation(step.stageId);
            return (
              <li
                key={step.stageId}
                className="relative flex-1 map-dim"
                data-involved={isOpen ? "true" : "false"}
                {...confirmationProps(stepNeedsConfirmation)}
              >
                <StageOutline stageId={step.stageId} />
                <button
                  type="button"
                  onClick={() => select("stage", step.stageId)}
                  aria-pressed={isOpen}
                  aria-label={`${t("Langkah")} ${step.index}, ${step.title}, ${lane.name}${confirmationSuffix(stepNeedsConfirmation)} — ${t("lihat unit yang terlibat")}`}
                  className="flex h-full w-full flex-col gap-1 border border-line bg-paper px-2 py-1.5 text-left text-ink transition-colors hover:bg-paper-hover"
                  style={{ transitionDuration: "var(--hover-duration)" }}
                >
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-badge font-demi tabular-nums text-muted">
                      {step.index}
                    </span>
                    <span className="text-label leading-tight font-medium">
                      {step.title}
                    </span>
                  </span>
                  {step.range ? (
                    <span className="mt-auto text-badge font-medium text-cobalt">
                      {step.range}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>

        <ul className="flex flex-wrap gap-1.5">
          {lane.chips.map((chip) => {
            const chipDim = dimProps(focus.roles.has(chip.id));
            const chipNeedsConfirmation = participantNeedsConfirmation(chip.id);
            return (
              <li
                key={chip.id}
                className={`relative ${chipDim.className}`}
                data-involved={chipDim["data-involved"]}
                {...confirmationProps(chipNeedsConfirmation)}
              >
                <button
                  type="button"
                  onClick={() => select("dept", chip.id)}
                  aria-pressed={
                    selected?.kind === "dept" && selected.id === chip.id
                  }
                  aria-label={`${t("Departemen")} ${chip.label}, ${lane.name}${confirmationSuffix(chipNeedsConfirmation)} — ${t("lihat detail departemen")}`}
                  className="flex items-center gap-1 border border-white/25 bg-white/10 px-1.5 py-0.5 text-badge text-white transition-colors hover:bg-white/20"
                  style={{ transitionDuration: "var(--hover-duration)" }}
                >
                  <FocusBadge participantId={chip.id} placement="inline" />
                  {chip.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
