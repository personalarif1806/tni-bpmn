import {
  ConfirmationBadge,
  DraftNote,
} from "@/components/shared/PanelSection";
import { RasciBadge } from "@/components/shared/RasciBadge";
import { layout } from "@/data";
import type { ResolvedInvolvement, Stage } from "@/data/types";
import { useDetailPanel } from "@/hooks/useDetailPanel";
import { ProcessLink } from "@/components/shared/CrossLevelLink";
import { PanelSection } from "@/components/shared/PanelSection";
import { stageJumpTargets } from "@/lib/cross-level";
import { t } from "@/lib/i18n";

/** Stage panel — PRD 8.4: who is involved in one stage, grouped A → R → S → C → I. */
export function StageDetail({ stage }: { stage: Stage }) {
  const { open } = useDetailPanel();
  const jumpTargets = stageJumpTargets(stage.id);

  const byRole = layout.RAS.map((role) => ({
    role,
    rows: stage.involvement.filter((row) => row.role === role),
  })).filter((group) => group.rows.length > 0);

  const renderRow = (row: ResolvedInvolvement) => (
    <li key={`${row.role}-${row.id}`} className="flex flex-col gap-1">
      <div className="flex items-start gap-2">
        <RasciBadge role={row.role} size="sm" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {row.kind === "group" ? (
            <span className="text-table font-demi">{row.name}</span>
          ) : (
            <button
              type="button"
              onClick={() =>
                open(row.kind === "dept" ? "dept" : "unit", row.id)
              }
              className="w-fit text-left text-table font-demi text-cobalt hover:underline"
            >
              {row.name}
            </button>
          )}
          <p className="text-table text-ink/85">{row.description}</p>
        </div>
      </div>

      {row.members.length > 0 ? (
        <ul className="flex flex-wrap gap-1 pl-6">
          {row.members.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                onClick={() =>
                  open(member.kind === "dept" ? "dept" : "unit", member.id)
                }
                className="border border-line bg-paper px-1.5 py-0.5 text-badge text-ink transition-colors hover:bg-paper-hover"
                style={{ transitionDuration: "var(--hover-duration)" }}
              >
                {member.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {row.needsConfirmation ? (
        <div className="pl-6">
          <ConfirmationBadge />
        </div>
      ) : null}
    </li>
  );

  return (
    <>
      <section aria-label={t("Ringkasan peran")} className="flex flex-wrap gap-3">
        {layout.RAS.map((role) => {
          const total = stage.involvement.filter(
            (row) => row.role === role,
          ).length;
          return (
            <span
              key={role}
              className={`flex items-center gap-1.5 text-badge ${
                total === 0 ? "opacity-40" : ""
              }`}
            >
              <RasciBadge role={role} size="sm" />
              <span className="tabular-nums text-muted">
                {total} {layout.RAS_LBL[role]}
              </span>
            </span>
          );
        })}
      </section>

      {byRole.map((group) => (
        <PanelSection
          key={group.role}
          title={layout.RAS_LBL[group.role]}
          count={group.rows.length}
        >
          <p className="-mt-1 text-badge text-muted">
            {layout.RAS_DESC[group.role]}
          </p>
          <ul className="flex flex-col gap-3">{group.rows.map(renderRow)}</ul>
        </PanelSection>
      ))}

      {jumpTargets.length > 0 ? (
        <PanelSection title={t("Detail di Level 1")} count={jumpTargets.length}>
          {jumpTargets.map((target) => (
            <div key={target.processId} className="flex flex-col gap-1">
              {target.numbers.length > 0 ? (
                <p className="text-badge text-muted">
                  {t("Langkah")}{" "}
                  <span className="font-medium text-ink">
                    {target.numbers.join(", ")}
                  </span>
                </p>
              ) : null}
              <ProcessLink
                processId={target.processId}
                to={target.href}
                note={
                  target.numbers.length === 0
                    ? t("Seluruh proses merinci tahapan ini")
                    : undefined
                }
              />
            </div>
          ))}
        </PanelSection>
      ) : null}

      <DraftNote>
        {t(
          "Pembagian peran RASCI pada tahapan ini masih draft dan menunggu validasi pemilik proses.",
        )}
      </DraftNote>
    </>
  );
}
