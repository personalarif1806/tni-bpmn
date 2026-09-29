# Project notes for Claude

## Controlled documents (Level 2) — follow PCR-TNID-01

Every Level 2 document follows the Document Control Procedure PCR-TNID-01 Rev.12,
as specified for this project in
`docs/document-control-spec_PCR-TNID-01_R12.md`. Read it before adding,
renumbering or reformatting a procedure, work instruction, form or method.

- **Numbers** — spec §1–§3, implemented in `src/lib/doc-number.ts` and enforced
  by `src/data/validate.ts`. Procedure `PX-TNI-YY` / `PSC-SCH-TNI-YY`, work
  instruction `WX-TNI-YYZ`, form `FX-TNI-YYZ`, method `MU-BB_YY` / `MK-BB_YY`.
  `X` comes from the code tables in spec §2; codes are case-sensitive; `YY` is
  `01`–`99`; a form or work instruction shares `X` and `YY` with its parent
  procedure; a `Z` letter is never reused. Only CMS issues real numbers — treat
  numbers here as drafts and never invent a code for a unit that has none
  (spec §2.1 lists them as `[PERLU KONFIRMASI]`).
- **Revisions** — two digits, `00` for the first issue. `revs` in
  `l2-procedures.json` is cumulative; its last entry must equal `rev` and be
  dated `eff` (the published date). Changes in the current revision are shown in
  red (spec §8.5).
- **Format** — spec §8, implemented in
  `src/components/level2/ProcedureDocument.tsx`: cover, header and footer on
  every page, chapters in the order of spec §8.4. The footer text is spec §8.3,
  translated.
- **Not bilingual** — decided by the project owner: the document is drawn in the
  reader's language only, not in the SOP's two-column ID | EN layout, because
  the app's language switch already covers it. All its wording goes through
  `t()`; do not reintroduce side-by-side columns.
- **Roles, not names** — `sign.prep` / `sign.rev` / `sign.app` hold roles per
  spec §6.1 and §4 (for a procedure: the team, its Dept. Manager, the Head of
  Division). Never put a person's name in the data.
- When the spec and a newer revision of the SOP disagree, the SOP wins; update
  the spec file, `doc-number.ts` and its tests together.

Open questions for CMS are listed in spec §11; do not hard-code an answer to one
without confirmation.

## Level 0 — standard clauses (ISO 9001, ISO 14001, ISO/IEC 27001, K-RL 550)

`src/data/l0-clauses.json` maps every Level 0 element — value-chain stage,
profit-center lane step (`lab_3`), unit and external party — to the clauses it
carries, with the official clause titles in both languages. `clauses.test.ts`
fails if a clause marked `req` is carried by no element, if a mapped id is not
on the map, or if a stage has no clause at all.

- Adding a Level 0 unit or stage means adding its row to the `map` in the same
  change.
- Removing a mapping must not leave a `req` clause uncovered — move it to the
  unit that now owns the requirement.
- K-RL 550 is mapped by subject area (`gov`, `sec`, `acc`, `asset`, `dev`,
  `svc`, `data`), not by section number, because its text is not in the
  project. Do not invent K-RL 550 section numbers; replace the topics with real
  sections once the policy document is provided.
- Annex A controls of ISO/IEC 27001 are not `req`: which apply is decided in the
  Statement of Applicability.
