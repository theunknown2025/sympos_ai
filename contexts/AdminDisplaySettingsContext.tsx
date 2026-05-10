import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AdminDisplayLanguage } from '../i18n/admin/types';

type AdminDisplaySettingsContextValue = {
  language: AdminDisplayLanguage;
  /** Draft in modal before save */
  setDraftLanguage: (lang: AdminDisplayLanguage) => void;
  draftLanguage: AdminDisplayLanguage;
  saveDraft: () => Promise<boolean>;
  saveError: string | null;
  clearSaveError: () => void;
  loadError: string | null;
  lastSavedMessage: string | null;
  clearLastSavedMessage: () => void;
  resetDraftFromSaved: () => void;
};

const AdminDisplaySettingsContext = createContext<AdminDisplaySettingsContextValue | null>(null);

export function AdminDisplaySettingsProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const [language, setLanguage] = useState<AdminDisplayLanguage>('en');
  const [draftLanguage, setDraftLanguage] = useState<AdminDisplayLanguage>('en');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = language === 'fr' ? 'fr' : 'en';
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError(null);
      try {
        const r = await fetch(
          `/api/admin-display-config?userId=${encodeURIComponent(userId)}`
        );
        const body = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (!r.ok) {
          setLoadError(typeof body.error === 'string' ? body.error : 'Load failed');
          return;
        }
        if (body.language === 'fr' || body.language === 'en') {
          setLanguage(body.language);
          setDraftLanguage(body.language);
        }
      } catch {
        if (!cancelled) setLoadError('Load failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const clearSaveError = useCallback(() => setSaveError(null), []);
  const clearLastSavedMessage = useCallback(() => setLastSavedMessage(null), []);

  const resetDraftFromSaved = useCallback(() => {
    setDraftLanguage(language);
    setSaveError(null);
  }, [language]);

  const saveDraft = useCallback(async () => {
    setSaveError(null);
    setLastSavedMessage(null);
    try {
      const r = await fetch('/api/admin-display-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, language: draftLanguage }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        setSaveError(typeof body.error === 'string' ? body.error : `HTTP ${r.status}`);
        return false;
      }
      setLanguage(draftLanguage);
      setLastSavedMessage('saved');
      return true;
    } catch {
      setSaveError('Network error');
      return false;
    }
  }, [userId, draftLanguage]);

  const value = useMemo(
    () => ({
      language,
      draftLanguage,
      setDraftLanguage,
      saveDraft,
      saveError,
      clearSaveError,
      loadError,
      lastSavedMessage,
      clearLastSavedMessage,
      resetDraftFromSaved,
    }),
    [
      language,
      draftLanguage,
      saveDraft,
      saveError,
      clearSaveError,
      loadError,
      lastSavedMessage,
      clearLastSavedMessage,
      resetDraftFromSaved,
    ]
  );

  return (
    <AdminDisplaySettingsContext.Provider value={value}>
      {children}
    </AdminDisplaySettingsContext.Provider>
  );
}

export function useAdminDisplaySettings(): AdminDisplaySettingsContextValue {
  const ctx = useContext(AdminDisplaySettingsContext);
  if (!ctx) {
    throw new Error('useAdminDisplaySettings must be used within AdminDisplaySettingsProvider');
  }
  return ctx;
}

/** Language for admin i18n (`useAdminTranslation`). Safe outside the provider (e.g. public `/p/` pages). */
export function useAdminDisplayLanguage(): AdminDisplayLanguage {
  const ctx = useContext(AdminDisplaySettingsContext);
  if (ctx) return ctx.language;
  if (typeof navigator !== 'undefined') {
    const nav = navigator.language?.toLowerCase() ?? '';
    if (nav.startsWith('fr')) return 'fr';
  }
  return 'en';
}
