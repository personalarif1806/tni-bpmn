import type { SwimlaneEdge as EdgeModel } from "@/lib/layout-l1";

/** Arrowhead markers, one per line colour. */
export function EdgeMarkers() {
  return (
    <defs>
      {[
        { id: "swimlane-arrow", color: "var(--color-navy)" },
        { id: "swimlane-arrow-loop", color: "var(--color-loop)" },
      ].map((marker) => (
        <marker
          key={marker.id}
          id={marker.id}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={marker.color} />
        </marker>
      ))}
    </defs>
  );
}

/**
 * One orthogonal connector — PRD 8.8. Backward flows are dashed red; branch
 * labels sit on the path in a small white box.
 */
export function SwimlaneEdge({
  edge,
  dimmed,
}: {
  edge: EdgeModel;
  /** True while another step is selected. */
  dimmed: boolean;
}) {
  const points = edge.points.map((point) => `${point.x},${point.y}`).join(" ");
  const color = edge.backward ? "var(--color-loop)" : "var(--color-navy)";

  return (
    <g opacity={dimmed ? 0.25 : 1}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={edge.backward ? 1.5 : 1.5}
        strokeDasharray={edge.backward ? "5 4" : undefined}
        markerEnd={`url(#${edge.backward ? "swimlane-arrow-loop" : "swimlane-arrow"})`}
      />

      {edge.label && edge.labelAt ? (
        <foreignObject
          x={edge.labelAt.x - 52}
          y={edge.labelAt.y - 11}
          width={104}
          height={22}
          className="pointer-events-none overflow-visible"
        >
          <div className="flex h-full items-center justify-center">
            <span
              className={`border bg-white px-1 text-badge leading-tight ${
                edge.backward
                  ? "border-loop text-loop"
                  : "border-line text-ink"
              }`}
            >
              {edge.label}
            </span>
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
}
