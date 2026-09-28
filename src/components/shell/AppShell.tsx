import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { LanguageToggle } from "@/components/shell/LanguageToggle";
import { LevelTabs } from "@/components/shell/LevelTabs";
import { SearchBox } from "@/components/shell/SearchBox";
import { ToolbarContainerProvider } from "@/components/shell/Toolbar";
import { useMotionConfig } from "@/hooks/useMotionConfig";
import { levelFromPathname } from "@/lib/levels";
import { t } from "@/lib/i18n";

/**
 * Application frame: sticky white header with the title, the level switch, and
 * a toolbar slot the active level fills (PRD 8.1). The level swap cross-fades
 * per PRD section 10.
 */
export function AppShell() {
  const { pathname } = useLocation();
  const level = levelFromPathname(pathname);
  const [toolbar, setToolbar] = useState<HTMLDivElement | null>(null);
  const { duration, ease, offset, cssDuration } = useMotionConfig();

  return (
    <div
      className="min-h-dvh bg-paper text-ink"
      style={
        {
          "--hover-duration": cssDuration("hover"),
        } as React.CSSProperties
      }
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:border focus:border-cobalt focus:bg-white focus:px-3 focus:py-2 focus:text-label focus:font-medium"
      >
        {t("Lewati ke konten utama")}
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-white max-[899px]:static print:hidden">
        <div className="flex h-(--header-h) items-stretch gap-2 pr-3 pl-4 md:gap-4">
          <div className="flex min-w-0 flex-col justify-center">
            <span className="truncate text-title font-demi tracking-tight">
              {t("Peta Proses Bisnis")}
            </span>
            <span className="truncate text-label text-muted">
              PT TÜV NORD Indonesia
            </span>
          </div>

          <span aria-hidden="true" className="my-3 w-px shrink-0 bg-line" />

          <LevelTabs />

          <SearchBox />

          {/* min-w-0 so the toolbar can shrink and scroll itself on a narrow
              screen rather than widening the header. */}
          <div
            ref={setToolbar}
            className="ml-auto flex min-w-0 items-center gap-1.5 overflow-x-auto"
          />

          {/* Outside the toolbar slot: the language switch belongs to the app,
              not to whichever level happens to be open. */}
          <div className="flex shrink-0 items-center self-center">
            <LanguageToggle />
          </div>
        </div>
      </header>

      <ToolbarContainerProvider container={toolbar}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={level}
            id="main"
            initial={{ opacity: 0, y: offset.level }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: duration.levelIn, ease: ease.out },
            }}
            exit={{
              opacity: 0,
              transition: { duration: duration.levelOut, ease: ease.out },
            }}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </ToolbarContainerProvider>
    </div>
  );
}
