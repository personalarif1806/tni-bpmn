import {
  PanelFacts,
  PanelList,
  PanelSection,
} from "@/components/shared/PanelSection";
import { RasciBadge } from "@/components/shared/RasciBadge";
import {
  departments,
  getStage,
  getUnit,
  participantStages,
  shortName,
} from "@/data";
import { useDetailPanel } from "@/hooks/useDetailPanel";
import { ProcessLinks } from "@/components/level0/ProcessLinks";
import { ClauseSection } from "@/components/shared/ClauseSection";
import { t } from "@/lib/i18n";

/** Unit panel — PRD 8.4: what a unit does and where it appears in the core process. */
export function UnitDetail({ unitId }: { unitId: string }) {
  const { open } = useDetailPanel();
  const unit = getUnit(unitId);
  const stages = participantStages(unitId);

  if (!unit) {
    return <p className="text-table text-muted">{t("Unit tidak ditemukan.")}</p>;
  }

  const facts: (readonly [string, string])[] = [
    [t("Induk organisasi"), unit.org],
    ...(unit.std ? ([[t("Standar"), unit.std]] as const) : []),
    ...(unit.bu ? ([[t("Business unit"), unit.bu]] as const) : []),
    ...(unit.sys?.length ? ([[t("Sistem"), unit.sys.join(", ")]] as const) : []),
  ];

  // Profit centers list department ids; value-chain stages list plain names.
  const departmentIds = (unit.depts ?? []).filter((id) => departments[id]);
  const departmentNames = (unit.depts ?? []).filter((id) => !departments[id]);

  return (
    <>
      <p className="text-body text-ink">{unit.role}</p>

      <PanelFacts entries={facts} />

      {unit.tasks?.length ? (
        <PanelSection title={t("Tugas dan tanggung jawab")} count={unit.tasks.length}>
          <PanelList items={unit.tasks} />
        </PanelSection>
      ) : null}

      {unit.steps?.length ? (
        <PanelSection title={t("Alur proses inti")}>
          <ol className="flex flex-col gap-1 text-table">
            {unit.steps.map((step, index) => (
              <li key={step} className="flex gap-2">
                <span className="tabular-nums text-muted">{index + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </PanelSection>
      ) : null}

      {unit.outputs?.length ? (
        <PanelSection title={t("Output utama")}>
          <PanelList items={unit.outputs} />
        </PanelSection>
      ) : null}

      {unit.gives?.length ? (
        <PanelSection title={t("Memberi ke perusahaan")}>
          <PanelList items={unit.gives} />
        </PanelSection>
      ) : null}

      {unit.receives?.length ? (
        <PanelSection title={t("Menerima dari perusahaan")}>
          <PanelList items={unit.receives} />
        </PanelSection>
      ) : null}

      {departmentIds.length > 0 ? (
        <PanelSection title={t("Departemen")} count={departmentIds.length}>
          <ul className="flex flex-wrap gap-1.5">
            {departmentIds.map((departmentId) => (
              <li key={departmentId}>
                <button
                  type="button"
                  onClick={() => open("dept", departmentId)}
                  className="border border-line bg-paper px-1.5 py-0.5 text-badge text-ink transition-colors hover:bg-paper-hover"
                  style={{ transitionDuration: "var(--hover-duration)" }}
                >
                  {shortName(departmentId)}
                </button>
              </li>
            ))}
          </ul>
        </PanelSection>
      ) : null}

      {departmentNames.length > 0 ? (
        <PanelSection title={t("Pelaksana")}>
          <PanelList items={departmentNames} />
        </PanelSection>
      ) : null}

      {stages.length > 0 ? (
        <PanelSection title={t("Peran pada tahapan core process")} count={stages.length}>
          <ul className="flex flex-col gap-2">
            {stages.map((entry) => (
              <li key={`${entry.stageId}-${entry.role}`} className="flex gap-2">
                <RasciBadge role={entry.role} size="sm" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => open("stage", entry.stageId)}
                    className="w-fit text-left text-table font-demi text-cobalt hover:underline"
                  >
                    {getStage(entry.stageId)?.title ?? entry.stageId}
                  </button>
                  <p className="text-table text-ink/85">{entry.description}</p>
                  {entry.viaGroupName ? (
                    <p className="text-badge text-muted">
                      {t("Sebagai bagian dari")} {entry.viaGroupName}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </PanelSection>
      ) : null}

      <ClauseSection elementId={unitId} />

      <ProcessLinks origin={{ kind: "unit", id: unitId }} />

      {unit.links?.length ? (
        <PanelSection title={t("Interaksi utama")}>
          <PanelList items={unit.links} />
        </PanelSection>
      ) : null}
    </>
  );
}
