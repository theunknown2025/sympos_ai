import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from 'lucide-react';
import type { HeroButton, LandingPageFormCategory, SubmissionActionTarget } from '../../../../types';
import { useAuth } from '../../../../hooks/useAuth';
import { useAdminTranslation } from '../../../../i18n/admin/hooks/useAdminTranslation';
import { uploadFileToStorage, uploadImageToStorage } from '../../../../services/storageService';
import {
  createDefaultSectionActionButton,
  filterFormsByCategory,
  resolveLandingPageActionTarget,
  resolveLandingPageAssetSource,
} from '../shared/landingPageActionButton';
import { useLandingPageFormCatalog } from '../shared/useLandingPageFormCatalog';

/** Single CTA field editor (used inside section list and submission inline). */
export interface SectionActionButtonFormProps {
  button: HeroButton;
  onChange: (button: HeroButton) => void;
}

export const SectionActionButtonForm: React.FC<SectionActionButtonFormProps> = ({
  button,
  onChange,
}) => {
  const { t } = useAdminTranslation('pageBuilder');
  const { currentUser } = useAuth();
  const { options: formOptions, loading: formsLoading } = useLandingPageFormCatalog(currentUser?.id);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const btn = button;
  const mode = resolveLandingPageActionTarget(btn);
  const assetSrc = resolveLandingPageAssetSource(btn);
  const filteredForms = filterFormsByCategory(formOptions, btn.formCategory);

  const patch = (partial: Partial<HeroButton>) => {
    onChange({ ...btn, ...partial, id: btn.id });
  };

  const handleConnectTypeChange = (v: SubmissionActionTarget) => {
    setUploadError('');
    if (v === 'form') {
      patch({
        actionTarget: 'form',
        assetSource: undefined,
        uploadedFileUrl: undefined,
        url: btn.url || '#',
      });
    } else if (v === 'document' || v === 'image' || v === 'video') {
      patch({
        actionTarget: v,
        formId: undefined,
        formCategory: undefined,
        assetSource: btn.assetSource || 'url',
      });
    } else {
      patch({
        actionTarget: v,
        formId: undefined,
        formCategory: undefined,
        assetSource: undefined,
        uploadedFileUrl: undefined,
      });
    }
  };

  const uploadAsset = async (file: File, action: 'document' | 'image' | 'video') => {
    if (!currentUser) return;
    setUploading(true);
    setUploadError('');
    try {
      let publicUrl: string;
      if (action === 'image') {
        publicUrl = await uploadImageToStorage(currentUser.id, file, 'landing-page-cta-images');
      } else if (action === 'video') {
        publicUrl = await uploadFileToStorage(currentUser.id, file, 'landing-page-cta-videos');
      } else {
        publicUrl = await uploadFileToStorage(currentUser.id, file, 'landing-page-cta-documents');
      }
      patch({ uploadedFileUrl: publicUrl, assetSource: 'upload' });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  };

  const fileAccept =
    mode === 'image'
      ? 'image/*'
      : mode === 'video'
        ? 'video/*,.mp4,.webm,.mov,.ogg'
        : '.pdf,.doc,.docx,.ppt,.pptx,.txt,.csv,.xls,.xlsx,.zip,.md,application/pdf';

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">{t('edSecActionLabel')}</label>
        <input
          type="text"
          value={btn.text}
          onChange={(e) => patch({ text: e.target.value })}
          placeholder={t('edSecActionLabelPlaceholder')}
          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">{t('edSubmissionConnectType')}</label>
        <select
          value={mode}
          onChange={(e) => handleConnectTypeChange(e.target.value as SubmissionActionTarget)}
          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
        >
          <option value="form">{t('edSubmissionConnectForm')}</option>
          <option value="link">{t('edSubmissionConnectLink')}</option>
          <option value="image">{t('edSubmissionConnectImage')}</option>
          <option value="document">{t('edSubmissionConnectDocument')}</option>
          <option value="video">{t('edSubmissionConnectVideo')}</option>
        </select>
      </div>

      {mode === 'form' && (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('edSecActionFormType')}</label>
            <select
              value={btn.formCategory || ''}
              onChange={(e) => {
                const cat = (e.target.value || undefined) as LandingPageFormCategory | undefined;
                patch({ formCategory: cat, formId: undefined });
              }}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
            >
              <option value="">{t('edSecActionFormTypePick')}</option>
              <option value="registration">{t('edSecActionFormRegistration')}</option>
              <option value="submission">{t('edSecActionFormSubmission')}</option>
              <option value="payment">{t('edSecActionFormPayment')}</option>
              <option value="evaluation">{t('edSecActionFormEvaluation')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('edHeroSelectForm')}</label>
            <select
              value={btn.formId || ''}
              onChange={(e) => patch({ formId: e.target.value || undefined })}
              disabled={!btn.formCategory || formsLoading}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900 disabled:opacity-60"
            >
              <option value="">{t('edHeroSelectForm')}</option>
              {filteredForms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
            {btn.formCategory && filteredForms.length === 0 && !formsLoading && (
              <p className="text-[10px] text-amber-600 mt-1">{t('edHeroNoFormsAvailable')}</p>
            )}
            {btn.formCategory === 'evaluation' && (
              <p className="text-[10px] text-slate-500 mt-1">{t('edSecActionEvaluationHint')}</p>
            )}
          </div>
        </>
      )}

      {mode === 'link' && (
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">{t('edSubmissionUrlOrPath')}</label>
          <input
            type="text"
            value={btn.url}
            onChange={(e) => patch({ url: e.target.value })}
            placeholder="https://…"
            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
          />
        </div>
      )}

      {(mode === 'document' || mode === 'image' || mode === 'video') && (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {t('edSubmissionAssetSourceLabel')}
            </label>
            <select
              value={assetSrc}
              onChange={(e) => {
                setUploadError('');
                const v = e.target.value as 'url' | 'upload';
                patch({
                  assetSource: v,
                  ...(v === 'url' ? { uploadedFileUrl: undefined } : {}),
                });
              }}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
            >
              <option value="url">{t('edSubmissionAssetSourceUrl')}</option>
              <option value="upload">{t('edSubmissionAssetSourceUpload')}</option>
            </select>
          </div>
          {assetSrc === 'url' ? (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('edSubmissionUrlOrPath')}</label>
              <input
                type="text"
                value={btn.url}
                onChange={(e) => patch({ url: e.target.value })}
                placeholder={
                  mode === 'image'
                    ? 'https://…/image.png'
                    : mode === 'video'
                      ? 'https://…/video.mp4'
                      : 'https://…/document.pdf'
                }
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">{t('edSubmissionChooseFile')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept={fileAccept}
                  disabled={!currentUser || uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadAsset(file, mode);
                    e.target.value = '';
                  }}
                  className="block w-full text-xs text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-indigo-50 file:px-2 file:py-1 file:text-indigo-700"
                />
                {uploading && (
                  <span className="flex items-center gap-1 text-xs text-indigo-600 shrink-0">
                    <Loader2 className="animate-spin" size={16} />
                    {t('edSubmissionUploading')}
                  </span>
                )}
              </div>
              {uploadError && (
                <p className="text-[10px] text-red-600">
                  {t('edSubmissionUploadFailed')}: {uploadError}
                </p>
              )}
              {btn.uploadedFileUrl && (
                <p className="text-[10px] text-slate-500 break-all" title={btn.uploadedFileUrl}>
                  {btn.uploadedFileUrl}
                </p>
              )}
            </div>
          )}
        </>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">{t('edHeroButtonStyle')}</label>
        <select
          value={btn.style}
          onChange={(e) => patch({ style: e.target.value as HeroButton['style'] })}
          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
        >
          <option value="primary">{t('edHeroStylePrimary')}</option>
          <option value="secondary">{t('edHeroStyleSecondary')}</option>
        </select>
      </div>
    </div>
  );
};

