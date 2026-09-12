import type { ReactNode } from "react";

/** A titled block inside the detail panel. */
export function PanelSection({
  title,
  count,
  children,
}: {
  title: string;
  /** Optional tally shown next to the heading. */
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-baseline gap-2 border-b border-line pb-1 text-label font-demi text-ink">
        {title}
        {count !== undefined ? (
          <span className="text-badge font-medium text-muted tabular-nums">
            {count}
          </span>
        ) : null}
      </h3>
      {children}
    </section>
  );
}

/** Label/value pairs — role, standard, business unit, systems. */
export function PanelFacts({
  entries,
}: {
  entries: readonly (readonly [string, ReactNode])[];
}) {
  return (
    <dl className="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-1.5 text-table">
      {entries.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Plain bulleted list of sentences — tasks, outputs, interactions. */
export function PanelList({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-1.5 text-table">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-2 before:mt-[0.45rem] before:block before:h-1 before:w-1 before:shrink-0 before:bg-cyan"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/** The draft-status note required on stage and process views (PRD 17). */
export function DraftNote({ children }: { children: ReactNode }) {
  return (
    <p className="border-l-2 border-yellow bg-yellow/10 px-3 py-2 text-badge text-muted">
      {children}
    </p>
  );
}

/** Flag for a role the process owner still has to confirm (PRD 17). */
export function ConfirmationBadge() {
  return (
    <span className="w-fit border border-orange px-1.5 py-0.5 text-badge font-medium text-orange-ink">
      Peran perlu dikonfirmasi
    </span>
  );
}
