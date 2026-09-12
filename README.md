# Peta Proses Bisnis — PT TÜV NORD Indonesia

Interactive business process map with two linked levels of detail.

- **Level 0** (`/level-0`) — one map of the whole company: governance, strategy
  and quality bands, the core value chain with four profit-center lanes,
  corporate support, and the external parties either side. Clicking any box
  opens a detail panel and dims everything not involved in that stage.
- **Level 1** (`/level-1`) — 20 end-to-end processes as swimlane diagrams with a
  numbered step table.

The two levels are linked in both directions: a Level 0 lane step jumps to the
exact Level 1 steps that expand it, and every Level 1 step links back to the
Level 0 stage it belongs to.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
npm run preview  # serve the build
npm test         # vitest
npm run lint     # oxlint
```

There is no backend. The data is imported statically and the build is a folder
of static files — drop `dist/` on any internal web server.

**Node 20+ is required** (the build uses Vite 8).

## Editing the data

All content lives in `src/data/*.json`. Nothing in the UI is hardcoded: every
box, label, lane, step and role is read from these files.

| File | What it holds |
|---|---|
| `l0-units.json` | 31 Level 0 units — the boxes on the map |
| `l0-departments.json` | 29 profit-center departments — the chips |
| `l0-unit-groups.json` | 6 groups of units that share one role |
| `l0-stage-involvement.json` | RASCI per stage: 5 value-chain stages + 24 lane steps |
| `l0-layout.json` | Box order, band contents, flow labels, RASCI names, matrix row order |
| `l1-processes.json` | The 20 processes, their steps and metadata |
| `l1-lanes.json` | 52 swimlane performer definitions |
| `l1-groups.json` | The four process groups M / G / C / S |
| `crosslinks.json` | Every mapping between the levels |

### Validation catches mistakes for you

`src/data/validate.ts` runs on every dev server start and **throws before the
app renders** if the data is inconsistent. It checks that:

- every `step.n` points at a step that exists
- every `step.l` is declared in that process's `lanes`
- no two steps share a lane and column
- every lane declared by a process is actually used
- every `rel` names a real process
- every id in `crosslinks.json` resolves
- every RASCI row names a real unit, department, or group

If the dev server shows a blank page, read the console: the error lists every
problem at once. The same checks run in `npm test`.

### Things that are computed, not stored

Do not hand-maintain these — they are derived at load time:

- **Step numbers.** The `num` map in `l1-processes.json` is ignored and
  recomputed (`src/data/numbering.ts`): steps are numbered in array order,
  skipping start (`y: "s"`) and end (`y: "e"`) nodes, formatted `C4.2-01`.
  Insert a step anywhere and everything downstream renumbers itself.
- **Swimlane geometry and edge routing** (`src/lib/layout-l1.ts`).
- **The involvement matrix** (`src/lib/matrix.ts`), from `RANK` + involvement.

## How the crosslinks work when a process changes

`crosslinks.json` is the only place the two levels know about each other.

| Key | Direction | Meaning |
|---|---|---|
| `PC2L1` / `L12PC` | both | profit center ↔ its process (`lab` ↔ `C4.2`) |
| `VC2L1` / `L12VC` | both | value-chain stage ↔ process (`vc_del` → all four C4.x) |
| `STEP2L1` | 0 → 1 | `STEP2L1[pcId][i]` = the Level 1 step keys that expand lane step `i+1` |
| `OWN` | 0 → 1 | unit → processes it owns |
| `TAGS` | 0 → 1 | unit → the `L1 ·` codes printed on its map box |
| `P2L0` | 1 → 0 | process → its owning units |
| `LANE2L0` | 1 → 0 | lane → the unit (`u`) or department (`d`) behind it |
| `DEPT2LANES` | 0 → 1 | department → the lanes it works in |

**When you add or renumber steps in a C4.x process**, update `STEP2L1` for that
profit center. It is an array of six groups, one per lane step on the map, each
listing the step *keys* (not numbers) that detail it:

```jsonc
"lab": [["b"], ["c","d","e"], ["f","g"], ["h","x"], ["j","k"], ["l"]]
//       step 1  step 2         step 3     step 4     step 5     step 6
```

Keys, not numbers, so renumbering never breaks the mapping. The app derives the
reverse direction (`stepToL0`) and the printed ranges (`C4.2-02–04`) from this
one array, and the validator fails if a key does not exist in that process.

**When you add a process**, give it an id in the existing scheme, add it to
`OWN` and `TAGS` for its owning unit, and to `P2L0`. A `C4.x` id is drawn
stacked in the architecture chain automatically.

**When you add a lane**, define it in `l1-lanes.json` and, if it belongs to a
specific Level 0 unit or department, map it in `LANE2L0`. A lane whose id
matches a unit id (`cms`, `hr`, `md`, …) resolves by identity and needs no
entry. Generic role lanes ("Pemilik proses", "Unit terkait") are deliberately
left unmapped.

## Project layout

```
src/
  data/        JSON + types + validation + derived indexes
  lib/         layout-l0, layout-l1 (swimlane routing), matrix,
               crosslinks, cross-level (URL contract), motion
  hooks/       useMotionConfig, useDetailPanel, useStageFocus,
               useZoomToFit, useMediaQuery, usePrintMode
  components/  shell/ level0/ level1/ shared/
  routes/      Level0Page, Level1Page, Level1ProcessPage
```

Two rules worth knowing before you change anything:

1. **Shareable state lives in the URL.** Active level, open panel, highlighted
   steps, origin context and print mode are all search params. Browser Back
   always works; nothing important is in component state.
2. **No component writes an animation duration.** Every timing comes from
   `useMotionConfig()`, which collapses to zero when the reader has asked for
   reduced motion. `src/lib/motion.ts` is the single source of those numbers.

## Confirmation status layer

The Level 0 toolbar has a **Status konfirmasi** toggle. Switched on, it tints
every box that carries a RASCI role the process owners still have to confirm —
the `true` flag in the fourth slot of an involvement row — so a reviewer can see
at a glance what is still open.

It marks two kinds of box, because both matter to a reviewer:

- **stages** holding at least one flagged role (`vc_sales`, `vc_del`, `cs_2`,
  `lab_1`, `lab_2`), which is *where* the uncertainty is;
- **units and departments** the flags point at (`proc`, `lab_los`, `lab_mdn`,
  `lab_smg`), which is *who* has to confirm. A flag on a unit group tints each
  of its members, so `LAB_RO` marks both representative office chips.

The state lives in the URL (`/level-0?layer=confirmation`) so a process owner
can send the flagged view to someone. Toggling replaces the history entry rather
than stacking one per click. The layer works alongside focus mode, and the tint
is an orange overlay *plus* an inset outline, with "perlu dikonfirmasi" appended
to each tinted box's accessible label — colour never carries the meaning alone.
A legend entry appears while the layer is on.

Flags come straight from the data: adding `true` as the fourth element of an
involvement row in `l0-stage-involvement.json` is all it takes to light up a
box. Nothing about which boxes are flagged is written in the components.

## Search

The header carries a search box (from 1200px up) that filters across **unit
names, department names, process names, and Level 1 step titles** at once,
showing the hits grouped by kind.

It is built to be driven entirely from the keyboard:

| Key | What it does |
|---|---|
| `/` or `⌘K` / `Ctrl+K` | Focus the search from anywhere on the page |
| Typing | Filters after two characters; results group into Unit / Departemen / Proses / Langkah |
| `↓` `↑` | Walk the results, wrapping at either end and crossing group boundaries |
| `Home` `End` | Jump to the first or last result |
| `Enter` | Go to the highlighted result |
| `Escape` | Clear the query; a second press leaves the field |

Selecting a result navigates to it and opens the right thing: a unit or
department opens its Level 0 panel, a process opens its Level 1 page, and a step
opens its process with just that step highlighted in both the diagram and the
table. There is no origin banner — a search is not a cross-level jump, so there
is nothing to go "back" to.

Matching folds case and accents (`tuv` finds `TÜV`), ranks whole-name matches
above prefixes above mid-string hits, and accepts multi-word queries whose words
are not adjacent (`sampel registrasi`). It searches descriptions and lane names
as well as titles, so a term that only appears in a step's description still
finds it. Each group is capped at six results so one kind cannot flood the list.

It is implemented as an ARIA combobox (`src/components/shell/SearchBox.tsx`):
focus stays in the input and `aria-activedescendant` moves the cursor through
`role="option"` elements. That is why the options are not `<button>` elements —
nesting buttons inside a listbox breaks the pattern for screen readers.

## Printing

Both levels print to **A3 landscape** with colours preserved.

- **Cetak halaman ini** prints the current view. The Level 0 map is scaled to
  fit one page; navigation, panels and banners are dropped.
- **Cetak semua proses** (Level 1) prints the architecture page followed by all
  20 processes, one per page. It is also a URL — `/level-1?print=all` — so it
  can be linked or rendered to PDF headlessly.

## Known content gaps

Flagged by the data, not bugs in the app:

- RASCI assignments and Level 1 step order are **draft** pending process-owner
  validation; the panels say so.
- Roles marked "perlu dikonfirmasi" (Lab Operation Support, the Medan and
  Semarang representative offices, Procurement for external auditors) render an
  orange badge.
- **BRDM** is not mapped to any stage; its panel explains this instead of
  showing an empty list.
- Supporting systems for **C4.3** and **C4.4** are recorded as "Belum dipetakan".
- **MD's Secretary** (`sec`) is listed in the matrix row order but takes part in
  no stage, so it never appears in the matrix.
- Search covers the four name types listed above. **Level 0 stage names** (the
  six lane steps per profit center, such as "Sampling / sample receipt &
  registration") are not indexed; adding them would be one more block in
  `src/lib/search.ts`.
