# Build prompts — TÜV NORD Business Process Map (React + Tailwind)

Copy-paste prompts for Claude Code, one milestone per prompt. Run them in order in the same session so context carries over. After each milestone, run the app, look at it, and fix what looks wrong before moving on.

**Before you start:** create an empty folder, drop `PRD-BPM-React.md` and the `data/` folder into it, then run `claude` there.

---

## Prompt 0 — Kickoff and constraints

```
You are building an internal web app for PT TÜV NORD Indonesia: an interactive
business process map with two linked levels of detail.

Read PRD-BPM-React.md in full before writing any code. It is the spec — follow
it rather than inventing your own structure. Read the JSON files in data/ to
understand the shapes; do not retype or "improve" the content, it is validated
against the company's approved org structure.

Stack, fixed:
- Vite + React 19 + TypeScript in strict mode
- Tailwind CSS v4 (@theme tokens, no config file unless you need one)
- React Router v7 with createBrowserRouter
- motion (Framer Motion 12) for animation
- lucide-react for icons
- No backend, no data fetching, no auth, no state library unless local state
  genuinely stops working

Hard rules for the whole build:
1. All shareable state lives in the URL (route params + search params): active
   level, active process, open panel, highlighted steps, origin context. Browser
   back must work.
2. Never hardcode animation durations in components. Everything goes through one
   useMotionConfig() hook that collapses to near-zero when the user prefers
   reduced motion.
3. Animate only opacity and transform. The Level 0 map has hundreds of elements;
   dim it via one CSS class on a parent, not per-element JS animation.
4. Content is Indonesian. Code, comments, filenames, and commit messages are
   English.
5. Every clickable box is a real <button> with a useful aria-label and a visible
   focus ring.

Right now, do only this:
- Scaffold the project and install the dependencies above.
- Set up the @theme color tokens and Inter from the PRD's design tokens section.
- Create the folder structure from PRD section 7.
- Build AppShell: sticky header with the title, a Level 0 / Level 1 tab switch,
  and a toolbar slot whose contents change per level. White surfaces — this is a
  TÜV NORD internal tool, not a dark dashboard.
- Wire the routes from PRD section 7.1 with placeholder pages.
- Cross-fade between levels per PRD section 10.

Then show me the file tree and tell me what you'd do next, but don't do it yet.
```

---

## Prompt 1 — Data layer

```
Build the data layer (PRD sections 6 and M1).

1. Move data/*.json into src/data/ and write src/data/types.ts with the
   interfaces from PRD section 6. No `any`.
2. src/data/index.ts: import the JSON, type it, and export typed accessors —
   getUnit, getDepartment, getProcess, getStage, listProcessesByGroup, etc.
3. Recompute each process's `num` map at load time with the numbering rule from
   the PRD (skip start and end nodes; format `${processId}-${nn}`). Do not trust
   the `num` field baked into the JSON — replace it.
4. Build the derived indexes:
   - stageIndex: every value-chain stage and every profit-center lane step,
     keyed by stage id, with its involvement list resolved (expand unit groups
     into their member units where useful, but keep the group for display)
   - stepToL0: inverse of STEP2L1, so a Level 1 step key resolves to its Level 0
     lane step
   - unitToProcesses(unitId): { owned: string[], involved: Record<processId,
     laneId[]> } using OWN, LANE2L0 and DEPT2LANES
5. Write a dev-only validation function that throws with a clear message if:
   every step.n target exists; every step.l is in process.lanes; no two steps
   share the same lane+column; every process.rel points at a real process; every
   lane in a process is used by at least one step; every crosslink id resolves.
   Run it once in development.

Write a few vitest tests for the numbering and the derived indexes. Then run the
validation and tell me if the shipped data has any problems.
```

---

## Prompt 2 — Level 0 map

```
Build the Level 0 map (PRD section 8.2 and milestone M2). Static rendering only,
no panel or focus mode yet.

The map is a fixed 2040px-wide canvas inside a scrollable, zoomable container.
Zoom range 20–150%, default fit-to-width, and a zoom control in the toolbar.
Re-fit on window resize only while the user hasn't manually zoomed.

Layout, top to bottom (PRD 8.2 has the detail):
- Governance strip: two navy boxes joined by a dotted coordination line, forking
  down into the two bands below
- Two top bands: yellow category header over a navy block of cyan unit boxes,
  each with a flow label and downward arrow beneath it
- Core Business Process: a navy block containing the 5-stage value chain with
  labelled yellow arrows and a feedback loop, then 4 profit-center lanes, each
  with a header box, 6 numbered steps, and department chips
- Bottom band: Corporate & Business Support, flow labels with upward arrows
- External columns left (inputs) and right (outputs) with horizontal arrows
- Legend

Drive every box, label, and ordering from l0-layout.json and l0-units.json.
Nothing about the content should be hardcoded in JSX.

Each box shows its Level 1 codes from TAGS (`L1 · G1, G2`), each lane step shows
its Level 1 number range computed from STEP2L1 (`C4.2-02–04`), each profit-center
header shows `L1 · C4.2`.

Style notes: square corners, dense spacing, the exact token colors, no rounded
SaaS cards, no drop shadows on the map itself. Hover is a background change only.

Take a screenshot at 1440px and 1920px and check the map against the PRD before
you tell me it's done.
```

