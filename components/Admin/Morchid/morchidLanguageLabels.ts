import type { MorchidLanguage } from './types';

export const MORCHID_LANGUAGES: MorchidLanguage[] = ['en', 'fr', 'ar'];

export function getMorchidLanguageLabel(
  lang: MorchidLanguage,
  labels: { languageEn: string; languageFr: string; languageAr: string }
): string {
  if (lang === 'en') return labels.languageEn;
  if (lang === 'fr') return labels.languageFr;
  return labels.languageAr;
}
