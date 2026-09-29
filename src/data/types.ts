/**
 * Data model — PRD section 6.
 *
 * These types describe the JSON in this folder as it is actually shipped. The
 * content is validated against the approved org structure (No. 001/TNI/HRD/IX/2026),
 * so the types follow the data; the data is never reshaped to suit the types.
 */

/* ------------------------------------------------------------------ Level 0 */

export type RasciRole = "A" | "R" | "S" | "C" | "I";

export type UnitCategory =
  | "gov" // Direction & Oversight
  | "strat" // Strategy, Product Development & Transformation
  | "qgov" // Performance Monitoring, Quality Control & Governance
  | "vc" // Core Business Process: value chain stage
  | "pc" // Core Business Process: profit center
  | "sup" // Corporate & Business Support
  | "ext"; // External party

/** A box on the Level 0 map. Key of `l0-units.json` is the unit id. */
export interface Unit {
  name: string;
  cat: UnitCategory;
  /** Parent organisation. */
  org: string;
  /** One-sentence role. */
  role: string;
  /** Small label on the box: SID, F&A, HC, GS, CSS, NBUD, "Komite independen". */
  tag?: string;
  /** Sub-heading, used by external parties. */
  sub?: string;
  /** Drawn with a dashed border. */
  committee?: boolean;
  /** Profit centers: accreditation standard, e.g. ISO/IEC 17021-1. */
  std?: string;
  /** Profit centers: business unit. */
  bu?: string;
  sys?: string[];
  /**
   * Profit centers (`cat: "pc"`): department ids resolvable in
   * `l0-departments.json`. Value chain stages (`cat: "vc"`) instead list plain
   * display names, which is why this is not typed as a department id.
   */
  depts?: string[];
  /** Profit centers: the 6 lane steps shown on the map. */
  steps?: string[];
  /** Flow labels drawn under the box on the map. */
  flow?: string[];
  tasks?: string[];
  outputs?: string[];
  links?: string[];
  /** External parties only: what they give the company. */
  gives?: string[];
  /** External parties only: what they receive. */
  receives?: string[];
}

/** A profit-center department. Key of `l0-departments.json` is the id. */
export interface Department {
  /** Full name. */
  n: string;
  /** Short name for the chip on the map. */
  s?: string;
  /** Parent profit center. */
  pc: "cs" | "lab" | "is" | "pct";
}

/** Units that share one role in an involvement list. */
export interface UnitGroup {
  n: string;
  sub: string;
  ids: string[];
}

/**
 * One row of a stage's RASCI list:
 * `[unit | group | department id, role, role description, needs confirmation?]`.
 */
export type Involvement = [string, RasciRole, string, boolean?];

export interface StageInvolvementData {
  /** Keyed by value-chain stage id (`vc_*`). */
  vc: Record<string, Involvement[]>;
  /** `pc[profitCenterId][i]` is the list for lane step `i + 1`. */
  pc: Record<string, Involvement[][]>;
}

/** Box order and labels for the map — `l0-layout.json`. */
export interface LayoutData {
  /** Strategy band, left to right. */
  TOP_L: string[];
  /** Governance band, left to right. */
  TOP_R: string[];
  /** Corporate & Business Support band. */
  BOTTOM: string[];
  /** Value chain stages, left to right. */
  VC: string[];
  /** Labels on the arrows between the value chain stages. */
  VC_LINKS: string[];
  /** Profit center lanes, top to bottom. */
  PCS: string[];
  /** Left column: `[external unit id, input description]`. */
  EXT_L: [string, string][];
  /** Right column: `[external unit id, output description, source]`. */
  EXT_R: [string, string, string][];
  /** Category band captions. */
  CATS: Record<UnitCategory, string>;
  /** RASCI roles in display order. */
  RAS: RasciRole[];
  /** Full role names. */
  RAS_LBL: Record<RasciRole, string>;
  /** Role explanations, used in tooltips and the legend. */
  RAS_DESC: Record<RasciRole, string>;
  /** Row order for the involvement matrix. */
  RANK: string[];
}

/* ------------------------------------------------------------------ Level 1 */

export type ProcessGroupId = "M" | "G" | "C" | "S";

/** A swimlane row — key of `l1-lanes.json` is the lane id. */
export interface Lane {
  /** Performer name. */
  n: string;
  /** Parent organisation. */
  t?: string;
  /** External party: the lane header is drawn in cobalt. */
  ext?: 1;
}

/** Node kind: start, decision, end. Absent means a plain activity. */
export type StepKind = "s" | "d" | "e";

/** A next-step reference, optionally carrying a branch label. */
export type StepNext = string | [string, string];

export interface Step {
  /** Unique key within the process. */
  k: string;
  /** Lane id. */
  l: string;
  /** Column, 0-based — horizontal position. */
  c: number;
  y?: StepKind;
  /** Title. */
  t: string;
  /** Description. */
  d?: string;
  /** Output / record. */
  o?: string;
  n?: StepNext[];
}

export interface Process {
  /** M1, G2, C4.2, S3, … */
  id: string;
  g: ProcessGroupId;
  name: string;
  /** Where this process sits on the Level 0 map, as a breadcrumb string. */
  l0: string;
  owner: string;
  purpose: string;
  kpi: string[];
  sys: string[];
  /** Reference standard. */
  ref: string;
  /** Related process ids. */
  rel: string[];
  /** Lane ids, top to bottom. */
  lanes: string[];
  steps: Step[];
  /**
   * Step key → step number. Present in the JSON but recomputed at load time,
   * so a new step cannot leave stale numbering behind (PRD 6.2).
   */
  num: Record<string, string>;
  /** Draft note shown on the process page. */
  note?: string;
}

