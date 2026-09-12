import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { parseOrigin, type Origin } from "@/lib/cross-level";

export type PanelKind = "stage" | "unit" | "dept";

export interface PanelTarget {
  kind: PanelKind;
  id: string;
}

export interface DetailPanelState {
  target: PanelTarget | null;
  origin: Origin | null;
  /** Open a panel; adds a history entry so Back closes it. */
  open: (kind: PanelKind, id: string) => void;
  /** Swap the panel contents in place — used by prev/next stage stepping. */
  replace: (kind: PanelKind, id: string) => void;
  close: () => void;
}

const PANEL_PARAMS: Record<PanelKind, string> = {
  stage: "stage",
  unit: "unit",
  dept: "dept",
};

/**
 * The detail panel is URL state: `?stage=`, `?unit=` or `?dept=` (PRD 7.1).
 * Opening and closing is a route change, so deep links and Back both work.
 */
export function useDetailPanel(): DetailPanelState {
  const [searchParams, setSearchParams] = useSearchParams();

  const target = useMemo<PanelTarget | null>(() => {
    const stage = searchParams.get(PANEL_PARAMS.stage);
    if (stage) return { kind: "stage", id: stage };

    const unit = searchParams.get(PANEL_PARAMS.unit);
    if (unit) return { kind: "unit", id: unit };

    const department = searchParams.get(PANEL_PARAMS.dept);
    if (department) return { kind: "dept", id: department };

    return null;
  }, [searchParams]);

  const origin = useMemo(
    () => parseOrigin(searchParams.get("from")),
    [searchParams],
  );

  const setPanel = useCallback(
    (kind: PanelKind, id: string, replace: boolean) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const param of Object.values(PANEL_PARAMS)) next.delete(param);
          next.set(PANEL_PARAMS[kind], id);
          return next;
        },
        { replace, preventScrollReset: true },
      );
    },
    [setSearchParams],
  );

  const open = useCallback(
    (kind: PanelKind, id: string) => setPanel(kind, id, false),
    [setPanel],
  );

  const replace = useCallback(
    (kind: PanelKind, id: string) => setPanel(kind, id, true),
    [setPanel],
  );

  const close = useCallback(() => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const param of Object.values(PANEL_PARAMS)) next.delete(param);
        next.delete("from");
        return next;
      },
      { preventScrollReset: true },
    );
  }, [setSearchParams]);

  return { target, origin, open, replace, close };
}
