import { type RefObject } from "react";
import { EdgeMarkers, SwimlaneEdge } from "@/components/level1/SwimlaneEdge";
import { SwimlaneNode } from "@/components/level1/SwimlaneNode";
import {
  LANE_HEADER_WIDTH,
  LANE_HEIGHT,
  type SwimlaneLayout,
} from "@/lib/layout-l1";
import { t } from "@/lib/i18n";

/**
 * The swimlane diagram — PRD 8.8. The lane header column is HTML pinned with
 * `position: sticky`, so it stays put while the diagram scrolls sideways; the
 * SVG behind it carries the full-width lane bands, edges and nodes.
 */
export function Swimlane({
  layout,
  selectedKey,
  highlighted,
  onSelect,
  scrollRef,
}: {
  layout: SwimlaneLayout;
  selectedKey: string | null;
  /** Steps named by `?steps=` when arriving from Level 0. */
  highlighted: ReadonlySet<string>;
  onSelect: (stepKey: string) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
}) {
  const laneName = (index: number) => layout.lanes[index]?.name ?? "";

  return (
    <div
      ref={scrollRef}
      data-swimlane=""
      className="overflow-x-auto border border-line bg-white"
    >
      <div
        className="relative"
        style={{ width: layout.width, height: layout.height }}
      >
        <svg
          className="absolute inset-0"
          width={layout.width}
          height={layout.height}
          role="group"
          aria-label={`${t("Diagram swimlane dengan")} ${layout.lanes.length} ${t("lajur dan")} ${layout.nodes.length} ${t("langkah")}`}
        >
          <EdgeMarkers />

          {layout.lanes.map((lane) => (
            <g key={lane.id}>
              <rect
                x={0}
                y={lane.y}
                width={layout.width}
                height={LANE_HEIGHT}
                fill={
                  lane.index % 2 === 0 ? "var(--color-paper)" : "transparent"
                }
              />
              <line
                x1={0}
                y1={lane.y}
                x2={layout.width}
                y2={lane.y}
                stroke="var(--color-line)"
                strokeWidth={1}
              />
            </g>
          ))}
          <line
            x1={0}
            y1={layout.height}
            x2={layout.width}
            y2={layout.height}
            stroke="var(--color-line)"
            strokeWidth={1}
          />

          {layout.edges.map((edge) => (
            <SwimlaneEdge
              key={edge.id}
              edge={edge}
              dimmed={
                selectedKey !== null &&
                edge.from !== selectedKey &&
                edge.to !== selectedKey
              }
            />
          ))}

          {layout.nodes.map((node) => (
            <SwimlaneNode
              key={node.key}
              node={node}
              laneName={laneName(node.laneIndex)}
              selected={node.key === selectedKey}
              highlighted={highlighted.has(node.key)}
              dimmed={selectedKey !== null && node.key !== selectedKey}
              onSelect={onSelect}
            />
          ))}
        </svg>

        {/* Sticky lane headers, drawn over the left edge of the diagram. */}
        <div
          className="sticky left-0 z-10 w-(--lane-header-width)"
          style={
            {
              height: layout.height,
              "--lane-header-width": `${LANE_HEADER_WIDTH}px`,
            } as React.CSSProperties
          }
        >
          {layout.lanes.map((lane) => (
            <div
              key={lane.id}
              className={`flex flex-col justify-center gap-0.5 border-r border-b border-white/20 px-3 ${
                lane.external ? "bg-cobalt" : "bg-navy"
              }`}
              style={{ height: LANE_HEIGHT }}
            >
              <span className="text-label leading-tight font-demi text-white">
                {lane.name}
              </span>
              {lane.org ? (
                <span className="text-badge leading-tight text-white/70">
                  {lane.org}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
