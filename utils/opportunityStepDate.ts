/** Normalize stored step date to YYYY-MM-DD for date inputs. */
export function opportunityStepDateInputValue(date?: string): string {
  if (!date?.trim()) return '';
  const d = date.trim();
  return d.length >= 10 ? d.slice(0, 10) : d;
}

/** Display label for timeline / preview (locale-aware). */
export function formatOpportunityStepDate(date?: string): string | null {
  const raw = opportunityStepDateInputValue(date);
  if (!raw) return null;
  const parsed = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
