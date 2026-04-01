/**
 * Translation utility for section titles based on language code
 */

type LanguageCode = 'en' | 'fr' | 'ar';

const sectionTitles: Record<LanguageCode, Record<string, string>> = {
  en: {
    'profile': 'Profile',
    'education': 'Education',
    'experiences': 'Experiences',
    'publications': 'Publications',
    'certifications': 'Certifications',
    'media': 'Media',
    'blog': 'Blog',
  },
  fr: {
    'profile': 'Profil',
    'education': 'Éducation',
    'experiences': 'Expériences',
    'publications': 'Publications',
    'certifications': 'Certifications',
    'media': 'Médias',
    'blog': 'Blog',
  },
  ar: {
    'profile': 'الملف الشخصي',
    'education': 'التعليم',
    'experiences': 'الخبرات',
    'publications': 'المنشورات',
    'certifications': 'الشهادات',
    'media': 'الوسائط',
    'blog': 'المدونة',
  },
};

export const getSectionTitle = (sectionType: string, language: LanguageCode = 'en'): string => {
  return sectionTitles[language]?.[sectionType] || sectionTitles.en[sectionType] || sectionType;
};

export const getTranslatedSectionTitle = (
  sectionType: string,
  customTitle: string | undefined,
  language: LanguageCode = 'en'
): string => {
  // Get the default English title for this section type
  const defaultEnglishTitle = getSectionTitle(sectionType, 'en');
  
  // If language is not English and the title matches the default English title, translate it
  if (language !== 'en' && customTitle === defaultEnglishTitle) {
    return getSectionTitle(sectionType, language);
  }
  
  // If user has a custom title that doesn't match default, use it as is
  if (customTitle) {
    return customTitle;
  }
  
  // Otherwise, use the translated default title based on language
  return getSectionTitle(sectionType, language);
};
