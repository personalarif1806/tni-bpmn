import {
  PanelFacts,
  PanelSection,
} from "@/components/shared/PanelSection";
import { RasciBadge } from "@/components/shared/RasciBadge";
import { getDepartment, getStage, getUnit, participantStages } from "@/data";
import { useDetailPanel } from "@/hooks/useDetailPanel";
import { ProcessLinks } from "@/components/level0/ProcessLinks";

/** Department panel — PRD 8.4: parent profit center and the stages it works in. */
export function DepartmentDetail({ departmentId }: { departmentId: string }) {
  const { open } = useDetailPanel();
  const department = getDepartment(departmentId);
  const stages = participantStages(departmentId);

  if (!department) {
    return <p className="text-table text-muted">Departemen tidak ditemukan.</p>;
  }

  const profitCenter = getUnit(department.pc);

  const profitCenterLink = profitCenter ? (
    <button
      type="button"
      onClick={() => open("unit", department.pc)}
      className="text-left font-medium text-cobalt hover:underline"
    >
      {profitCenter.name}
    </button>
  ) : (
    department.pc
  );

  return (
    <>
      <PanelFacts
        entries={[
          ["Profit center", profitCenterLink],
          ...(profitCenter?.std
            ? ([["Standar", profitCenter.std]] as const)
            : []),
          ...(profitCenter?.bu ? ([["Business unit", profitCenter.bu]] as const) : []),
        ]}
      />

      {stages.length > 0 ? (
        <PanelSection title="Tahapan yang melibatkan departemen ini" count={stages.length}>
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
                      Sebagai bagian dari {entry.viaGroupName}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </PanelSection>
      ) : (
        <PanelSection title="Tahapan yang melibatkan departemen ini">
          <p className="border-l-2 border-orange bg-orange/10 px-3 py-2 text-table text-ink">
            {department.n} belum dipetakan ke tahapan mana pun pada peta Level 0.
            Pemetaan peran departemen ini masih menunggu konfirmasi pemilik
            proses.
          </p>
        </PanelSection>
      )}

      <ProcessLinks origin={{ kind: "dept", id: departmentId }} />
    </>
  );
}