---

## Prompt 3 — Detail panel and focus mode

```
Build the detail panel and stage focus mode (PRD sections 8.3, 8.4, 9 and
milestone M3).

DetailDrawer is one component with three content variants — stage, unit,
department — driven by the URL (?stage= / ?unit= / ?dept=). Opening and closing
is a route change, not local state.

Stage variant:
- prev/next stage navigation, also bound to ArrowLeft/ArrowRight while open
- a count summary of units per RASCI role
- units grouped A → R → S → C → I, each with its role description; unit groups
  render their member departments as chips
- roles flagged as needing confirmation get an orange "Peran perlu dikonfirmasi"
  badge
- a draft-status note at the bottom

Unit variant: role, standard/BU/systems, tasks, core process steps (profit
centers), outputs, departments, its roles across core-process stages, and key
interactions.

Department variant: parent profit center and the stages it appears in. BRDM has
no mapped involvement — show the explanatory message from the data rather than
an empty list.

Focus mode, when a stage is open:
- add a class to the map root that dims everything not involved to opacity .2
  via CSS transition — do not animate each box from JS
- outline the selected stage in yellow, and move that outline with a shared
  layoutId when the user steps to the next stage
- render a RASCI badge on each involved box and department chip, appearing with
  a short staggered scale-in capped at 300ms total
- at ≥1100px the map container shrinks so the panel doesn't cover it; below
  that the panel overlays

Escape closes. Focus returns to the element that opened it. Verify with a
screenshot that badges don't overlap box text.
```

---

## Prompt 4 — Matrix and catalogue

```
Build the involvement matrix and the responsibility catalogue (PRD 8.5, 8.6, M4).

Matrix: five tabs (Value chain, Certification, Laboratory, Inspection, PCT).
Rows are units ordered by RANK and grouped into "Profit center" and "Direksi,
Business Partner & governance"; columns are that scope's stages; cells hold a
RASCI badge whose tooltip is the role description. Clicking a cell or a column
header opens that stage on the map. Sticky header row and sticky first column.
The tab indicator moves with a shared layoutId; tab content cross-fades.

Catalogue: one table grouped by Level 0 category — unit (with parent org,
standard, departments, systems, and clickable Level 1 codes), role in the
process, task list, main outputs.

Both live on the Level 0 page below the map, reachable from the toolbar with
smooth scrolling and a scroll-margin that accounts for the sticky header.

Accessibility: every matrix cell needs an aria-label of the form
"{unit} — {stage} — {role name}". Colour alone must never carry the role.
```

---

## Prompt 5 — Level 1 swimlanes

```
Build Level 1 (PRD 8.7, 8.8 and milestone M5). This is the hardest milestone —
plan the layout algorithm before writing the renderer.

Architecture page (/level-1): block map of the four process groups, with the C
group drawn as C1 → C2 → C3 → C4.1–C4.4 → C5, plus an index table of all 20
processes.

Process page (/level-1/:processId):
- white sidebar listing all 20 processes grouped by M/G/C/S, active one marked;
  collapses to a toolbar dropdown below 900px
- header: group-coloured code chip, breadcrumb, title, purpose, and a
  "Posisi di Level 0" button row
- info card: owner, trigger, outcome, KPIs, systems, reference standard, units
  involved, related processes as buttons
- swimlane SVG
- step table: number, activity, performer, description, output, and a
  "Di Level 0" column of back-links resolved through stepToL0

Swimlane renderer (src/lib/layout-l1.ts + components):
- one row per lane, 112px tall, alternating background; lane header 184px wide,
  navy, or cobalt when the lane is an external party; header stays visible
  during horizontal scroll
- columns are 160px, node x = laneHeaderWidth + step.c * 160 + 80
- shapes: capsule for start/end, cyan rectangle for activity, yellow diamond for
  decision; node labels use foreignObject so text wraps
- orthogonal edges with arrowheads. Route around occupied cells: prefer a
  straight line when the row between the two nodes is free, otherwise drop to
  the lane gutter and come back up. Decision branches after the first leave from
  the top or bottom vertex. Backward edges (target column < source column) are
  drawn dashed in red.
- branch labels sit on the path in a small white box

Clicking a node highlights its table row and scrolls it into view; clicking a row
highlights the node and scrolls it horizontally into view only if it's off-screen
— never scroll the lane headers out of view unnecessarily.

Render every one of the 20 processes and screenshot at least C4.1 (13 steps, 5
lanes), M2 (branching), and S3 (a rejoining loop). Fix any edge that crosses a
node box before you call this done.
```

