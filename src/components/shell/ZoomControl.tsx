import { Maximize2, Minus, Plus } from "lucide-react";
import { clampZoom, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from "@/lib/zoom";
import { t } from "@/lib/i18n";

/**
 * Zoom read-out and stepper for the Level 0 map (PRD 8.2). Presentational —
 * the map owns the zoom state.
 */
export function ZoomControl({
  zoom,
  onZoomChange,
  onFit,
  disabled = false,
}: {
  zoom: number;
  onZoomChange?: (zoom: number) => void;
  onFit?: () => void;
  disabled?: boolean;
}) {
  const percent = Math.round(zoom * 100);

  return (
    <div className="flex h-8 items-center border border-line bg-white">
      <button
        type="button"
        aria-label={t("Perkecil peta")}
        disabled={disabled || zoom <= ZOOM_MIN}
        onClick={() => onZoomChange?.(clampZoom(zoom - ZOOM_STEP))}
        className="flex h-full w-8 items-center justify-center text-muted transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
        style={{ transitionDuration: "var(--hover-duration)" }}
      >
        <Minus size={14} aria-hidden="true" />
      </button>
      <span
        aria-live="polite"
        className="w-12 border-x border-line text-center text-label font-medium tabular-nums"
      >
        {percent}%
      </span>
      <button
        type="button"
        aria-label={t("Perbesar peta")}
        disabled={disabled || zoom >= ZOOM_MAX}
        onClick={() => onZoomChange?.(clampZoom(zoom + ZOOM_STEP))}
        className="flex h-full w-8 items-center justify-center text-muted transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
        style={{ transitionDuration: "var(--hover-duration)" }}
      >
        <Plus size={14} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label={t("Sesuaikan peta dengan lebar layar")}
        title={t("Muat layar")}
        disabled={disabled}
        onClick={() => onFit?.()}
        className="flex h-full w-8 items-center justify-center border-l border-line text-muted transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
        style={{ transitionDuration: "var(--hover-duration)" }}
      >
        <Maximize2 size={13} aria-hidden="true" />
      </button>
    </div>
  );
}
