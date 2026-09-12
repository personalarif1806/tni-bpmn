import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";

/**
 * Print mode is URL state — `?print=all` renders the all-processes layout
 * (PRD 14). Opening that link just shows the print view; only pressing the
 * toolbar button opens the browser's print dialog, so the URL stays shareable
 * and can be rendered to PDF headlessly.
 */
export function usePrintMode(): {
  printAll: boolean;
  startPrintAll: () => void;
  printPage: () => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();
  const printAll = searchParams.get("print") === "all";
  const requested = useRef(false);

  useEffect(() => {
    if (!printAll || !requested.current) return;
    requested.current = false;

    const clear = () => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete("print");
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    };

    window.addEventListener("afterprint", clear);
    // Let the 20 diagrams lay out before the dialog measures the page.
    const timer = window.setTimeout(() => window.print(), 200);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", clear);
    };
  }, [printAll, setSearchParams]);

  return {
    printAll,
    startPrintAll: () => {
      requested.current = true;
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("print", "all");
          return next;
        },
        { preventScrollReset: true },
      );
    },
    printPage: () => window.print(),
  };
}
