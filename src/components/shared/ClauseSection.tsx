import { PanelSection } from "@/components/shared/PanelSection";
import { TOPIC_STANDARDS, clausesFor } from "@/data/clauses";
import { t } from "@/lib/i18n";

/**
 * The management-system clauses one Level 0 element carries, grouped by
 * standard. Shared by the stage and the unit panel; renders nothing for an
 * element with no mapping.
 */
export function ClauseSection({ elementId }: { elementId: string }) {
  const groups = clausesFor(elementId);
  if (groups.length === 0) return null;

  const total = groups.reduce((sum, group) => sum + group.clauses.length, 0);

  return (
    <PanelSection title={t("Klausul standar terkait")} count={total}>
      <div className="flex flex-col gap-3">
        {groups.map((group) => {
          const byTopic = TOPIC_STANDARDS.has(group.standard);
          return (
            <div key={group.standard} className="flex flex-col gap-1">
              <p className="text-badge font-demi tracking-wide text-muted">
                {group.name}
              </p>
              <ul className="flex flex-col gap-1 text-table">
                {group.clauses.map((clause) => (
                  <li key={clause.code} className="flex gap-2">
                    {byTopic ? (
                      <span aria-hidden="true" className="w-12 shrink-0 text-cobalt">
                        •
                      </span>
                    ) : (
                      <span className="w-12 shrink-0 font-demi tabular-nums text-cobalt">
                        {clause.code}
                      </span>
                    )}
                    <span className="min-w-0">{clause.title}</span>
                  </li>
                ))}
              </ul>
              {group.note ? (
                <p className="text-badge leading-snug text-muted italic">{group.note}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </PanelSection>
  );
}
