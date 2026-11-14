/** Plain-text excerpt from opportunity HTML description. */
export function opportunityDescriptionExcerpt(html?: string, maxLength = 140): string {
  if (!html?.trim()) return '';
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}
