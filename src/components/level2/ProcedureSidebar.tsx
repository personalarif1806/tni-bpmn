import { useEffect, useRef } from "react";
import { Link, NavLink } from "react-router";
import { listProcedures, processesWithProcedures } from "@/data";
import { level1Url } from "@/lib/cross-level";
import { t } from "@/lib/i18n";

/**
 * Every Level 2 procedure, grouped under the Level 1 process it details, beside
 * the document being read. The Level 2 counterpart of `ProcessSidebar`: same
 * width rules, same active marker, and below 900px the page drops it for the
 * chip list under the document.
 */
export function ProcedureSidebar({ activeId }: { activeId: string }) {
  const procedures = listProcedures();
  const listRef = useRef<HTMLDivElement>(null);

  /*
   * With every procedure listed, the open one can sit below the fold. Scroll
   * the list itself — not the page — so it is in view, centred when it has to
   * move at all.
   */
  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !active) return;
    /* The sticky list is the link's offset parent, so this is list-relative. */
    const top = active.offsetTop;
    const fits =
      top >= list.scrollTop &&
      top + active.offsetHeight <= list.scrollTop + list.clientHeight;
    if (!fits)
      list.scrollTop = top - (list.clientHeight - active.offsetHeight) / 2;
  }, [activeId]);

  return (
    <nav
      aria-label={t("Prosedur terkait")}
      className="w-72 shrink-0 self-stretch border-r border-line bg-white print:hidden"
    >
      <div
        ref={listRef}
        className="sticky top-(--header-h) max-h-[calc(100dvh-var(--header-h))] overflow-y-auto py-3"
      >
        <h2 className="px-3 pb-2 text-label font-demi text-ink">
          {t("Prosedur terkait")}
        </h2>

        {processesWithProcedures().map((process) => {
          const entries = procedures.filter(
            ({ procedure }) => procedure.p === process.id,
          );
          const holdsActive = entries.some(({ id }) => id === activeId);

          return (
            <section key={process.id} className="mb-3">
              {/* The group heading goes back up to the swimlane it details. */}
              <Link
                to={level1Url(process.id)}
                className={`flex gap-1.5 px-3 pb-1 text-badge leading-tight font-demi tracking-wide hover:underline ${
                  holdsActive ? "text-ink" : "text-muted"
                }`}
              >
                <span className="tabular-nums">{process.id}</span>
                <span className="min-w-0">{process.name}</span>
              </Link>

              <ul>
                {entries.map(({ id, procedure }) => {
                  const isActive = id === activeId;
                  return (
                    <li key={id}>
                      <NavLink
                        to={`/level-2/${id}`}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex gap-2 px-3 py-1.5 text-table transition-colors hover:bg-paper ${
                          isActive ? "bg-paper" : ""
                        }`}
                        style={{ transitionDuration: "var(--hover-duration)" }}
                      >
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 w-1 shrink-0 self-stretch ${
                            isActive ? "bg-cobalt" : "bg-transparent"
                          }`}
                        />
                        <span className="flex min-w-0 flex-col">
                          <span className="text-badge font-demi tabular-nums text-cobalt">
                            {procedure.doc}
                          </span>
                          <span
                            className={`leading-snug ${
                              isActive ? "font-demi text-ink" : "text-ink/85"
                            }`}
                          >
                            {procedure.n}
                          </span>
                        </span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </nav>
  );
}
