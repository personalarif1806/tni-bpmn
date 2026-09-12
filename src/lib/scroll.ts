/** Scroll helpers — PRD 10: only scroll when the target is off screen. */

export function isOutsideViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return rect.bottom <= 0 || rect.top >= window.innerHeight;
}

/** Scrolls `element` into view, honouring the caller's motion preference. */
export function scrollToSection(
  element: Element | null,
  behavior: ScrollBehavior,
): void {
  element?.scrollIntoView({ behavior, block: "start" });
}

/** The same, but leaves the page alone if the target is already visible. */
export function scrollIntoViewIfNeeded(
  element: Element | null,
  behavior: ScrollBehavior,
): void {
  if (!element || !isOutsideViewport(element)) return;
  element.scrollIntoView({ behavior, block: "start" });
}
