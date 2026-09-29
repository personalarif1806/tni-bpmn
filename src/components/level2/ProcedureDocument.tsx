import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { getLane, getProcess, isNumberedStep } from "@/data";
import type { Procedure, RevisionNote, WorkInstruction } from "@/data/types";
import { useMotionConfig } from "@/hooks/useMotionConfig";
import { level1Url } from "@/lib/cross-level";
import { formatDocDate } from "@/lib/doc-number";
import { lang, LOCALE, t } from "@/lib/i18n";
import { paginate } from "@/lib/paginate";

/*
 * The standard procedure format of PCR-TNID-01 Rev.12, as written down in
 * docs/document-control-spec_PCR-TNID-01_R12.md §8: a cover, a header and
 * footer on every page, and the chapters in the order §8.4 fixes.
 *
 * The SOP prints Indonesian and English side by side. Here the app's language
 * switch already gives the reader either one, so the document is drawn in the
 * reader's language only.
 */

const ORGANISATION = "PT TÜV NORD Indonesia";

/** The chapters of spec §8.4, in order. */
const CHAPTERS = {
  objective: { no: "1", title: t("Tujuan") },
  scope: { no: "2", title: t("Ruang Lingkup") },
  definition: { no: "3", title: t("Definisi") },
  responsibility: { no: "4", title: t("Tanggung Jawab") },
  reference: { no: "5", title: t("Referensi") },
  stages: { no: "6", title: t("Tahapan Prosedur") },
  related: { no: "7", title: t("Dokumen Terkait") },
} as const;

/**
 * Pixels of slack kept at the foot of every page. Print trims the sheet by
 * half a millimetre so it cannot spill onto a blank page, and table borders
 * round differently from one row to the next; this covers both.
 */
const PAGE_SLACK = 6;

/** Page number of the block with this key, once the document is paginated. */
type PageOf = (key: string) => number | undefined;

/**
 * One unit the paginator may move to the next page. Rows are kept apart from
 * everything else because consecutive rows on a page share one table. A node
 * may need page numbers (the list of content), so it can be a function of them.
 */
type Block =
  | {
      key: string;
      kind: "node";
      node: ReactNode | ((pageOf: PageOf) => ReactNode);
      keepWithNext?: boolean;
    }
  | { key: string; kind: "row"; line: WorkInstruction };

