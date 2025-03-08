/**
 * Steps available in the timetable personalization process
 */
export const STEPS = [
  "welcome",
  "import-file",
  "timeline",
  "file-it",
  "personalize",
  "print",
] as const;

export type Step = (typeof STEPS)[number];

/**
 * Get the next step in the sequence
 */
export function getNextStep(currentStep: Step): Step | null {
  const currentIndex = STEPS.indexOf(currentStep);
  if (currentIndex === STEPS.length - 1) return null;
  return STEPS[currentIndex + 1];
}

/**
 * Get the previous step in the sequence
 */
export function getPreviousStep(currentStep: Step): Step | null {
  const currentIndex = STEPS.indexOf(currentStep);
  if (currentIndex <= 0) return null;
  return STEPS[currentIndex - 1];
}

/**
 * Check if the current step is the first step
 */
export function isFirstStep(currentStep: Step): boolean {
  return STEPS.indexOf(currentStep) === 0;
}

/**
 * Check if the current step is the last step
 */
export function isLastStep(currentStep: Step): boolean {
  return STEPS.indexOf(currentStep) === STEPS.length - 1;
}
