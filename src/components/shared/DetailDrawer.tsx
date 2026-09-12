import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMotionConfig } from "@/hooks/useMotionConfig";
import {
  PANEL_FULL_WIDTH_QUERY,
  PANEL_SHRINK_QUERY,
  PANEL_WIDTH,
} from "@/lib/panel";

/**
 * The detail panel — PRD 8.4. One drawer, three content variants. It is a
 * non-modal dialog: the map stays usable behind it, but Escape closes it and
 * focus returns to whatever opened it.
 */
export function DetailDrawer({
  eyebrow,
  title,
  contentKey,
  nav,
  onClose,
  children,
}: {
  /** Panel type: Tahapan, Unit, Departemen. */
  eyebrow: string;
  title: string;
  /** Changing this cross-fades the body while the header stays put. */
  contentKey: string;
  /** Prev/next controls, for the stage variant. */
  nav?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const { duration, ease, offset } = useMotionConfig();
  const closeRef = useRef<HTMLButtonElement>(null);
  const isFullWidth = useMediaQuery(PANEL_FULL_WIDTH_QUERY);
  const overlays = !useMediaQuery(PANEL_SHRINK_QUERY);

  // Focus moves to the close button on open and back to the trigger on close.
  useEffect(() => {
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeRef.current?.focus();

    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      {overlays ? (
        <motion.div
          aria-hidden="true"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration.overlay, ease: ease.out }}
          className="fixed inset-0 z-30 bg-ink/25 print:hidden"
        />
      ) : null}

      <motion.div
        role="dialog"
        aria-modal="false"
        aria-labelledby="detail-panel-title"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: duration.panel, ease: ease.panel }}
        className="fixed right-0 z-40 flex flex-col border-l border-line bg-white shadow-[0_0_24px_rgba(18,18,58,0.14)] print:hidden"
        style={{
          top: isFullWidth ? 0 : "var(--header-h)",
          bottom: 0,
          // Pinning both edges rather than using 100vw: the page reserves a
          // scrollbar gutter, so 100vw is wider than the usable viewport.
          left: isFullWidth ? 0 : undefined,
          width: isFullWidth ? undefined : PANEL_WIDTH,
        }}
      >
        <header className="flex items-start gap-2 border-b border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-badge font-medium text-cobalt">{eyebrow}</p>
            <h2
              id="detail-panel-title"
              className="text-title leading-tight font-demi"
            >
              {title}
            </h2>
          </div>

          {nav}

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup panel detail"
            className="flex h-8 w-8 shrink-0 items-center justify-center border border-line text-muted transition-colors hover:bg-paper"
            style={{ transitionDuration: "var(--hover-duration)" }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={contentKey}
              initial={{ opacity: 0, y: offset.panelContent }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  duration: duration.panelContentIn,
                  ease: ease.out,
                },
              }}
              exit={{
                opacity: 0,
                transition: { duration: duration.panelContentOut },
              }}
              className="flex flex-col gap-5 px-4 py-4"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
