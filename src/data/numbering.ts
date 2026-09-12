import type { Process, Step } from "./types";

/** Start and end nodes carry no number (PRD 6.2). */
export function isNumberedStep(step: Step): boolean {
  return step.y !== "s" && step.y !== "e";
}

/**
 * Step key → step number, in step order, skipping start and end nodes:
 * `C4.2-01`, `C4.2-02`, …
 */
export function computeStepNumbers(
  processId: string,
  steps: readonly Step[],
): Record<string, string> {
  const numbers: Record<string, string> = {};
  let counter = 0;

  for (const step of steps) {
    if (!isNumberedStep(step)) continue;
    counter += 1;
    numbers[step.k] = `${processId}-${String(counter).padStart(2, "0")}`;
  }

  return numbers;
}

/** A process with its `num` map recomputed from its steps. */
export function withComputedNumbers(process: Process): Process {
  return { ...process, num: computeStepNumbers(process.id, process.steps) };
}

/**
 * Compact display of a run of step numbers: `C4.2-02–04` when contiguous,
 * `C4.2-02, C4.2-05` when not. Used by the Level 0 lane steps (PRD 8.2).
 */
export function formatNumberRange(numbers: readonly string[]): string {
  if (numbers.length === 0) return "";
  const first = numbers[0];
  if (numbers.length === 1) return first;

  const last = numbers[numbers.length - 1];
  const suffix = (value: string) => value.slice(value.lastIndexOf("-") + 1);
  const isContiguous = numbers.every((value, index) => {
    if (index === 0) return true;
    return Number(suffix(value)) === Number(suffix(numbers[index - 1])) + 1;
  });

  return isContiguous ? `${first}–${suffix(last)}` : numbers.join(", ");
}
