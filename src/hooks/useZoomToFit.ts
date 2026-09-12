import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { clampZoom } from "@/lib/zoom";

export interface ZoomState {
  zoom: number;
  /** True when the change came from the zoom control, not a resize (PRD 10). */
  animated: boolean;
  setZoom: (zoom: number) => void;
  /** Back to fit-to-width, and resume following the window size. */
  fitToWidth: () => void;
}

/**
 * Map zoom: fit to the viewport width on load, and keep re-fitting on resize
 * until the user zooms manually (PRD 8.2).
 *
 * `measureRef` must point at an element that does not scroll. Measuring the
 * scroll container itself closes a loop: its scrollbar subtracts from the
 * clientWidth that decides the zoom, the new zoom resizes the content, and the
 * scrollbar that started it comes and goes every frame.
 */
export function useZoomToFit(
  measureRef: RefObject<HTMLElement | null>,
  contentWidth: number,
  gutter = 0,
): ZoomState {
  const [zoom, setZoomValue] = useState(1);
  const [animated, setAnimated] = useState(false);
  const isManual = useRef(false);

  const computeFit = useCallback(() => {
    const element = measureRef.current;
    if (!element) return 1;
    return clampZoom((element.clientWidth - gutter) / contentWidth);
  }, [contentWidth, gutter, measureRef]);

  useLayoutEffect(() => {
    const element = measureRef.current;
    if (!element) return;

    const refit = () => {
      if (isManual.current) return;
      setAnimated(false);
      setZoomValue(computeFit());
    };

    refit();
    const observer = new ResizeObserver(refit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [computeFit, measureRef]);

  const setZoom = useCallback((next: number) => {
    isManual.current = true;
    setAnimated(true);
    setZoomValue(clampZoom(next));
  }, []);

  const fitToWidth = useCallback(() => {
    isManual.current = false;
    setAnimated(true);
    setZoomValue(computeFit());
  }, [computeFit]);

  return { zoom, animated, setZoom, fitToWidth };
}
