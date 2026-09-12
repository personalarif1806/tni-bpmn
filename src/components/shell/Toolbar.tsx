import { createContext, use, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * The header toolbar is one slot whose contents belong to the active level
 * (PRD 8.1). Pages fill it by rendering `<ToolbarSlot>`; the shell owns the
 * container so the header layout stays in one place.
 */
const ToolbarContainerContext = createContext<HTMLDivElement | null>(null);

export function ToolbarContainerProvider({
  container,
  children,
}: {
  container: HTMLDivElement | null;
  children: ReactNode;
}) {
  return (
    <ToolbarContainerContext value={container}>
      {children}
    </ToolbarContainerContext>
  );
}

/** Renders its children into the header toolbar of the active level. */
export function ToolbarSlot({ children }: { children: ReactNode }) {
  const container = use(ToolbarContainerContext);
  if (!container) return null;
  return createPortal(children, container);
}

export function ToolbarGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-1">{children}</div>;
}

export function ToolbarDivider() {
  return <span aria-hidden="true" className="mx-1 h-6 w-px bg-line" />;
}

export function ToolbarButton({
  icon,
  label,
  onClick,
  disabled = false,
  title,
  pressed,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  /** Present when the button toggles something; drives `aria-pressed`. */
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={title ?? label}
      className={`flex h-8 items-center gap-1.5 border px-2.5 text-label font-medium transition-colors disabled:cursor-not-allowed disabled:text-muted disabled:opacity-60 disabled:hover:bg-white ${
        pressed
          ? "border-orange bg-orange/15 text-ink"
          : "border-line bg-white text-ink hover:bg-paper"
      }`}
      style={{ transitionDuration: "var(--hover-duration)" }}
    >
      <span aria-hidden="true" className={pressed ? "text-orange-ink" : "text-muted"}>
        {icon}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
