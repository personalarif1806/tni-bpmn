import { getLane, getProcess, isNumberedStep } from "@/data";
import type { Procedure } from "@/data/types";
import { Link } from "react-router";
import { level1Url } from "@/lib/cross-level";
import { lang, LOCALE, t } from "@/lib/i18n";

/** Reads `2026-10-01` as the reader's locale would write it. */
function formatDate(iso: string, locale: string): string {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Section({
  no,
  title,
  children,
}: {
  no: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="print-avoid-break flex flex-col gap-1.5">
      <h2 className="text-label font-demi text-ink">
        <span className="text-muted tabular-nums">{no}</span> {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * A Level 2 procedure rendered as the controlled document it is: the control
 * block first, then purpose, scope, definitions, responsibilities, the work
 * instructions, the records it leaves, and what it answers to.
 *
 * The order and the numbering are the ones an assessor reads down, which is why
 * they are written out rather than derived from whatever fields happen to be
 * filled in.
 */
export function ProcedureDocument({ procedure }: { procedure: Procedure }) {
  const process = getProcess(procedure.p);
  const laneName = (laneId: string) => getLane(laneId)?.n ?? laneId;
  const locale = LOCALE[lang];

  const control: { label: string; value: string }[] = [
    { label: t("Nomor dokumen"), value: procedure.doc },
    { label: t("Revisi dokumen"), value: procedure.rev },
    { label: t("Tanggal berlaku"), value: formatDate(procedure.eff, locale) },
    { label: t("Proses induk"), value: `${procedure.p} · ${process?.name ?? ""}` },
  ];

  const signatures: { label: string; value: string }[] = [
    { label: t("Disusun oleh"), value: procedure.sign.prep },
    { label: t("Ditinjau oleh"), value: procedure.sign.rev },
    { label: t("Disetujui oleh"), value: procedure.sign.app },
  ];

  /* Only numbered steps carry a number; start and end nodes never do. */
  const detailedSteps = (process?.steps ?? [])
    .filter((step) => procedure.steps.includes(step.k))
    .map((step) => ({
      key: step.k,
      title: step.t,
      number: isNumberedStep(step) ? process?.num[step.k] : undefined,
    }));

  return (
    <article className="border border-line bg-white">
      {/* Control block — what makes this a document rather than a page. */}
      <header className="border-b border-line bg-paper px-4 py-3">
        <p className="text-badge font-demi tracking-wide text-muted uppercase">
          {t("Prosedur Level 2")}
        </p>
        <h1 className="mt-0.5 text-title leading-tight font-demi text-ink">
          {procedure.n}
        </h1>
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
          {control.map((field) => (
            <div key={field.label} className="flex flex-col gap-0.5">
              <dt className="text-badge font-medium text-muted">{field.label}</dt>
              <dd className="text-table font-medium text-ink tabular-nums">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
        <dl className="mt-3 grid gap-x-6 gap-y-2 border-t border-line pt-3 sm:grid-cols-3">
          {signatures.map((field) => (
            <div key={field.label} className="flex flex-col gap-0.5">
              <dt className="text-badge font-medium text-muted">{field.label}</dt>
              <dd className="text-table text-ink">{field.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="flex flex-col gap-5 px-4 py-4">
        <Section no="1." title={t("Tujuan")}>
          <p className="max-w-3xl text-table text-ink">{procedure.purpose}</p>
        </Section>

        <Section no="2." title={t("Ruang lingkup")}>
          <p className="max-w-3xl text-table text-ink">{procedure.scope}</p>
        </Section>

        <Section no="3." title={t("Definisi")}>
          <dl className="flex flex-col gap-1.5">
            {procedure.defs.map(([term, meaning]) => (
              <div key={term} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <dt className="shrink-0 text-table font-demi text-ink sm:w-56">
                  {term}
                </dt>
                <dd className="max-w-2xl text-table text-muted">{meaning}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section no="4." title={t("Tanggung jawab")}>
          <dl className="flex flex-col gap-1.5">
            {procedure.resp.map(([laneId, duty]) => (
              <div key={laneId} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <dt className="shrink-0 text-table font-demi text-ink sm:w-56">
                  {laneName(laneId)}
                </dt>
                <dd className="max-w-2xl text-table text-muted">{duty}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section no="5." title={t("Instruksi kerja")}>
          <div className="overflow-x-auto border border-line">
            <table className="w-full border-collapse text-table">
              <caption className="sr-only">
                {t("Instruksi kerja")} {procedure.doc}
              </caption>
              <thead>
                <tr className="border-b border-line bg-paper">
                  <th scope="col" className="w-12 px-3 py-2 text-left font-demi">
                    {t("No.")}
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-demi">
                    {t("Kegiatan")}
                  </th>
                  <th scope="col" className="w-48 px-3 py-2 text-left font-demi">
                    {t("Pelaksana")}
                  </th>
                  <th scope="col" className="w-56 px-3 py-2 text-left font-demi">
                    {t("Output / rekaman")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {procedure.wi.map((line) => (
                  <tr key={line.no} className="border-b border-line last:border-b-0">
                    <td className="px-3 py-2 align-top tabular-nums text-muted">
                      {line.no}
                    </td>
                    <td className="px-3 py-2 align-top text-ink">{line.t}</td>
                    <td className="px-3 py-2 align-top text-muted">
                      {laneName(line.l)}
                    </td>
                    <td className="px-3 py-2 align-top text-muted">
                      {line.o ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section no="6." title={t("Rekaman")}>
          <ul className="flex max-w-3xl list-disc flex-col gap-0.5 pl-5 text-table text-ink">
            {procedure.records.map((record) => (
              <li key={record}>{record}</li>
            ))}
          </ul>
        </Section>

        <Section no="7." title={t("Acuan")}>
          <ul className="flex max-w-3xl list-disc flex-col gap-0.5 pl-5 text-table text-ink">
            {procedure.refs.map((reference) => (
              <li key={reference}>{reference}</li>
            ))}
          </ul>
        </Section>

        <Section no="8." title={t("Langkah Level 1 yang dirinci")}>
          <ul className="flex flex-wrap gap-1.5">
            {detailedSteps.map((step) => (
              <li key={step.key}>
                {/* Lands on the swimlane with this step highlighted (PRD 9). */}
                <Link
                  to={level1Url(procedure.p, {
                    steps: [step.key],
                    from: { kind: "process", id: procedure.p },
                  })}
                  className="flex items-center gap-1.5 border border-line bg-white px-2 py-1 text-label text-ink transition-colors hover:bg-paper"
                  style={{ transitionDuration: "var(--hover-duration)" }}
                >
                  {step.number ? (
                    <span className="text-badge font-demi tabular-nums text-cobalt">
                      {step.number}
                    </span>
                  ) : null}
                  {step.title}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </article>
  );
}
