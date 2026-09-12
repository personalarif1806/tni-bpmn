import { layout } from "@/data";
import type { RasciRole } from "@/data/types";

/**
 * Navy on the light fills, white on the dark ones. White on orange is 2.6:1
 * and on teal 3.3:1, both under the 4.5:1 PRD 12 asks for.
 */
const ROLE_CLASS: Record<RasciRole, string> = {
  A: "bg-rasci-a text-navy",
  R: "bg-rasci-r text-white",
  S: "bg-rasci-s text-navy",
  C: "bg-rasci-c text-navy",
  I: "bg-rasci-i text-white",
};

/**
 * RASCI role marker. The letter always carries the meaning — colour never does
 * on its own (PRD 12) — and the full role name rides along as a title.
 */
export function RasciBadge({
  role,
  size = "md",
  title,
}: {
  role: RasciRole;
  size?: "sm" | "md";
  /** Overrides the default role explanation, e.g. with a stage-specific one. */
  title?: string;
}) {
  const label = layout.RAS_LBL[role];

  return (
    <span
      title={title ?? `${role} — ${label}: ${layout.RAS_DESC[role]}`}
      className={`inline-flex shrink-0 items-center justify-center font-demi tabular-nums ${
        size === "sm" ? "h-4 w-4 text-badge" : "h-5 w-5 text-label"
      } ${ROLE_CLASS[role]}`}
    >
      <span className="sr-only">{label}: </span>
      <span aria-hidden="true">{role}</span>
    </span>
  );
}
