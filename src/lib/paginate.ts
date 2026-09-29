/**
 * Splitting a measured document into fixed-height pages.
 *
 * A Level 2 procedure is shown as the sheets it would print on, so its content
 * is cut into pages before it is drawn. The cut is made on whole blocks — a
 * paragraph, a definition, one work instruction row — never inside one, which
 * is also how a controlled document is laid out by hand.
 */

export interface MeasuredBlock {
  /** Rendered height in px, spacing included. */
  height: number;
  /** A work instruction row: rows on one page share one table and its heading. */
  row: boolean;
  /** A section heading, which must not be left alone at the foot of a page. */
  keepWithNext: boolean;
}

/**
 * Block indices per page, in order.
 *
 * `tableHead` is what a run of rows costs on top of the rows themselves — the
 * repeated column headings, the frame and the gap after it — and is charged to
 * the first row of every run, so a table that breaks over a page gets its
 * headings again on the next.
 *
 * A block taller than a whole page still gets a page of its own rather than
 * looping; it is clipped, which is visible and better than a hang.
 */
export function paginate(
  blocks: MeasuredBlock[],
  pageHeight: number,
  tableHead: number,
): number[][] {
  const pages: number[][] = [];
  let page: number[] = [];
  let used = 0;

  /* Contiguous indices, so "the previous block on this page" is i - 1. */
  const cost = (i: number, pageStartsHere: boolean) => {
    const opensTable =
      blocks[i].row && (pageStartsHere || !blocks[i - 1]?.row);
    return blocks[i].height + (opensTable ? tableHead : 0);
  };

  for (let i = 0; i < blocks.length; i++) {
    let needed = cost(i, page.length === 0);
    if (blocks[i].keepWithNext && i + 1 < blocks.length) {
      needed += cost(i + 1, false);
    }

    if (page.length > 0 && used + needed > pageHeight) {
      pages.push(page);
      page = [];
      used = 0;
    }

    used += cost(i, page.length === 0);
    page.push(i);
  }

  if (page.length > 0) pages.push(page);
  return pages;
}
