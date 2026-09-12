import { Link } from "react-router";
import { MapPin } from "lucide-react";
import { getUnit } from "@/data";
import type { Process } from "@/data/types";
import { processOrigin } from "@/lib/crosslinks";
import { level0Url } from "@/lib/cross-level";
import { GROUP_ACCENT } from "@/lib/process-groups";

/** Process header — PRD 8.8: code chip, breadcrumb, title, purpose, origin row. */
export function ProcessHeader({ process }: { process: Process }) {
  const origin = processOrigin(process.id);
  const breadcrumb = process.l0.split(", ");

  const back = { kind: "process" as const, id: process.id };
  const originLinks = [
    ...(origin.stageId
      ? [
          {
            to: level0Url({ kind: "stage", id: origin.stageId }, { from: back }),
            label: "Tahapan value chain",
          },
        ]
      : []),
    ...origin.unitIds.map((unitId) => ({
      to: level0Url({ kind: "unit", id: unitId }, { from: back }),
      label: getUnit(unitId)?.name ?? unitId,
    })),
  ];

  return (
    <header className="flex flex-col gap-3">
      <nav aria-label="Posisi pada Level 0">
        <ol className="flex flex-wrap items-center gap-1 text-badge text-muted">
          <li>Level 0</li>
          {breadcrumb.map((crumb) => (
            <li key={crumb} className="flex items-center gap-1">
              <span aria-hidden="true">›</span>
              {crumb}
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex flex-wrap items-baseline gap-3">
        <span
          className={`px-2 py-1 text-label font-demi tabular-nums ${GROUP_ACCENT[process.g].chip}`}
        >
          {process.id}
        </span>
        <h1 className="text-display leading-tight font-demi">{process.name}</h1>
      </div>

      <p className="max-w-4xl text-body text-ink/85">{process.purpose}</p>

      {originLinks.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <span className="text-badge font-medium text-muted">
            Posisi di Level 0
          </span>
          {originLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-1.5 border border-line bg-white px-2 py-1 text-label text-ink transition-colors hover:bg-paper"
              style={{ transitionDuration: "var(--hover-duration)" }}
            >
              <MapPin size={13} aria-hidden="true" className="text-cobalt" />
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}
