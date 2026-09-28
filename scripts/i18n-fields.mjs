/**
 * Which strings in the shipped JSON carry meaning that changes with language.
 *
 * Official identifiers are deliberately absent: unit and department names, ISO
 * standard numbers, business units, process names and their codes read the same
 * in both languages, because that is how they appear on accreditation
 * certificates and in the TÜV NORD group register. Translating them would make
 * the map disagree with the documents it describes.
 *
 * A path listed here MUST have an English entry in `translations.json`, or the
 * data validator fails the build. That is what keeps a language pure: there is
 * no way to add Indonesian prose and quietly ship it inside the English view.
 */
export const TRANSLATABLE = {
  "l0-units.json": (unit, key) => {
    if (["org", "role", "sub", "tag"].includes(key)) return true;
    if (["tasks", "outputs", "gives", "receives", "flow", "steps", "links"].includes(key)) return true;
    // Value-chain boxes are named for the work they carry, not for an org unit,
    // and their "depts" are display names rather than department ids.
    if (key === "name" || key === "depts") return unit.cat === "vc";
    return false;
  },
  "l0-layout.json": (_root, key) =>
    ["VC_LINKS", "CATS", "RAS_LBL", "RAS_DESC"].includes(key),
  "l0-unit-groups.json": (_g, key) => ["n", "sub"].includes(key),
  "l1-groups.json": (_g, key) => ["n", "l0"].includes(key),
  "l1-lanes.json": (_l, key) => ["n", "t"].includes(key),
  "l1-processes.json": (_p, key) =>
    ["l0", "owner", "purpose", "kpi", "ref", "note", "t", "d", "o"].includes(key),
  /*
   * A Level 2 procedure is prose end to end. What stays put is the document
   * number, the revision, the effective date, the lane ids, and the units named
   * in the signature block.
   */
  "l2-procedures.json": (_p, key) =>
    ["n", "purpose", "scope", "defs", "resp", "wi", "records", "refs"].includes(key),
};

/** Layout's external columns are tuples, so they are picked out by position. */
export const LAYOUT_TUPLES = { EXT_L: [1], EXT_R: [1, 2] };
