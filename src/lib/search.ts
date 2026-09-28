/**
 * Header search — one index over the four things people look for by name:
 * units, departments, processes, and Level 1 steps.
 *
 * Every hit resolves to a URL the app already understands, so selecting a
 * result opens the matching panel or highlight through normal navigation.
 */
import { departments, getLane, getUnit, processes, units } from "@/data";
import { level0Url, level1Url } from "@/lib/cross-level";
import { t } from "@/lib/i18n";

export type SearchKind = "unit" | "dept" | "process" | "step";

export interface SearchResult {
  id: string;
  kind: SearchKind;
  /** What matched — shown as the result's main line. */
  label: string;
  /** Where it sits, shown underneath. */
  context: string;
  /** Short code on the left: a Level 1 id, a step number, a unit tag. */
  badge?: string;
  href: string;
}

export interface SearchGroup {
  kind: SearchKind;
  label: string;
  results: SearchResult[];
}

const GROUP_LABEL: Record<SearchKind, string> = {
  unit: t("Unit"),
  dept: t("Departemen"),
  process: t("Proses Level 1"),
  step: t("Langkah Level 1"),
};

const GROUP_ORDER: SearchKind[] = ["unit", "dept", "process", "step"];

/** Fold case and accents so "TÜV" matches "tuv". */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

interface IndexEntry extends SearchResult {
  haystack: string;
}

function buildIndex(): IndexEntry[] {
  const entries: IndexEntry[] = [];

  for (const [unitId, unit] of Object.entries(units)) {
    entries.push({
      id: `unit:${unitId}`,
      kind: "unit",
      label: unit.name,
      context: unit.org,
      badge: unit.tag,
      href: level0Url({ kind: "unit", id: unitId }),
      haystack: normalize(`${unit.name} ${unit.org} ${unit.tag ?? ""}`),
    });
  }

  for (const [departmentId, department] of Object.entries(departments)) {
    const parent = getUnit(department.pc)?.name ?? department.pc;
    entries.push({
      id: `dept:${departmentId}`,
      kind: "dept",
      label: department.n,
      context: parent,
      href: level0Url({ kind: "dept", id: departmentId }),
      haystack: normalize(`${department.n} ${department.s ?? ""} ${parent}`),
    });
  }

  for (const process of processes) {
    entries.push({
      id: `process:${process.id}`,
      kind: "process",
      label: process.name,
      context: process.owner,
      badge: process.id,
      href: level1Url(process.id),
      haystack: normalize(`${process.id} ${process.name} ${process.owner} ${process.purpose}`),
    });

    for (const step of process.steps) {
      const lane = getLane(step.l)?.n ?? step.l;
      entries.push({
        id: `step:${process.id}:${step.k}`,
        kind: "step",
        label: step.t,
        context: `${process.id} ${process.name} · ${lane}`,
        badge: process.num[step.k],
        href: level1Url(process.id, { steps: [step.k] }),
        haystack: normalize(`${step.t} ${step.d ?? ""} ${lane} ${process.id}`),
      });
    }
  }

  return entries;
}

const INDEX = buildIndex();

/**
 * Lower is better: whole label, then prefix, then word start, then anywhere in
 * the label, then anywhere in the entry. Last of all, every word of a
 * multi-word query somewhere in the entry — so "sample receipt" and "review
 * kontrak" find things even though those words are not adjacent.
 */
function score(
  entry: IndexEntry,
  query: string,
  terms: readonly string[],
): number | null {
  const label = normalize(entry.label);
  if (label === query) return 0;
  if (label.startsWith(query)) return 1;
  if (new RegExp(`\\b${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(label)) {
    return 2;
  }
  if (label.includes(query)) return 3;
  if (entry.haystack.includes(query)) return 4;
  if (terms.length > 1 && terms.every((term) => entry.haystack.includes(term))) {
    return 5;
  }
  return null;
}

export const MAX_PER_GROUP = 6;

/** Grouped matches for a query. Empty until the query is worth running. */
export function search(rawQuery: string): SearchGroup[] {
  const query = normalize(rawQuery.trim());
  if (query.length < 2) return [];

  const terms = query.split(/\s+/).filter(Boolean);
  const scored: { entry: IndexEntry; rank: number }[] = [];
  for (const entry of INDEX) {
    const rank = score(entry, query, terms);
    if (rank !== null) scored.push({ entry, rank });
  }

  scored.sort(
    (a, b) =>
      a.rank - b.rank ||
      a.entry.label.length - b.entry.label.length ||
      a.entry.label.localeCompare(b.entry.label, "id"),
  );

  return GROUP_ORDER.flatMap((kind) => {
    const results = scored
      .filter((item) => item.entry.kind === kind)
      .slice(0, MAX_PER_GROUP)
      .map(({ entry }) => {
        const { haystack: _haystack, ...result } = entry;
        return result;
      });

    return results.length > 0
      ? [{ kind, label: GROUP_LABEL[kind], results }]
      : [];
  });
}

/** The grouped results flattened, in the order the arrow keys walk them. */
export function flatten(groups: SearchGroup[]): SearchResult[] {
  return groups.flatMap((group) => group.results);
}
