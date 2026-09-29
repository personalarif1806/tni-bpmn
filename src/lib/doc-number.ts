/**
 * Controlled document numbers, as PCR-TNID-01 Rev.12 §6.1 defines them.
 *
 * The rules are written out in `docs/document-control-spec_PCR-TNID-01_R12.md`
 * (§1–§3); this module is that text made checkable, so the validator can refuse
 * a number the Document Control Procedure would not issue. When CMS revises the
 * procedure, change the tables here and the spec together.
 *
 * Every code is case-sensitive — `En` and `EnA` are scheme codes, `EN` is not.
 */

/** The company code in every number. */
export const COMPANY = "TNI";

/** X — supporting departments (spec §2.1). */
export const DEPARTMENT_CODES = {
  CR: "Corporate",
  HSE: "CMS",
  HR: "HRD",
  GA: "GA",
  TFN: "Transformation",
  IM: "Improvement",
  IT: "Information System",
  PRO: "Procurement",
  FN: "Finance",
  ACC: "Accounting",
  BD: "Business Development",
  MC: "Marketing Communication",
  SP: "Strategic Partnership",
  DT: "Digital Transformation",
  LG: "Legal",
  CO: "Compliance",
  DI: "Data Insight",
} as const;

/** X — business units (spec §2.2). `IS` here is Inspection, not the scheme. */
export const BUSINESS_UNIT_CODES = {
  SC: "System Certification",
  LAB: "Laboratorium (semua area)",
  TEST: "Laboratorium pengujian",
  CAL: "Laboratorium kalibrasi",
  PC: "Product Certification",
  PT: "Product Testing",
  SPC: "Skema Sertifikasi",
  IS: "Inspection",
  TR: "Training / TÜV NORD Academy",
} as const;

export const X_CODES = { ...DEPARTMENT_CODES, ...BUSINESS_UNIT_CODES };
export type XCode = keyof typeof X_CODES;

/** SCH — scheme codes, used only in `PSC-SCH-TNI-YY` (spec §2.2). */
export const SCS_SCHEME_CODES = {
  INT: "Integrated Management System",
  Q: "Quality Management System",
  E: "Environmental Management System",
  F: "Food Safety Management System",
  T: "Tourism",
  IS: "Information Security MS",
  S: "Services Management System",
  En: "Energy Management System",
  MD: "Medical Devices – QMS",
  AB: "Anti-Bribery Management System",
  OHS: "Occupational Health & Safety MS",
  GHG: "Greenhouse Gas (Verification)",
  ISPO: "Indonesia Sustainable Palm Oil",
  EO: "Educational Organization MS",
  NA: "Non Accredited",
  C: "Compliance Management System",
  SE: "Sustainability Event MS",
  PIM: "Privacy Information MS",
  ISCO: "ISCC CORSIA",
  IATF: "International Automotive Task Force",
  EnA: "Energi Audit",
} as const;

/**
 * PCT scheme codes are listed by the SOP, but the scheme format is declared
 * SCS-only, so they are not accepted in a number yet (spec §11 #8).
 */
export const PCT_SCHEME_CODES = {
  VE: "Verifikasi Ekolabel",
  GB: "Green Building",
  GTR: "Green Toll Road Indonesia",
} as const;

/** BB — highest method category per method type (spec §2.4). */
export const METHOD_CATEGORY_MAX = { U: 13, K: 10 } as const;

export type DocNumber =
  | { kind: "integration-manual" }
  | { kind: "procedure"; x: XCode; yy: string }
  | { kind: "procedure-scs"; scheme: string; yy: string }
  | { kind: "work-instruction"; x: XCode; yy: string; z: string }
  | { kind: "form"; x: XCode; yy: string; z: string }
  | { kind: "method"; method: "U" | "K"; bb: string; yy: string };

/** Longest first, so an alternation never settles on a prefix. */
const alternation = (codes: object) =>
  Object.keys(codes)
    .sort((a, b) => b.length - a.length)
    .join("|");

const X = `(${alternation(X_CODES)})`;
const SCH = `(${alternation(SCS_SCHEME_CODES)})`;
/** 01–99: the SOP numbers from one. */
const YY = "(0[1-9]|[1-9]\\d)";
const Z = "([A-Z])";

const PATTERNS = {
  manual: new RegExp(`^MI-${COMPANY}-01$`),
  procedure: new RegExp(`^P${X}-${COMPANY}-${YY}$`),
  procedureScs: new RegExp(`^PSC-${SCH}-${COMPANY}-${YY}$`),
  workInstruction: new RegExp(`^W${X}-${COMPANY}-${YY}${Z}$`),
  form: new RegExp(`^F${X}-${COMPANY}-${YY}${Z}$`),
  methodU: /^MU-(0[1-9]|1[0-3])_(\d{2})$/,
  methodK: /^MK-(0[1-9]|10)_(\d{2})$/,
};

/** Reads a document number, or `null` when §6.1 would not issue it. */
export function parseDocNumber(value: string): DocNumber | null {
  if (PATTERNS.manual.test(value)) return { kind: "integration-manual" };

  let match = PATTERNS.procedureScs.exec(value);
  if (match) return { kind: "procedure-scs", scheme: match[1], yy: match[2] };

  match = PATTERNS.procedure.exec(value);
  if (match) return { kind: "procedure", x: match[1] as XCode, yy: match[2] };

  match = PATTERNS.workInstruction.exec(value);
  if (match) {
    return { kind: "work-instruction", x: match[1] as XCode, yy: match[2], z: match[3] };
  }

  match = PATTERNS.form.exec(value);
  if (match) return { kind: "form", x: match[1] as XCode, yy: match[2], z: match[3] };

  match = PATTERNS.methodU.exec(value) ?? PATTERNS.methodK.exec(value);
  if (match) {
    return {
      kind: "method",
      method: value[1] as "U" | "K",
      bb: match[1],
      yy: match[2],
    };
  }

  return null;
}

/** A procedure number, of either format. */
export function isProcedureNumber(value: string): boolean {
  const parsed = parseDocNumber(value);
  return parsed?.kind === "procedure" || parsed?.kind === "procedure-scs";
}

/**
 * The procedure a work instruction or form descends from — same X, same YY
 * (spec §3.2): `FCR-TNI-01A` → `PCR-TNI-01`. Anything else has no parent.
 */
export function parentProcedure(value: string): string | null {
  const parsed = parseDocNumber(value);
  if (parsed?.kind !== "work-instruction" && parsed?.kind !== "form") return null;
  return `P${parsed.x}-${COMPANY}-${parsed.yy}`;
}

/** Two digits, `00` for the first issue (spec §3.3). */
export const REVISION_PATTERN = /^\d{2}$/;

/** `2026-09-17` → `17.09.2026`, the date format on the document header (§3.3). */
export function formatDocDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : iso;
}
