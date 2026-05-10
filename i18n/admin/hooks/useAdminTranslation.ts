import { useCallback, useMemo } from 'react';
import { useAdminDisplayLanguage } from '../../../contexts/AdminDisplaySettingsContext';
import { adminLocaleRegistry } from '../registry';
import type { AdminDisplayLanguage } from '../types';

type Registry = typeof adminLocaleRegistry;
export type AdminTranslationNamespace = keyof Registry;

function applyVars(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(String(v));
  }
  return out;
}

export function useAdminTranslation<N extends AdminTranslationNamespace>(namespace: N) {
  const language = useAdminDisplayLanguage();
  const lang: AdminDisplayLanguage = language === 'fr' ? 'fr' : 'en';

  const table = useMemo(
    () => adminLocaleRegistry[namespace][lang] as Record<string, string>,
    [namespace, lang]
  );

  const t = useCallback(
    (key: keyof (typeof adminLocaleRegistry)[N]['en'], vars?: Record<string, string | number>) => {
      const raw = table[key as string];
      if (raw === undefined) return String(key);
      return applyVars(raw, vars);
    },
    [table]
  );

  return { t, language: lang, table };
}
