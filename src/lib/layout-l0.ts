/**
 * Level 0 map geometry and view model — PRD 8.2.
 *
 * The canvas is a fixed 2040px grid, so the connector SVGs (governance fork,
 * value-chain feedback loop) can be drawn at exact pixel positions. Every label
 * comes from `l0-layout.json`, `l0-units.json` and the crosslinks; nothing about
 * the content is decided here.
 */
import {
  crosslinks,
  departments,
  getUnit,
  layout,
  shortName,
  stageIdForLaneStep,
  units,
} from "@/data";
import type { UnitCategory } from "@/data/types";
import { stageDetails, unitTags } from "@/lib/crosslinks";

/* ---------------------------------------------------------------- Geometry */

export const CANVAS_WIDTH = 2040;

/**
 * Slack left when fitting the map to the viewport, so the fitted canvas can
 * never be the thing that summons the viewport's scrollbar.
 */
export const MAP_FIT_GUTTER = 20;
const CANVAS_PADDING = 24;
const CONTENT_WIDTH = CANVAS_WIDTH - CANVAS_PADDING * 2;

/**
 * External input/output columns flanking the core block.
 *
 * 224 rather than 244: the 20px goes to the core process, widening every lane
 * step and value-chain stage, and measurement at 1440px shows the external
 * column wraps to exactly the same number of lines either way — its section
 * titles still fit on one line. Below ~216 the external text starts costing
 * more lines than the lane steps save.
 */
export const EXTERNAL_COLUMN_WIDTH = 224;
const COLUMN_GAP = 24;

/** The central stack: governance, bands, core process, support. */
export const CENTER_WIDTH =
  CONTENT_WIDTH - (EXTERNAL_COLUMN_WIDTH + COLUMN_GAP) * 2;

const BAND_GAP = 24;
const BLOCK_PADDING = 20;

/** Governance strip: two boxes joined by a dotted coordination line. */
export const GOVERNANCE = {
  boxWidth: 300,
  linkWidth: 140,
  get totalWidth() {
    return this.boxWidth * 2 + this.linkWidth;
  },
  get offsetX() {
    return (CENTER_WIDTH - this.totalWidth) / 2;
  },
  /** Centre of the Board of Commissioners box. */
  get leftCenter() {
    return this.offsetX + this.boxWidth / 2;
  },
  /** Centre of the Managing Directors box — where the fork starts. */
  get rightCenter() {
    return this.offsetX + this.boxWidth * 1.5 + this.linkWidth;
  },
  forkHeight: 44,
} as const;

/** The two top bands are sized by how many boxes they hold (5 and 3). */
const TOP_BAND_TOTAL = CENTER_WIDTH - BAND_GAP;
const TOP_LEFT_COUNT = layout.TOP_L.length;
const TOP_RIGHT_COUNT = layout.TOP_R.length;
const TOP_COUNT = TOP_LEFT_COUNT + TOP_RIGHT_COUNT;

export const TOP_LEFT_WIDTH = Math.round(
  (TOP_BAND_TOTAL * TOP_LEFT_COUNT) / TOP_COUNT,
);
export const TOP_RIGHT_WIDTH = TOP_BAND_TOTAL - TOP_LEFT_WIDTH;

/** Fork targets: the centre of each top band. */
export const TOP_LEFT_CENTER = TOP_LEFT_WIDTH / 2;
export const TOP_RIGHT_CENTER = TOP_LEFT_WIDTH + BAND_GAP + TOP_RIGHT_WIDTH / 2;

/** Left offset of the central stack, so it lines up with the core block. */
export const CENTER_OFFSET = EXTERNAL_COLUMN_WIDTH + COLUMN_GAP;

/** Value chain: 5 stages separated by 4 labelled arrows. */
export const CORE_INNER_WIDTH = CENTER_WIDTH - BLOCK_PADDING * 2;
export const VC_ARROW_WIDTH = 132;
export const VC_STAGE_WIDTH = Math.floor(
  (CORE_INNER_WIDTH - VC_ARROW_WIDTH * (layout.VC.length - 1)) /
    layout.VC.length,
);
export const VC_FEEDBACK_HEIGHT = 40;

/** Horizontal centre of value-chain stage `index`, for the feedback loop. */
export function valueChainStageCenter(index: number): number {
  return index * (VC_STAGE_WIDTH + VC_ARROW_WIDTH) + VC_STAGE_WIDTH / 2;
}

/** Profit-center lane: header box, then 6 numbered steps. */
export const PC_HEADER_WIDTH = 248;
const PC_HEADER_GAP = 16;
export const PC_STEPS_WIDTH =
  CORE_INNER_WIDTH - PC_HEADER_WIDTH - PC_HEADER_GAP;

/* -------------------------------------------------------------- View model */

