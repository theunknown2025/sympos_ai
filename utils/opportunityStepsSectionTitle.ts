export const DEFAULT_OPPORTUNITY_STEPS_SECTION_TITLE = 'Process steps';

export function resolveOpportunityStepsSectionTitle(title?: string): string {
  const t = title?.trim();
  return t || DEFAULT_OPPORTUNITY_STEPS_SECTION_TITLE;
}
