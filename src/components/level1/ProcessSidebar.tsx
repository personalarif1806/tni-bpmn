import { NavLink } from "react-router";
import { listProcessGroups } from "@/data";
import { GROUP_ACCENT } from "@/lib/process-groups";
import { t } from "@/lib/i18n";

/**
 * Sidebar listing all 20 processes, grouped M / G / C / S (PRD 8.8).
 * Below 900px the page swaps this for a dropdown in the toolbar.
 */
export function ProcessSidebar({ activeId }: { activeId?: string }) {
  return (
    <nav
      aria-label={t("Daftar proses Level 1")}
      className="w-64 shrink-0 border-r border-line bg-white print:hidden"
    >
      <div className="sticky top-(--header-h) max-h-[calc(100dvh-var(--header-h))] overflow-y-auto py-3">
        {listProcessGroups().map((group) => (
          <section key={group.id} className="mb-3">
            <h2 className="px-3 pb-1 text-badge font-demi tracking-wide text-muted">
              {group.id} · {group.group.n}
            </h2>
            <ul>
              {group.processes.map((process) => {
                const isActive = process.id === activeId;
                return (
                  <li key={process.id}>
                    <NavLink
                      to={`/level-1/${process.id}`}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex gap-2 px-3 py-1.5 text-table transition-colors hover:bg-paper ${
                        isActive ? "bg-paper font-demi text-ink" : "text-ink/85"
                      }`}
                      style={{ transitionDuration: "var(--hover-duration)" }}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 h-4 w-1 shrink-0 ${
                          isActive ? GROUP_ACCENT[group.id].bar : "bg-transparent"
                        }`}
                      />
                      <span className="font-demi tabular-nums">
                        {process.id}
                      </span>
                      <span className="min-w-0">{process.name}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}