/** A unit box on the map. */
export interface MapBox {
  unitId: string;
  name: string;
  /** Small label: SID, F&A, HC, GS, CSS, NBUD. */
  tag?: string;
  /** Sub-heading, used by external parties. */
  sub?: string;
  /** Drawn with a dashed border. */
  committee: boolean;
  /** Level 1 codes for the `L1 ·` line. */
  codes: string[];
  /** Flow labels drawn between the box and the core process. */
  flow: string[];
}

/** A category band: yellow caption over a navy block of unit boxes. */
export interface MapBand {
  category: UnitCategory;
  caption: string;
  boxes: MapBox[];
  /** Which way the flow labels point, towards the core process. */
  direction: "down" | "up";
  width?: number;
}

export interface ValueChainStage {
  stageId: string;
  name: string;
  codes: string[];
}

export interface ProfitCenterStep {
  stageId: string;
  /** 1-based position in the lane. */
  index: number;
  title: string;
  /** Level 1 number range, e.g. `C4.2-02–04`. */
  range: string;
}

export interface ProfitCenterLaneModel {
  unitId: string;
  name: string;
  /** Accreditation standard. */
  std?: string;
  bu?: string;
  sys: string[];
  codes: string[];
  steps: ProfitCenterStep[];
  chips: { id: string; label: string }[];
}

export interface ExternalEntry {
  unitId: string;
  name: string;
  sub?: string;
  /** What flows in or out. */
  text: string;
  /** Where the output comes from — right-hand column only. */
  source?: string;
}

export interface MapModel {
  governance: MapBox[];
  strategy: MapBand;
  governanceQuality: MapBand;
  valueChain: {
    caption: string;
    stages: ValueChainStage[];
    /** Labels on the arrows between stages. */
    links: string[];
  };
  profitCenters: {
    caption: string;
    lanes: ProfitCenterLaneModel[];
  };
  support: MapBand;
  external: {
    left: ExternalEntry[];
    right: ExternalEntry[];
  };
  /** Legend needs the RASCI roles and their full names. */
  roles: { role: (typeof layout.RAS)[number]; label: string }[];
}

function toBox(unitId: string): MapBox {
  const unit = getUnit(unitId);
  return {
    unitId,
    name: unit?.name ?? unitId,
    tag: unit?.tag,
    sub: unit?.sub,
    committee: unit?.committee === true,
    codes: unitTags(unitId),
    flow: unit?.flow ?? [],
  };
}

function toBand(
  category: UnitCategory,
  unitIds: string[],
  direction: "down" | "up",
  width?: number,
): MapBand {
  return {
    category,
    caption: layout.CATS[category],
    boxes: unitIds.map(toBox),
    direction,
    width,
  };
}

function toProfitCenterLane(unitId: string): ProfitCenterLaneModel {
  const unit = units[unitId];
  const steps = (unit?.steps ?? []).map((title, position) => {
    const index = position + 1;
    const stageId = stageIdForLaneStep(unitId, index);
    return {
      stageId,
      index,
      title,
      range: stageDetails(stageId)[0]?.range ?? "",
    };
  });

  const chips = (unit?.depts ?? []).flatMap((departmentId) =>
    departments[departmentId]
      ? [{ id: departmentId, label: shortName(departmentId) }]
      : [],
  );

  return {
    unitId,
    name: unit?.name ?? unitId,
    std: unit?.std,
    bu: unit?.bu,
    sys: unit?.sys ?? [],
    codes: unitTags(unitId),
    steps,
    chips,
  };
}

/** The whole map, resolved from the data files. Built once. */
export function buildMapModel(): MapModel {
  return {
    // The governance strip has no layout array: it is every `gov` unit, in
    // the order l0-units.json declares them.
    governance: Object.entries(units)
      .filter(([, unit]) => unit.cat === "gov")
      .map(([unitId]) => toBox(unitId)),
    strategy: toBand("strat", layout.TOP_L, "down", TOP_LEFT_WIDTH),
    governanceQuality: toBand("qgov", layout.TOP_R, "down", TOP_RIGHT_WIDTH),
    valueChain: {
      caption: layout.CATS.vc,
      stages: layout.VC.map((stageId) => ({
        stageId,
        name: getUnit(stageId)?.name ?? stageId,
        codes: crosslinks.VC2L1[stageId] ?? [],
      })),
      links: layout.VC_LINKS,
    },
    profitCenters: {
      caption: layout.CATS.pc,
      lanes: layout.PCS.map(toProfitCenterLane),
    },
    support: toBand("sup", layout.BOTTOM, "up"),
    external: {
      left: layout.EXT_L.map(([unitId, text]) => ({
        ...toExternal(unitId),
        text,
      })),
      right: layout.EXT_R.map(([unitId, text, source]) => ({
        ...toExternal(unitId),
        text,
        source,
      })),
    },
    roles: layout.RAS.map((role) => ({ role, label: layout.RAS_LBL[role] })),
  };
}

function toExternal(unitId: string): Omit<ExternalEntry, "text"> {
  const unit = getUnit(unitId);
  return { unitId, name: unit?.name ?? unitId, sub: unit?.sub };
}

export const mapModel: MapModel = buildMapModel();