export interface SectionCtaButtonsEditorProps {
  buttons: HeroButton[];
  onChange: (buttons: HeroButton[]) => void;
}

/** Section-level CTA list (add / remove / expand), same UX as Call for Papers buttons. */
const SectionCtaButtonsEditor: React.FC<SectionCtaButtonsEditorProps> = ({ buttons, onChange }) => {
  const { t } = useAdminTranslation('pageBuilder');
  const [expandedButtonId, setExpandedButtonId] = useState<string | null>(null);

  const addButton = () => {
    const newBtn = createDefaultSectionActionButton(t('edSecActionDefaultLabel'));
    onChange([...buttons, newBtn]);
    setExpandedButtonId(newBtn.id);
  };

  const removeButton = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(buttons.filter((b) => b.id !== id));
    if (expandedButtonId === id) setExpandedButtonId(null);
  };

  const updateButton = (id: string, next: HeroButton) => {
    onChange(buttons.map((b) => (b.id === id ? next : b)));
  };

  return (
    <div className="pt-4 border-t border-slate-200">
      <div className="flex justify-between items-center mb-3">
        <div className="flex flex-col gap-0.5">
          <label className="block text-xs font-medium text-slate-700">{t('edSubmissionActionButtons')}</label>
          <span className="text-xs text-slate-500">
            {t('edSubmissionCtaSummary', { count: buttons.length })}
          </span>
        </div>
        <button
          type="button"
          onClick={addButton}
          className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800 shrink-0"
        >
          <Plus size={12} />
          {t('edSecActionAddCta')}
        </button>
      </div>

      <div className="space-y-3">
        {buttons.map((btn) => (
          <div key={btn.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <div
              className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpandedButtonId(expandedButtonId === btn.id ? null : btn.id)}
            >
              <p className="text-sm font-semibold text-slate-800 truncate">
                {btn.text?.trim() ? btn.text : t('edSubmissionCtaNewFallback')}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => removeButton(btn.id, e)}
                  className="text-slate-400 hover:text-red-500 p-1"
                  aria-label={t('edSecActionRemoveCta')}
                >
                  <Trash2 size={14} />
                </button>
                {expandedButtonId === btn.id ? (
                  <ChevronUp size={16} className="text-slate-400" />
                ) : (
                  <ChevronDown size={16} className="text-slate-400" />
                )}
              </div>
            </div>
            {expandedButtonId === btn.id && (
              <div className="p-3 border-t border-slate-100 bg-white">
                <SectionActionButtonForm button={btn} onChange={(next) => updateButton(btn.id, next)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionCtaButtonsEditor;

/** @deprecated Use SectionActionButtonForm with variant inline */
export interface SectionActionButtonEditorProps {
  variant?: 'section' | 'inline';
  showActionButton?: boolean;
  onShowActionButtonChange?: (show: boolean) => void;
  button: HeroButton | null | undefined;
  onChange: (button: HeroButton | undefined) => void;
}

/** Inline-only wrapper for SubmissionEditor backward compatibility */
export const SectionActionButtonEditor: React.FC<SectionActionButtonEditorProps> = ({
  variant = 'inline',
  button,
  onChange,
}) => {
  if (variant === 'section') {
    return null;
  }
  if (!button) return null;
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
      <SectionActionButtonForm
        button={button}
        onChange={(next) => onChange(next)}
      />
    </div>
  );
};
