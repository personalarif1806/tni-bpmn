/**
 * Straight-line connectors on the map. All of them are plain SVG at exact pixel
 * positions from `layout-l0.ts`, so nothing scales independently of the canvas.
 */

/** Flow arrow between a support band and the core process. */
export function FlowArrow({ direction }: { direction: "down" | "up" }) {
  const isDown = direction === "down";

  return (
    <svg
      width="10"
      height="24"
      viewBox="0 0 10 24"
      aria-hidden="true"
      className="shrink-0"
    >
      <line
        x1="5"
        y1={isDown ? 0 : 24}
        x2="5"
        y2={isDown ? 18 : 6}
        stroke="var(--color-teal)"
        strokeWidth="1.5"
      />
      <polygon
        points={isDown ? "0,16 10,16 5,24" : "0,8 10,8 5,0"}
        fill="var(--color-teal)"
      />
    </svg>
  );
}

/** Yellow arrow between two value-chain stages. */
export function ValueChainArrow({ width }: { width: number }) {
  return (
    <svg
      width={width}
      height="12"
      viewBox={`0 0 ${width} 12`}
      aria-hidden="true"
      className="shrink-0"
    >
      <line
        x1="0"
        y1="6"
        x2={width - 8}
        y2="6"
        stroke="var(--color-yellow)"
        strokeWidth="2"
      />
      <polygon
        points={`${width - 10},1 ${width},6 ${width - 10},11`}
        fill="var(--color-yellow)"
      />
    </svg>
  );
}

/** Horizontal arrow in and out of the external columns. */
export function ExternalArrow({ width }: { width: number }) {
  return (
    <svg
      width={width}
      height="10"
      viewBox={`0 0 ${width} 10`}
      aria-hidden="true"
    >
      <line
        x1="0"
        y1="5"
        x2={width - 7}
        y2="5"
        stroke="var(--color-teal)"
        strokeWidth="1.5"
      />
      <polygon
        points={`${width - 9},1 ${width},5 ${width - 9},9`}
        fill="var(--color-teal)"
      />
    </svg>
  );
}
