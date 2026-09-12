import { motion } from "motion/react";
import { useMapInteraction } from "@/components/level0/map-focus";
import { RasciBadge } from "@/components/shared/RasciBadge";
import { useMotionConfig } from "@/hooks/useMotionConfig";

/**
 * RASCI badge on an involved box — PRD 8.3. Appears with a short staggered
 * scale-in; it leaves without an exit animation when focus mode ends.
 */
export function FocusBadge({
  participantId,
  placement = "corner",
}: {
  participantId: string;
  /** `corner` sits outside the box edge; `inline` runs before a chip label. */
  placement?: "corner" | "inline";
}) {
  const { focus } = useMapInteraction();
  const { duration, ease, staggerFor } = useMotionConfig();

  const role = focus.roles.get(participantId);
  if (!focus.active || !role) return null;

  const delay = staggerFor(focus.count) * (focus.order.get(participantId) ?? 0);

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: duration.badge, delay, ease: ease.out }}
      className={
        placement === "corner"
          ? "pointer-events-none absolute -top-2 -right-2 z-10"
          : "inline-flex"
      }
    >
      <RasciBadge role={role} size="sm" />
    </motion.span>
  );
}

/**
 * Yellow outline on the selected stage. One shared `layoutId` means the outline
 * slides to the next stage instead of jumping (PRD 10).
 */
export function StageOutline({ stageId }: { stageId: string }) {
  const { focus } = useMapInteraction();
  const { duration, ease } = useMotionConfig();

  if (focus.stageId !== stageId) return null;

  return (
    <motion.span
      layoutId="stage-focus-outline"
      aria-hidden="true"
      transition={{ duration: duration.focusOn, ease: ease.out }}
      className="pointer-events-none absolute inset-0 z-10 border-[3px] border-yellow"
    />
  );
}