/** Reads `2026-10-01` as the reader's locale would write it. */
function formatLongDate(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(LOCALE[lang], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ------------------------------------------------------------- Pieces */

/** Spec §8.1 / §8.2. No logo artwork ships with the app, so it is set as type. */
function Wordmark({ group = false }: { group?: boolean }) {
  return (
    <span className="text-[15px] leading-none font-demi tracking-tight text-cobalt">
      TÜV NORD{group ? " GROUP" : ""}
    </span>
  );
}

function Heading({ title, no }: { title: string; no?: string }) {
  return (
    <h2 className="pt-2.5 pb-1.5 text-[12.5px] font-demi uppercase">
      {no ? <span className="tabular-nums">{no}. </span> : null}
      {title}
    </h2>
  );
}

/**
 * Where a heading block can be reached from the list of content. Only the
 * visible sheets carry the id; the measuring sheet draws the same blocks and
 * must not duplicate it.
 */
const anchorId = (key: string) => `section-${key}`;

/** Title, a dotted leader, and what it points at — list of content, chapter 7. */
function Leader({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span>{label}</span>
      <span
        aria-hidden="true"
        className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-muted"
      />
      <span className="tabular-nums">{value}</span>
    </span>
  );
}

/* --------------------------------------------------------- Page frame */

/**
 * Spec §8.2: logo, title, and the control data an auditor checks first —
 * number, revision, published date, and which page of how many.
 */
function SheetHeader({
  procedure,
  page,
  total,
}: {
  procedure: Procedure;
  page: number;
  total: number;
}) {
  const control: [string, string][] = [
    [t("Nomor Dokumen"), procedure.doc],
    [t("Nomor Revisi"), procedure.rev],
    [t("Tanggal Penerbitan"), formatDocDate(procedure.eff)],
    [t("Halaman"), `${page} ${t("dari")} ${total}`],
  ];

  return (
    <header className="grid shrink-0 grid-cols-[34mm_1fr_60mm] border border-ink text-ink">
      <div className="flex items-center border-r border-ink px-3 py-2">
        <Wordmark />
      </div>

      <div className="flex items-center justify-center border-r border-ink px-3 py-2 text-center text-[13px] leading-snug font-demi">
        {procedure.n}
      </div>

      <dl className="grid grid-cols-[auto_1fr] text-badge">
        {control.map(([label, value], index) => (
          <div
            key={label}
            className={`col-span-2 grid grid-cols-subgrid ${
              index > 0 ? "border-t border-ink" : ""
            }`}
          >
            <dt className="border-r border-ink px-2 py-1 text-muted">{label}</dt>
            <dd className="px-2 py-1 font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}

/** Spec §8.3, in the reader's language. */
function SheetFooter() {
  return (
    <footer className="shrink-0 border-t border-ink pt-1.5 text-center text-badge text-muted italic">
      {t(
        "Dokumen ini untuk penggunaan internal PT. TÜV NORD Indonesia. Tidak terkendali bila dicetak.",
      )}
    </footer>
  );
}

/**
 * One A4 sheet, sized in millimetres so the screen shows exactly what prints;
 * the print stylesheet only takes the shadow off.
 */
function Sheet({
  header,
  bodyRef,
  children,
}: {
  header?: ReactNode;
  bodyRef?: React.Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  return (
    <div className="procedure-sheet flex h-[297mm] w-[210mm] shrink-0 flex-col bg-white px-[16mm] pt-[12mm] pb-[10mm] text-ink shadow-[0_1px_3px_rgb(0_0_0/0.12),0_8px_24px_rgb(0_0_0/0.08)]">
      {header}
      <div
        ref={bodyRef}
        className="my-[6mm] flex min-h-0 flex-1 flex-col overflow-hidden text-[12px] leading-[1.5]"
      >
        {children}
      </div>
      <SheetFooter />
    </div>
  );
}

/**
 * Spec §8.1: logo top left, the title in capitals, the identity block, and
 * TÜV NORD GROUP bottom right. Verification and approval get room to sign.
 */
function Cover({ procedure }: { procedure: Procedure }) {
  const identity: [string, string][] = [
    [t("Nama Perusahaan"), ORGANISATION],
    [t("Judul"), procedure.n],
    [t("Nomor Dokumen"), procedure.doc],
    [t("Nomor Revisi"), procedure.rev],
    [t("Tanggal Penerbitan"), formatDocDate(procedure.eff)],
    [t("Disiapkan Oleh"), procedure.sign.prep],
  ];
  const signatures: [string, string][] = [
    [t("Diperiksa Oleh"), procedure.sign.rev],
    [t("Disetujui Oleh"), procedure.sign.app],
  ];

  return (
    <Sheet>
      <Wordmark />

      <div className="mt-[40mm] text-center">
        <p className="text-label font-demi tracking-[0.14em] text-muted uppercase">
          {t("Prosedur")}
        </p>
        <h1 className="mx-auto mt-3 max-w-[150mm] text-[22px] leading-snug font-demi uppercase">
          {procedure.n}
        </h1>
      </div>

      <table className="mt-[20mm] w-full border-collapse border border-ink text-table">
        <tbody>
          {identity.map(([label, value]) => (
            <tr key={label}>
              <th
                scope="row"
                className="w-[52mm] border border-ink bg-paper px-2.5 py-1.5 text-left align-top font-demi"
              >
                {label}
              </th>
              <td className="border border-ink px-2.5 py-1.5 align-top">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="mt-[8mm] w-full table-fixed border-collapse border border-ink text-table">
        <thead>
          <tr className="bg-paper">
            {signatures.map(([label]) => (
              <th
                key={label}
                scope="col"
                className="border border-ink px-2 py-1.5 text-center font-demi"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {signatures.map(([label]) => (
              <td key={label} className="h-[22mm] border border-ink" />
            ))}
          </tr>
          <tr>
            {signatures.map(([label, role]) => (
              <td key={label} className="border border-ink px-2 py-1.5 text-center">
                {role}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="mt-auto self-end">
        <Wordmark group />
      </div>
    </Sheet>
  );
}

/* ---------------------------------------------------------- Tables */

const cell = "border border-ink px-2 py-1.5 align-top";

/**
 * Chapter 6's work instructions. Fixed column widths, so a row measures the
 * same on every page it can land on.
 */
function WorkTable({ children }: { children: ReactNode }) {
  return (
    <div className="pb-3">
      <table className="w-full table-fixed border-collapse border border-ink text-[11.5px] leading-[1.45]">
        <colgroup>
          <col className="w-[11mm]" />
          <col />
          <col className="w-[38mm]" />
          <col className="w-[42mm]" />
        </colgroup>
        <thead>
          <tr className="bg-paper text-left">
            <th scope="col" className={`${cell} font-demi`}>
              {t("No.")}
            </th>
            <th scope="col" className={`${cell} font-demi`}>
              {t("Uraian Kegiatan")}
            </th>
            <th scope="col" className={`${cell} font-demi`}>
              {t("Pelaksana")}
            </th>
            <th scope="col" className={`${cell} font-demi`}>
              {t("Output / Rekaman")}
            </th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function WorkRow({ line, index }: { line: WorkInstruction; index?: number }) {
  return (
    <tr data-block={index}>
      <td className={`${cell} tabular-nums`}>{line.no}</td>
      <td className={cell}>{line.t}</td>
      <td className={cell}>{getLane(line.l)?.n ?? line.l}</td>
      <td className={cell}>{line.o ?? "—"}</td>
    </tr>
  );
}

/** Spec §8.5. The current revision is red — unless it is the first issue. */
function RevisionTable({ revs, current }: { revs: RevisionNote[]; current: string }) {
  const headings = [
    t("No."),
    t("Nomor Revisi"),
    t("Tanggal Revisi"),
    t("Bagian"),
    t("Catatan Revisi"),
  ];

  return (
    <div className="pb-3">
      <table className="w-full table-fixed border-collapse border border-ink text-[11.5px] leading-[1.45]">
        <colgroup>
          <col className="w-[11mm]" />
          <col className="w-[25mm]" />
          <col className="w-[34mm]" />
          <col className="w-[20mm]" />
          <col />
        </colgroup>
        <thead>
          <tr className="bg-paper text-left">
            {headings.map((heading) => (
              <th key={heading} scope="col" className={`${cell} font-demi`}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {revs.map((entry, index) => {
            const changed = entry.rev === current && current !== "00";
            return (
              <tr key={entry.rev} className={changed ? "text-loop" : undefined}>
                <td className={`${cell} tabular-nums`}>{index + 1}</td>
                <td className={`${cell} tabular-nums`}>{entry.rev}</td>
                <td className={`${cell} tabular-nums`}>{formatLongDate(entry.date)}</td>
                <td className={cell}>{entry.part}</td>
                <td className={cell}>{entry.note}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------- Content */

/** Term or performer, then what it means or must do — chapters 3 and 4. */
function TermEntry({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[48mm_1fr] gap-3 pb-1.5 pl-5">
      <span className="font-demi">{term}</span>
      <span>{children}</span>
    </div>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 pb-1 pl-5">
      <span aria-hidden="true">•</span>
      <span>{children}</span>
    </div>
  );
}

/**
 * The procedure cut into blocks, in the order spec §8.4 fixes: list of content,
 * revision notes, then chapters 1 to 7.
 */
function buildBlocks(procedure: Procedure): Block[] {
  const process = getProcess(procedure.p);
  const blocks: Block[] = [];
  const node = (
    key: string,
    content: Extract<Block, { kind: "node" }>["node"],
    keepWithNext = false,
  ) => blocks.push({ key, kind: "node", node: content, keepWithNext });

  const revisionNotes = t("Catatan Revisi");
  /* Everything the list of content points at: [block key, number, title]. */
  const contents: [string, string | undefined, string][] = [
    ["h-rev", undefined, revisionNotes],
    ...Object.values(CHAPTERS).map(
      ({ no, title }) => [`h-${no}`, no, title] as [string, string, string],
    ),
  ];
  const chapter = (key: keyof typeof CHAPTERS) => {
    const { no, title } = CHAPTERS[key];
    node(`h-${no}`, <Heading no={no} title={title} />, true);
  };

  node("h-toc", <Heading title={t("Daftar Isi")} />, true);
  node("toc", (pageOf: PageOf) => (
    <div className="flex max-w-[140mm] flex-col gap-0.5 pb-3 pl-5">
      {/* Real in-page links, so they also work in the printed PDF. */}
      {contents.map(([key, no, title]) => (
        <a
          key={key}
          href={`#${anchorId(key)}`}
          data-toc-link
          className="block transition-colors hover:text-cobalt"
          style={{ transitionDuration: "var(--hover-duration)" }}
        >
          <Leader label={no ? `${no}. ${title}` : title} value={pageOf(key) ?? ""} />
        </a>
      ))}
    </div>
  ));

  node("h-rev", <Heading title={revisionNotes} />, true);
  node("revs", <RevisionTable revs={procedure.revs} current={procedure.rev} />);

  chapter("objective");
  node("purpose", <p className="pb-2 pl-5">{procedure.purpose}</p>);

  chapter("scope");
  node("scope", <p className="pb-2 pl-5">{procedure.scope}</p>);

  chapter("definition");
  procedure.defs.forEach(([term, meaning]) =>
    node(`def-${term}`, <TermEntry term={term}>{meaning}</TermEntry>),
  );

  chapter("responsibility");
  procedure.resp.forEach(([laneId, duty]) =>
    node(
      `resp-${laneId}`,
      <TermEntry term={getLane(laneId)?.n ?? laneId}>{duty}</TermEntry>,
    ),
  );

  chapter("reference");
  procedure.refs.forEach((reference) =>
    node(`ref-${reference}`, <Bullet>{reference}</Bullet>),
  );

  /* Only numbered steps carry a number; start and end nodes never do. */
  const detailedSteps = (process?.steps ?? [])
    .filter((step) => procedure.steps.includes(step.k))
    .map((step) => ({
      key: step.k,
      title: step.t,
      number: isNumberedStep(step) ? process?.num[step.k] : undefined,
    }));

  chapter("stages");
  node(
    "stages-intro",
    <div className="pb-2 pl-5">
      <p>{t("Prosedur ini merinci langkah Level 1 berikut:")}</p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {detailedSteps.map((step) => (
          <li key={step.key}>
            {/* Lands on the swimlane with this step highlighted (PRD 9). */}
            <Link
              to={level1Url(procedure.p, {
                steps: [step.key],
                from: { kind: "process", id: procedure.p },
              })}
              className="flex items-center gap-1.5 border border-line px-2 py-0.5 text-label transition-colors hover:bg-paper"
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
    </div>,
  );
  procedure.wi.forEach((line) =>
    blocks.push({ key: `wi-${line.no}`, kind: "row", line }),
  );

  /*
   * Spec §8.6. Records carry no form code yet — only CMS issues numbers
   * (spec §3.3) — so the code column says so rather than inventing one.
   */
  chapter("related");
  procedure.records.forEach((record, index) =>
    node(
      `rec-${record}`,
      <div className="max-w-[140mm] pb-1 pl-5">
        <Leader label={`${CHAPTERS.related.no}.${index + 1}  ${record}`} value="—" />
      </div>,
    ),
  );

  return blocks;
}

/** Draws one page's blocks, gathering each run of rows into one table. */
function PageBody({
  blocks,
  indices,
  pageOf,
}: {
  blocks: Block[];
  indices: number[];
  pageOf: PageOf;
}) {
  const out: ReactNode[] = [];
  let rows: WorkInstruction[] = [];

  const flushRows = () => {
    if (rows.length === 0) return;
    out.push(
      <WorkTable key={`table-${rows[0].no}`}>
        {rows.map((line) => (
          <WorkRow key={line.no} line={line} />
        ))}
      </WorkTable>,
    );
    rows = [];
  };

  for (const index of indices) {
    const block = blocks[index];
    if (block.kind === "row") {
      rows.push(block.line);
      continue;
    }
    flushRows();
    const isHeading = block.key.startsWith("h-");
    out.push(
      <div
        key={block.key}
        id={isHeading ? anchorId(block.key) : undefined}
        tabIndex={isHeading ? -1 : undefined}
        className={
          isHeading
            ? "scroll-mt-[calc(var(--header-h)+24px)] focus:outline-none"
            : undefined
        }
      >
        {typeof block.node === "function" ? block.node(pageOf) : block.node}
      </div>,
    );
  }
  flushRows();

  return <>{out}</>;
}

/* ---------------------------------------------------------- Document */

/**
 * A Level 2 procedure laid out as the controlled document PCR-TNID-01 says it
 * is: a cover, then A4 sheets each carrying the document header and footer.
 *
 * Page breaks cannot come from CSS alone — the screen has no pages — so every
 * block is first drawn once, invisibly, on a sheet of the real size, measured,
 * and then dealt out onto as many sheets as it needs. Printing prints those
 * same sheets, so what is on screen is what comes out of the printer.
 */
export function ProcedureDocument({ procedure }: { procedure: Procedure }) {
  const blocks = buildBlocks(procedure);
  const { scrollBehavior } = useMotionConfig();
  const measureRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ doc: string; pages: number[][] } | null>(
    null,
  );

  useLayoutEffect(() => {
    const measure = measureRef.current;
    const body = bodyRef.current;
    const table = tableRef.current;
    if (!measure || !body || !table) return;

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const heights = new Map<number, number>();
      measure.querySelectorAll<HTMLElement>("[data-block]").forEach((element) => {
        heights.set(Number(element.dataset.block), element.getBoundingClientRect().height);
      });

      let rowsHeight = 0;
      table.querySelectorAll<HTMLElement>("[data-block]").forEach((element) => {
        rowsHeight += element.getBoundingClientRect().height;
      });
      const tableHead = table.getBoundingClientRect().height - rowsHeight;

      const pages = paginate(
        blocks.map((block, index) => ({
          height: heights.get(index) ?? 0,
          row: block.kind === "row",
          keepWithNext: block.kind === "node" && Boolean(block.keepWithNext),
        })),
        body.clientHeight - PAGE_SLACK,
        tableHead,
      );
      setLayout({ doc: procedure.doc, pages });
    };

    run();
    /* Inter loads after first paint, and its metrics change every height. */
    document.fonts?.ready.then(run);
    return () => {
      cancelled = true;
    };
    // blocks is rebuilt every render from `procedure`; that is the real input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [procedure]);

  const pages = layout?.doc === procedure.doc ? layout.pages : null;
  /* The cover is page 1; body pages follow it. */
  const total = (pages?.length ?? 0) + 1;
  const pageByKey = new Map<string, number>();
  pages?.forEach((indices, pageIndex) =>
    indices.forEach((index) => pageByKey.set(blocks[index].key, pageIndex + 2)),
  );
  const pageOf: PageOf = (key) => pageByKey.get(key);

  const header = (page: number) => (
    <SheetHeader procedure={procedure} page={page} total={total} />
  );

  /*
   * A list-of-content click scrolls to its chapter without writing the hash
   * into the URL, which belongs to the router, and moves focus there so the
   * keyboard carries on from the chapter rather than from the list.
   */
  const followContentLink = (event: React.MouseEvent<HTMLDivElement>) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
      "a[data-toc-link]",
    );
    const target = link && document.getElementById(link.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: scrollBehavior, block: "start" });
    target.focus({ preventScroll: true });
  };

  return (
    <div
      onClick={followContentLink}
      className="procedure-desk relative flex flex-col items-center gap-6 overflow-x-auto px-6 pt-4 pb-10"
    >
      {/* Measuring sheet: every block once, at the real size, never seen. */}
      <div
        ref={measureRef}
        aria-hidden="true"
        inert
        className="pointer-events-none invisible absolute top-0 left-0 print:hidden"
      >
        <Sheet header={header(1)} bodyRef={bodyRef}>
          {blocks.map((block, index) =>
            block.kind === "node" ? (
              <div key={block.key} data-block={index}>
                {typeof block.node === "function" ? block.node(() => 0) : block.node}
              </div>
            ) : null,
          )}
          <div ref={tableRef}>
            <WorkTable>
              {blocks.map((block, index) =>
                block.kind === "row" ? (
                  <WorkRow key={block.key} line={block.line} index={index} />
                ) : null,
              )}
            </WorkTable>
          </div>
        </Sheet>
      </div>

      {pages ? (
        <>
          <Cover procedure={procedure} />
          {pages.map((indices, pageIndex) => (
            <Sheet key={pageIndex} header={header(pageIndex + 2)}>
              <PageBody blocks={blocks} indices={indices} pageOf={pageOf} />
            </Sheet>
          ))}
        </>
      ) : null}
    </div>
  );
}
