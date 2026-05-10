export type AdminDisplayLanguage = 'en' | 'fr';

/** Every page namespace must expose the same keys in `en` and `fr`. */
export type AdminLocaleBundle<T extends Record<string, string>> = {
  en: T;
  fr: T;
};
