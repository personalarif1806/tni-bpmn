import { Link } from "react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getProcess } from "@/data";
import { GROUP_ACCENT } from "@/lib/process-groups";

/** A button linking to a Level 1 process, with its group-coloured code chip. */
export function ProcessLink({
  processId,
  to,
  note,
}: {
  processId: string;
  to: string;
  /** Lane names or step numbers shown under the process name. */
  note?: string;
}) {
  const process = getProcess(processId);

  return (
    <Link
      to={to}
      className="flex items-start gap-2 border border-line bg-white p-1.5 transition-colors hover:bg-paper"
      style={{ transitionDuration: "var(--hover-duration)" }}
    >
      <span
        className={`shrink-0 px-1.5 py-0.5 text-badge font-demi tabular-nums ${
          process ? GROUP_ACCENT[process.g].chip : ""
        }`}
      >
        {processId}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-table font-medium text-ink">
          {process?.name ?? processId}
        </span>
        {note ? (
          <span className="text-badge leading-tight text-muted">{note}</span>
        ) : null}
      </span>
      <ArrowRight
        size={14}
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-cobalt"
      />
    </Link>
  );
}

/** The "‹ Kembali ke …" button shown when a panel or page was jumped into. */
export function ReturnLink({
  to,
  label,
  code,
}: {
  to: string;
  label: string;
  code?: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 border border-cobalt bg-white px-2 py-1.5 text-label text-cobalt transition-colors hover:bg-paper print:hidden"
      style={{ transitionDuration: "var(--hover-duration)" }}
    >
      <ArrowLeft size={14} aria-hidden="true" />
      <span className="font-medium">
        {code ? `${code} ` : ""}
        {label}
      </span>
    </Link>
  );
}
