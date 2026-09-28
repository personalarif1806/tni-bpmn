import { useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DepartmentDetail } from "@/components/level0/DepartmentDetail";
import { StageDetail } from "@/components/level0/StageDetail";
import { UnitDetail } from "@/components/level0/UnitDetail";
import { DetailDrawer } from "@/components/shared/DetailDrawer";
import {
  adjacentStageId,
  getDepartment,
  getStage,
  getUnit,
  layout,
} from "@/data";
import { useDetailPanel } from "@/hooks/useDetailPanel";
import { ReturnLink } from "@/components/shared/CrossLevelLink";
import {
  originLabel,
  originUrl,
  stageJumpTargets,
  type Origin,
} from "@/lib/cross-level";
import { t } from "@/lib/i18n";

/** Is the event coming from somewhere that owns the arrow keys itself? */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

/**
 * Chooses the panel variant for whatever the URL points at, and owns stage
 * stepping — the arrow buttons and the left/right arrow keys (PRD 8.4).
 */
export function DetailPanel() {
  const { target, origin, close, replace } = useDetailPanel();

  const stageId = target?.kind === "stage" ? target.id : null;
  const previousStageId = stageId ? adjacentStageId(stageId, -1) : undefined;
  const nextStageId = stageId ? adjacentStageId(stageId, 1) : undefined;

  useEffect(() => {
    if (!stageId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return;
      }
      if (isTypingTarget(event.target)) return;

      const destination = adjacentStageId(
        stageId,
        event.key === "ArrowRight" ? 1 : -1,
      );
      if (!destination) return;

      event.preventDefault();
      // Stepping replaces the entry: Back leaves the panel, it does not walk
      // every stage the user paged through.
      replace("stage", destination);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [replace, stageId]);

  if (!target) {
    return <AnimatePresence />;
  }

  const panel = buildPanel(target);
  if (!panel) return <AnimatePresence />;

  const nav = stageId ? (
    <div className="flex shrink-0 gap-1">
      <StageStepButton
        direction="prev"
        stageId={previousStageId}
        onStep={(id) => replace("stage", id)}
      />
      <StageStepButton
        direction="next"
        stageId={nextStageId}
        onStep={(id) => replace("stage", id)}
      />
    </div>
  ) : undefined;

  return (
    <AnimatePresence>
      <DetailDrawer
        key="detail-drawer"
        eyebrow={panel.eyebrow}
        title={panel.title}
        contentKey={`${target.kind}:${target.id}`}
        nav={nav}
        onClose={close}
      >
        {origin ? <PanelReturnLink origin={origin} target={target} /> : null}
        {panel.content}
      </DetailDrawer>
    </AnimatePresence>
  );
}

/**
 * "‹ Kembali ke Level 1: {kode} {nama}" — the first row of a panel that was
 * opened as a jump from the other level (PRD 8.4). Only one level of origin is
 * stored, so this points back at exactly one place.
 */
function PanelReturnLink({
  origin,
  target,
}: {
  origin: Origin;
  target: { kind: "stage" | "unit" | "dept"; id: string };
}) {
  const label = originLabel(origin);
  if (!label) return null;

  // Returning to the process a stage expands keeps the step highlight, so the
  // round trip lands exactly where it started.
  const jumpBack =
    origin.kind === "process" && target.kind === "stage"
      ? stageJumpTargets(target.id).find(
          (item) => item.processId === origin.id,
        )?.href
      : undefined;

  return (
    <ReturnLink
      to={jumpBack ?? originUrl(origin, target)}
      label={
        origin.kind === "process"
          ? `Kembali ke Level 1: ${label.code ?? ""} ${label.title}`.replace(
              /\s+/g,
              " ",
            )
          : `Kembali ke ${label.title}`
      }
    />
  );
}

function StageStepButton({
  direction,
  stageId,
  onStep,
}: {
  direction: "prev" | "next";
  stageId: string | undefined;
  onStep: (stageId: string) => void;
}) {
  const stage = stageId ? getStage(stageId) : undefined;
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const label = direction === "prev" ? t("Tahapan sebelumnya") : t("Tahapan berikutnya");

  return (
    <button
      type="button"
      disabled={!stage}
      onClick={() => stageId && onStep(stageId)}
      aria-label={stage ? `${label}: ${stage.title}` : label}
      title={stage ? `${label}: ${stage.title}` : label}
      className="flex h-8 w-8 items-center justify-center border border-line text-muted transition-colors hover:bg-paper disabled:opacity-40"
      style={{ transitionDuration: "var(--hover-duration)" }}
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  );
}

function buildPanel(target: { kind: string; id: string }) {
  if (target.kind === "stage") {
    const stage = getStage(target.id);
    if (!stage) return null;

    const profitCenter = stage.pcId ? getUnit(stage.pcId) : undefined;
    const eyebrow =
      stage.kind === "vc"
        ? t("Tahapan value chain")
        : `${t("Langkah")} ${stage.stepIndex} · ${profitCenter?.name ?? stage.pcId}`;

    return { eyebrow, title: stage.title, content: <StageDetail stage={stage} /> };
  }

  if (target.kind === "unit") {
    const unit = getUnit(target.id);
    if (!unit) return null;

    return {
      eyebrow: layout.CATS[unit.cat],
      title: unit.name,
      content: <UnitDetail unitId={target.id} />,
    };
  }

  const department = getDepartment(target.id);
  if (!department) return null;

  return {
    eyebrow: t("Departemen"),
    title: department.n,
    content: <DepartmentDetail departmentId={target.id} />,
  };
}
