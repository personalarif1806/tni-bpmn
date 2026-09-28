import { PanelSection } from "@/components/shared/PanelSection";
import { ProcessLink } from "@/components/shared/CrossLevelLink";
import { getLane } from "@/data";
import {
  departmentToProcesses,
  unitToProcesses,
  type UnitProcesses,
} from "@/lib/crosslinks";
import { level1Url, stepKeysInLanes, type Origin } from "@/lib/cross-level";
import { t } from "@/lib/i18n";

/**
 * "Proses di Level 1" for a unit or department panel — PRD 8.4 and 9. Split
 * into the processes it owns and the ones it merely performs in, with the lane
 * names that reach it.
 */
export function ProcessLinks({ origin }: { origin: Origin }) {
  const footprint: UnitProcesses =
    origin.kind === "dept"
      ? departmentToProcesses(origin.id)
      : unitToProcesses(origin.id);

  const laneNames = (laneIds: string[]) =>
    laneIds.map((laneId) => getLane(laneId)?.n ?? laneId).join(" · ");

  const linkFor = (processId: string, laneIds: string[]) =>
    level1Url(processId, {
      steps: stepKeysInLanes(processId, laneIds),
      from: origin,
    });

  const owned = footprint.owned.map((processId) => ({
    processId,
    laneIds: footprint.involved[processId] ?? [],
  }));

  const involved = Object.entries(footprint.involved)
    .filter(([processId]) => !footprint.owned.includes(processId))
    .map(([processId, laneIds]) => ({ processId, laneIds }));

  if (owned.length === 0 && involved.length === 0) return null;

  return (
    <PanelSection title={t("Proses di Level 1")} count={owned.length + involved.length}>
      {owned.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <h4 className="text-badge font-medium text-muted">{t("Pemilik proses")}</h4>
          {owned.map((entry) => (
            <ProcessLink
              key={entry.processId}
              processId={entry.processId}
              to={linkFor(entry.processId, entry.laneIds)}
              note={
                entry.laneIds.length > 0
                  ? `${t("Lajur")}: ${laneNames(entry.laneIds)}`
                  : undefined
              }
            />
          ))}
        </div>
      ) : null}

      {involved.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <h4 className="text-badge font-medium text-muted">
            {t("Terlibat sebagai pelaksana")}
          </h4>
          {involved.map((entry) => (
            <ProcessLink
              key={entry.processId}
              processId={entry.processId}
              to={linkFor(entry.processId, entry.laneIds)}
              note={`${t("Lajur")}: ${laneNames(entry.laneIds)}`}
            />
          ))}
        </div>
      ) : null}
    </PanelSection>
  );
}
