import { ValueChainArrow } from "@/components/level0/Connectors";
import { StageOutline } from "@/components/level0/FocusMarkers";
import {
  CONFIRMATION_LABEL,
  confirmationProps,
  dimProps,
  useMapInteraction,
} from "@/components/level0/map-focus";
import { stageNeedsConfirmation } from "@/data";
import {
  VC_ARROW_WIDTH,
  VC_FEEDBACK_HEIGHT,
  VC_STAGE_WIDTH,
  valueChainStageCenter,
  type MapModel,
} from "@/lib/layout-l0";
import { t } from "@/lib/i18n";

/**
 * Value chain — PRD 8.2 step 3: five stages joined by labelled yellow arrows,
 * with the feedback loop drawn underneath.
 */
export function ValueChain({
  valueChain,
  width,
}: {
  valueChain: MapModel["valueChain"];
  /** Inner width of the core block, so the loop lines up with the stages. */
  width: number;
}) {
  const { focus, select, confirmationLayer } = useMapInteraction();
  const { stages, links } = valueChain;
  const dimmed = dimProps(false);
  const firstCenter = valueChainStageCenter(0);
  const lastCenter = valueChainStageCenter(stages.length - 1);
  const loopY = VC_FEEDBACK_HEIGHT - 14;

  return (
    <div style={{ width }}>
      <ol className="flex items-stretch">
        {stages.map((stage, index) => (
          <li key={stage.stageId} className="contents">
            <div
              className="relative map-dim"
              data-involved={focus.stageId === stage.stageId ? "true" : "false"}
              {...confirmationProps(stageNeedsConfirmation(stage.stageId))}
              style={{ width: VC_STAGE_WIDTH }}
            >
              <StageOutline stageId={stage.stageId} />
              <button
                type="button"
                onClick={() => select("stage", stage.stageId)}
                aria-pressed={focus.stageId === stage.stageId}
                aria-label={`${t("Tahapan")} ${stage.name}${
                  confirmationLayer && stageNeedsConfirmation(stage.stageId)
                    ? ` — ${CONFIRMATION_LABEL}`
                    : ""
                } — ${t("lihat unit yang terlibat")}`}
                className="flex h-full w-full flex-col gap-1 bg-cyan px-2 py-2 text-left text-navy transition-colors hover:bg-cyan-hover"
                style={{ transitionDuration: "var(--hover-duration)" }}
              >
                <span className="text-label leading-tight font-demi">
                  {stage.name}
                </span>
                {stage.codes.length > 0 ? (
                  <span className="mt-auto text-badge font-medium text-cobalt">
                    L1 · {stage.codes.join(", ")}
                  </span>
                ) : null}
              </button>
            </div>

            {index < links.length ? (
              <div
                className={`flex flex-col items-center justify-center gap-1.5 px-2 ${dimmed.className}`}
                data-involved={dimmed["data-involved"]}
                style={{ width: VC_ARROW_WIDTH }}
              >
                <p className="text-center text-badge leading-tight text-white/85">
                  {links[index]}
                </p>
                <ValueChainArrow width={VC_ARROW_WIDTH - 24} />
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      <div
        className={`relative ${dimmed.className}`}
        data-involved={dimmed["data-involved"]}
      >
        <svg
          width={width}
          height={VC_FEEDBACK_HEIGHT}
          viewBox={`0 0 ${width} ${VC_FEEDBACK_HEIGHT}`}
          aria-hidden="true"
          className="block"
        >
          <path
            d={`M ${lastCenter} 0 V ${loopY} H ${firstCenter} V 10`}
            fill="none"
            stroke="var(--color-yellow)"
            strokeWidth="1.5"
          />
          <polygon
            points={`${firstCenter - 5},10 ${firstCenter + 5},10 ${firstCenter},0`}
            fill="var(--color-yellow)"
          />
        </svg>
        <span className="absolute inset-x-0 bottom-0 text-center text-badge text-yellow">
          <span className="bg-navy px-2">Umpan balik</span>
        </span>
      </div>
    </div>
  );
}