export interface ProcessGroup {
  n: string;
  /** Matching Level 0 band. */
  l0: string;
}

/* ------------------------------------------------------------------ Level 2 */

/** One numbered line of a procedure's work instructions. */
export interface WorkInstruction {
  /** `1`, `2`, `3` — the number as written, not derived. */
  no: string;
  /** What is done. */
  t: string;
  /** Lane id of the performer, resolvable in `l1-lanes.json`. */
  l: string;
  /** Output or record this line produces, where it produces one. */
  o?: string;
}

/** One row of a procedure's Revision Note(s) table (spec §8.5). */
export interface RevisionNote {
  /** Revision number, two digits. */
  rev: string;
  /** ISO `YYYY-MM-DD`. */
  date: string;
  /** Clause numbers changed, or `All`. */
  part: string;
  /** What changed. */
  note: string;
}

/**
 * A Level 2 procedure — the controlled document behind a run of Level 1 steps
 * (PRD 4, "Level 2: prosedur detail per langkah").
 *
 * A procedure covers a coherent activity rather than a single diagram box, so
 * one procedure usually details several steps. Every step of a process that has
 * procedures must be covered by exactly one of them; `validate.ts` enforces it.
 */
export interface Procedure {
  /** Parent Level 1 process id. */
  p: string;
  /**
   * Controlled document number in the PCR-TNID-01 format, `PX-TNI-YY` or
   * `PSC-SCH-TNI-YY`, e.g. `PIT-TNI-01`. See `src/lib/doc-number.ts`.
   */
  doc: string;
  /** Title. */
  n: string;
  /** Revision as written on the document, two digits, `00` for the first issue. */
  rev: string;
  /** Published date of the current revision, ISO `YYYY-MM-DD`. */
  eff: string;
  /**
   * Every revision since the first issue, oldest first; the last one is `rev`
   * and was published on `eff`.
   */
  revs: RevisionNote[];
  /** Level 1 step keys this procedure details, in step order. */
  steps: string[];
  purpose: string;
  scope: string;
  /** Term → definition. */
  defs: [string, string][];
  /** Lane id → what that performer is responsible for. */
  resp: [string, string][];
  wi: WorkInstruction[];
  /** Records the procedure leaves behind. */
  records: string[];
  /** Standards, policies and regulations the procedure answers to. */
  refs: string[];
  /**
   * Who prepares, verifies and approves — roles, never names (spec §0, §6.1).
   * They keep their official English spelling in both languages.
   */
  sign: { prep: string; rev: string; app: string };
}

/* ------------------------------------------------------------- Cross-links */

/** Which Level 0 element a Level 1 lane belongs to: a unit or a department. */
export type LaneOrigin = { u: string; d?: undefined } | { d: string; u?: undefined };

export interface CrosslinkData {
  /** Profit center id → process id. */
  PC2L1: Record<string, string>;
  /** Process id → profit center id. */
  L12PC: Record<string, string>;
  /** Value-chain stage id → process ids. */
  VC2L1: Record<string, string[]>;
  /** Process id → value-chain stage id. */
  L12VC: Record<string, string>;
  /** `STEP2L1[pcId][i]` = Level 1 step keys detailing lane step `i + 1`. */
  STEP2L1: Record<string, string[][]>;
  /** Level 0 unit → processes it owns. */
  OWN: Record<string, string[]>;
  /** Level 0 unit → Level 1 codes shown on its map box. */
  TAGS: Record<string, string[]>;
  /** Process → the Level 0 units that own it. */
  P2L0: Record<string, string[]>;
  /** Lane id → the Level 0 unit or department behind it. */
  LANE2L0: Record<string, LaneOrigin>;
  /** Department → the lanes it works in. */
  DEPT2LANES: Record<string, string[]>;
}

/* ---------------------------------------------------------- Derived shapes */

/** How an involvement row was resolved against the Level 0 catalogue. */
export type InvolvementKind = "unit" | "group" | "dept";

export interface ResolvedMember {
  id: string;
  kind: "unit" | "dept";
  name: string;
}

/** One RASCI row of a stage, resolved for display. */
export interface ResolvedInvolvement {
  /** Unit, group, or department id as written in the data. */
  id: string;
  kind: InvolvementKind;
  /** Display name of the unit, group, or department. */
  name: string;
  /** Group sub-caption, if this row is a group. */
  sub?: string;
  role: RasciRole;
  /** What this unit does at this stage. */
  description: string;
  /** Flagged in the data as still needing the process owner's confirmation. */
  needsConfirmation: boolean;
  /** For groups: the member units or departments, resolved. Empty otherwise. */
  members: ResolvedMember[];
  /**
   * Every unit and department this row covers, groups expanded. Used for focus
   * mode and the matrix; `members` is what the panel renders.
   */
  coverage: ResolvedMember[];
}

/** A clickable stage on the Level 0 map: a value-chain stage or a lane step. */
export interface Stage {
  /** `vc_del`, or `${pcId}_${n}` such as `lab_2`. */
  id: string;
  kind: "vc" | "pc";
  /** Stage title as shown on the map. */
  title: string;
  /** Profit center id — lane steps only. */
  pcId?: string;
  /** 1-based step number within the lane — lane steps only. */
  stepIndex?: number;
  involvement: ResolvedInvolvement[];
}
