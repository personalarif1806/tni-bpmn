import {
  ProcessArchitecture,
  ProcessIndexTable,
} from "@/components/level1/ProcessArchitecture";
import { ProcessInfoCard } from "@/components/level1/ProcessInfoCard";
import { StepTable } from "@/components/level1/StepTable";
import { Swimlane } from "@/components/level1/Swimlane";
import { processes } from "@/data";
import { buildSwimlaneLayout } from "@/lib/layout-l1";
import { GROUP_ACCENT } from "@/lib/process-groups";

const EMPTY = new Set<string>();
const noop = () => {};

/**
 * Every Level 1 process, one per page, behind the architecture page — PRD 14.
 * Hidden on screen; only the print stylesheet reveals it.
 */
export function PrintAllProcesses() {
  return (
    <div className="hidden print:block">
      <section>
        <h1 className="text-display font-demi">
          Arsitektur proses Level 1 — PT TÜV NORD Indonesia
        </h1>
        <div className="mt-4">
          <ProcessArchitecture />
        </div>
        <div className="mt-6">
          <ProcessIndexTable />
        </div>
      </section>

      {processes.map((process) => {
        const layout = buildSwimlaneLayout(process);

        return (
          <section
            key={process.id}
            className="print-break-before flex flex-col gap-3 pt-4"
          >
            <header className="flex flex-col gap-1">
              <p className="text-badge text-muted">{process.l0}</p>
              <div className="flex items-baseline gap-2">
                <span
                  className={`px-2 py-0.5 text-label font-demi tabular-nums ${GROUP_ACCENT[process.g].chip}`}
                >
                  {process.id}
                </span>
                <h2 className="text-title font-demi">{process.name}</h2>
              </div>
              <p className="text-table text-ink/85">{process.purpose}</p>
            </header>

            <ProcessInfoCard process={process} layout={layout} />

            <Swimlane
              layout={layout}
              selectedKey={null}
              highlighted={EMPTY}
              onSelect={noop}
              scrollRef={{ current: null }}
            />

            <StepTable
              process={process}
              layout={layout}
              selectedKey={null}
              highlighted={EMPTY}
              origin={{ kind: "process", id: process.id }}
              onSelect={noop}
            />
          </section>
        );
      })}
    </div>
  );
}