---

## Prompt 6 — Cross-level links

```
Wire the two levels together (PRD section 9 and milestone M6).

From Level 0 to Level 1:
- stage panel gets a "Detail di Level 1" section listing the Level 1 step numbers
  that expand this stage, plus a button per target process (the Service Delivery
  stage offers all four C4.x)
- unit and department panels get a "Proses di Level 1" section split into
  "Pemilik proses" and "Terlibat sebagai pelaksana", with the lane names shown
- clicking navigates to /level-1/{id}?steps=...&from=stage:lab_2

From Level 1 to Level 0:
- "Posisi di Level 0" buttons in the process header, resolved through L12VC,
  L12PC and P2L0
- the "Di Level 0" table column
- both navigate to /level-0?stage=... or ?unit=... and carry from=process:C4.2

Return behaviour:
- arriving at Level 1 with a `from` param shows a yellow banner naming the origin
  and a "‹ Kembali ke Level 0" button; the banner expands with a height+fade
  transition, the highlighted nodes pulse twice then keep a steady outline
- arriving at Level 0 with a `from` param puts a "‹ Kembali ke Level 1: {code}
  {name}" button at the top of the panel
- store one level of origin only, not a stack

Test these paths and tell me the result of each:
1. lab_2 → C4.2 highlights C4.2-02, -03, -04
2. back from that banner lands on lab_2 with a return button to C4.2
3. Chemical Lab chip → C4.2 highlights the analyst and supervisor lane steps
4. S2 "Posisi di Level 0" → Procurement box, and its return button goes back
5. Opening /level-1/C4.3 directly shows no banner and no highlight
6. Browser back works through all of the above
```

---

## Prompt 7 — Print, accessibility, polish

```
Finish the build (PRD sections 12, 13, 14 and milestone M7).

Print:
- "Cetak halaman ini" prints the current view; "Cetak semua proses" prints the
  Level 1 architecture page followed by all 20 processes, one per page
- @page A3 landscape, print-color-adjust: exact
- scale the Level 0 map so the whole thing fits one page
- hide the header, sidebar, panel, banners, buttons, and zoom control
- repeat <thead> across page breaks and avoid breaking inside a table row
- generate a PDF and check page 1 of each mode actually looks right

Accessibility pass:
- keyboard-only walk through the map, panel, matrix, and a swimlane
- focus returns correctly when the panel closes
- run an axe or Lighthouse audit and fix everything down to a score of 95+

Responsive pass at 1920, 1440, 1100, 900, and 400px. At 400px the header stops
being sticky, the sidebar becomes a dropdown, info cards go single-column, and
both the map and swimlanes scroll horizontally.

Polish pass — with screenshots, then act on what you see:
- no text overflowing a box at any zoom level
- no edge crossing through a node
- badge positions consistent
- reduced-motion mode has no slide or stagger anywhere
- README.md: how to run, how to edit the data, and how the crosslink mappings
  work when a process changes

Then give me a short list of anything you had to guess or work around.
```

---

## Follow-up prompts

Small, targeted asks for after the build:

```
The Level 0 map feels cramped at 1440px. Try increasing the lane step width and
reducing the external column width, screenshot before and after, and keep
whichever reads better.
```

```
Add a search box in the header: typing filters across unit names, department
names, process names, and Level 1 step titles, showing grouped results. Selecting
a result navigates to it and opens the right panel or highlight. Keyboard only —
no mouse required.
```

```
Add a "confirmation status" layer to Level 0: a toggle that tints every box
whose RASCI involvement includes an item flagged as needing confirmation, so the
process owners can see at a glance what still needs review.
```

```
Export the involvement matrix to XLSX with SheetJS: one sheet per scope, rows as
units, columns as stages, cells as the RASCI letter, and the role description as
a cell comment.
```
