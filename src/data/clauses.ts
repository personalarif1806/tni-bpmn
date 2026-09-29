/**
 * Management-system clauses behind the Level 0 map.
 *
 * `l0-clauses.json` holds two things: a dictionary of the clauses each standard
 * requires, with their official titles in both languages, and the mapping from
 * every Level 0 element — value-chain stage, profit-center lane step, unit or
 * external party — to the clauses it carries.
 *
 * Titles are stored as language pairs rather than in `translations.json`: they
 * are the standards' own wording, fixed by ISO, and never edited as prose.
 *
 * The rule `clauses.test.ts` enforces is coverage: every clause marked `req`
 * must be carried by at least one element, so the map cannot quietly drop a
 * requirement an auditor will ask about.
 */
import clausesJson from "./l0-clauses.json";
import { pick, type Lang } from "@/lib/i18n";

export type StandardId = "iso9001" | "iso14001" | "iso27001" | "krl550";

/** Column order everywhere the standards are listed side by side. */
export const STANDARD_ORDER: readonly StandardId[] = [
  "iso9001",
  "iso14001",
  "iso27001",
  "krl550",
];

/**
 * K-RL 550 is mapped by subject area: its text is not in the project, so its
 * "clauses" are topic keys, not section numbers, and are shown without a code.
 */
export const TOPIC_STANDARDS: ReadonlySet<StandardId> = new Set(["krl550"]);

interface ClauseEntry extends Record<Lang, string> {
  /** Required at Level 0: at least one element must carry it. */
  req?: boolean;
}

interface StandardEntry {
  n: string;
  note?: Record<Lang, string>;
  clauses: Record<string, ClauseEntry>;
}

export interface ClauseData {
  standards: Record<StandardId, StandardEntry>;
  /** Element id → standard → clause codes. */
  map: Record<string, Partial<Record<StandardId, string[]>>>;
}

export const clauseData = clausesJson as ClauseData;

export interface ClauseRef {
  code: string;
  title: string;
}

export interface ElementClauses {
  standard: StandardId;
  name: string;
  note?: string;
  clauses: ClauseRef[];
}

/** Clause codes in the order the standard lists them. */
function inStandardOrder(standard: StandardId, codes: readonly string[]): string[] {
  const order = Object.keys(clauseData.standards[standard].clauses);
  return [...codes].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export function standardName(standard: StandardId): string {
  return clauseData.standards[standard].n;
}

export function standardNote(standard: StandardId): string | undefined {
  const note = clauseData.standards[standard].note;
  return note ? pick(note) : undefined;
}

export function clauseTitle(standard: StandardId, code: string): string {
  const entry = clauseData.standards[standard].clauses[code];
  return entry ? pick(entry) : code;
}

/** The clauses one element carries, grouped by standard, empty standards left out. */
export function clausesFor(elementId: string): ElementClauses[] {
  const mapped = clauseData.map[elementId] ?? {};
  return STANDARD_ORDER.flatMap((standard) => {
    const codes = mapped[standard] ?? [];
    if (codes.length === 0) return [];
    return [
      {
        standard,
        name: standardName(standard),
        note: standardNote(standard),
        clauses: inStandardOrder(standard, codes).map((code) => ({
          code,
          title: clauseTitle(standard, code),
        })),
      },
    ];
  });
}

/** Clause codes one element carries for one standard, in standard order. */
export function codesFor(elementId: string, standard: StandardId): string[] {
  return inStandardOrder(standard, clauseData.map[elementId]?.[standard] ?? []);
}

export interface ClauseCoverage extends ClauseRef {
  required: boolean;
  /** Element ids carrying the clause, in map order. */
  elements: string[];
}

/** Every clause of a standard with the elements carrying it — the reverse view. */
export function clauseCoverage(standard: StandardId): ClauseCoverage[] {
  return Object.entries(clauseData.standards[standard].clauses).map(
    ([code, entry]) => ({
      code,
      title: pick(entry),
      required: Boolean(entry.req),
      elements: Object.entries(clauseData.map)
        .filter(([, mapped]) => mapped[standard]?.includes(code))
        .map(([elementId]) => elementId),
    }),
  );
}
