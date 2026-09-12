/** Zoom range for the Level 0 map — PRD 8.2 (20–150%, default fit to screen). */

export const ZOOM_MIN = 0.2;
export const ZOOM_MAX = 1.5;
export const ZOOM_STEP = 0.1;

export function clampZoom(zoom: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}
