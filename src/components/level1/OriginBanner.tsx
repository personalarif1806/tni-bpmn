import { motion } from "motion/react";
import { ReturnLink } from "@/components/shared/CrossLevelLink";
import { useMotionConfig } from "@/hooks/useMotionConfig";
import { originLabel, originUrl, type Origin } from "@/lib/cross-level";

/**
 * Origin banner — PRD 9 and 10. Shown when a process was opened from Level 0;
 * it expands with a height and fade transition and offers the way back.
 */
export function OriginBanner({
  origin,
  processId,
}: {
  origin: Origin;
  processId: string;
}) {
  const { duration, ease } = useMotionConfig();
  const label = originLabel(origin);
  if (!label) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      transition={{ duration: duration.banner, ease: ease.out }}
      className="overflow-hidden print:hidden"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-l-4 border-yellow bg-yellow/15 px-3 py-2">
        <p className="text-table text-ink">
          Dibuka dari Level 0:{" "}
          <span className="font-demi">
            {label.code ? `${label.code} · ` : ""}
            {label.title}
          </span>
        </p>
        <ReturnLink
          to={originUrl(origin, { kind: "process", id: processId })}
          label="Kembali ke Level 0"
        />
      </div>
    </motion.div>
  );
}
