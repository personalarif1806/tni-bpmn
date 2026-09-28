import { Link, useLocation } from "react-router";
import { motion } from "motion/react";
import { LEVELS, levelFromPathname } from "@/lib/levels";
import { useMotionConfig } from "@/hooks/useMotionConfig";
import { t } from "@/lib/i18n";

/**
 * Level 0 / Level 1 switch. These are real links, so browser back works and a
 * level can be opened in a new tab.
 */
export function LevelTabs() {
  const { pathname } = useLocation();
  const activeLevel = levelFromPathname(pathname);
  const { duration, ease } = useMotionConfig();

  return (
    <nav aria-label={t("Tingkat peta proses")} className="flex h-full items-stretch">
      {LEVELS.map((level) => {
        const isActive = level.id === activeLevel;
        return (
          <Link
            key={level.id}
            to={level.path}
            aria-current={isActive ? "page" : undefined}
            className={`relative flex flex-col justify-center px-3.5 text-left transition-colors md:px-4 ${
              isActive ? "text-cobalt" : "text-muted hover:text-ink"
            }`}
            style={{ transitionDuration: "var(--hover-duration)" }}
          >
            <span
              className={`text-body ${isActive ? "font-demi" : "font-medium"}`}
            >
              {level.label}
            </span>
            <span className="hidden text-label text-muted lg:block">
              {level.caption}
            </span>
            {isActive ? (
              <motion.span
                layoutId="level-tab-indicator"
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-0.5 bg-cobalt"
                transition={{ duration: duration.levelIn, ease: ease.out }}
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
