import { motion } from "motion/react";
import { useMotionConfig } from "@/hooks/useMotionConfig";
import type { SwimlaneNode as NodeModel } from "@/lib/layout-l1";

/**
 * One swimlane node — PRD 8.8. The shape is drawn in SVG; a transparent button
 * sits on top of it inside a foreignObject, so the node is a real button with a
 * visible focus ring and its label wraps like ordinary text.
 */
export function SwimlaneNode({
  node,
  laneName,
  selected,
  highlighted,
  dimmed,
  onSelect,
}: {
  node: NodeModel;
  laneName: string;
  selected: boolean;
  /** Arrived here from Level 0 with this step in `?steps=`. */
  highlighted: boolean;
  dimmed: boolean;
  onSelect: (stepKey: string) => void;
}) {
  const { x, y, width, height, cx, cy, shape, step } = node;
  const { duration, ease } = useMotionConfig();

  const outline = selected
    ? { stroke: "var(--color-cobalt)", width: 3 }
    : highlighted
      ? { stroke: "var(--color-orange)", width: 3 }
      : { stroke: "var(--color-navy)", width: 1 };

  // The diamond narrows towards its points, so its label gets a tighter box.
  const labelInset = shape === "decision" ? 18 : 6;

  const kindLabel =
    step.y === "s"
      ? "Pemicu"
      : step.y === "e"
        ? "Hasil akhir"
        : step.y === "d"
          ? "Keputusan"
          : "Aktivitas";

  return (
    <g className="swimlane-node" opacity={dimmed ? 0.3 : 1}>
      {shape === "decision" ? (
        <polygon
          points={`${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}`}
          className="swimlane-shape swimlane-shape-decision"
          fill="var(--color-yellow)"
          stroke={outline.stroke}
          strokeWidth={outline.width}
        />
      ) : (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={shape === "terminal" ? height / 2 : 0}
          className={`swimlane-shape swimlane-shape-${shape}`}
          fill={
            shape === "terminal" ? "var(--color-navy)" : "var(--color-cyan)"
          }
          stroke={outline.stroke}
          strokeWidth={outline.width}
        />
      )}

      {highlighted ? (
        <motion.rect
          x={x - 6}
          y={y - 6}
          width={width + 12}
          height={height + 12}
          fill="none"
          stroke="var(--color-orange)"
          strokeWidth={2}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0, 0.9, 0] }}
          transition={{
            duration: duration.pulse,
            times: [0, 0.25, 0.5, 0.75, 1],
            ease: ease.out,
          }}
          aria-hidden="true"
        />
      ) : null}

      <foreignObject
        x={x + labelInset}
        y={y}
        width={width - labelInset * 2}
        height={height}
      >
        <button
          type="button"
          onClick={() => onSelect(node.key)}
          aria-pressed={selected}
          aria-label={`${node.number ? `${node.number}, ` : ""}${kindLabel}: ${step.t}, pelaksana ${laneName}`}
          className={`flex h-full w-full flex-col items-center justify-center gap-0.5 px-1 text-center leading-tight ${
            shape === "terminal" ? "text-white" : "text-navy"
          }`}
        >
          {node.number ? (
            <span className="text-badge font-demi tabular-nums opacity-70">
              {node.number}
            </span>
          ) : null}
          <span className="text-badge font-medium">{step.t}</span>
        </button>
      </foreignObject>
    </g>
  );
}
