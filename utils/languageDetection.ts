/**
 * Detects if a text contains Arabic characters
 * Arabic Unicode range: U+0600 to U+06FF
 */
export const isArabic = (text: string): boolean => {
  if (!text) return false;
  // Check if text contains Arabic characters
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
};

