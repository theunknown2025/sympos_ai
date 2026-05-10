import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useAdminDisplaySettings } from '../../../contexts/AdminDisplaySettingsContext';
import { getDisplaySettingsCopy } from '../../../i18n/adminHeaderLabels';
import type { AdminDisplayLanguage } from '../../../i18n/admin/types';

interface AdminDisplaySettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const AdminDisplaySettingsModal: React.FC<AdminDisplaySettingsModalProps> = ({
  open,
  onClose,
}) => {
  const {
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
  } = useAdminDisplaySettings();

  const copy = getDisplaySettingsCopy(language);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      resetDraftFromSaved();
      clearSaveError();
      clearLastSavedMessage();
    }
    wasOpen.current = open;
  }, [open, resetDraftFromSaved, clearSaveError, clearLastSavedMessage]);

  if (!open) return null;

  const toggle = (lang: AdminDisplayLanguage) => setDraftLanguage(lang);

  const handleSave = async () => {
    clearSaveError();
    await saveDraft();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div
        className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden"
        role="dialog"
        aria-labelledby="display-settings-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 id="display-settings-title" className="text-lg font-semibold text-slate-900">
            {copy.modalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={copy.cancel}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {loadError && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              {copy.loadFailed} {loadError}
            </p>
          )}

          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">{copy.language}</p>
            <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
              <button
                type="button"
                onClick={() => toggle('en')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  draftLanguage === 'en'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {copy.english}
              </button>
              <button
                type="button"
                onClick={() => toggle('fr')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  draftLanguage === 'fr'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {copy.french}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">{copy.hint}</p>

          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {copy.saveFailed}
              <span className="block mt-1 font-mono text-xs opacity-90">{saveError}</span>
            </p>
          )}

          {lastSavedMessage && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              {copy.saved}
            </p>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {copy.save}
          </button>
        </div>
      </div>
    </div>
  );
};
