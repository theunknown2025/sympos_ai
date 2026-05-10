import React, { useEffect, useState } from 'react';
import {
  SubmissionSectionConfig,
  TimelineStep,
  HeroButton,
  TimelineStepIcon,
  SubmissionActionTarget,
  HeroButtonAssetSource,
  RegistrationForm,
} from '../../../../types';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Calendar,
  FileText,
  Send,
  Clock,
  CheckCircle2,
  Info,
  Upload,
  Flag,
  Award,
  Loader2,
} from 'lucide-react';
import { useAdminTranslation } from '../../../../i18n/admin/hooks/useAdminTranslation';
import { useAuth } from '../../../../hooks/useAuth';
import { getUserRegistrationForms } from '../../../../services/registrationFormService';
import { uploadFileToStorage, uploadImageToStorage } from '../../../../services/storageService';

interface SubmissionEditorProps {
  config: SubmissionSectionConfig;
  onChange: (config: SubmissionSectionConfig) => void;
}

const STEP_ICONS: { key: TimelineStepIcon; Icon: React.ElementType }[] = [
  { key: 'calendar', Icon: Calendar },
  { key: 'file-text', Icon: FileText },
  { key: 'send', Icon: Send },
  { key: 'clock', Icon: Clock },
  { key: 'check-circle', Icon: CheckCircle2 },
  { key: 'info', Icon: Info },
  { key: 'upload', Icon: Upload },
  { key: 'flag', Icon: Flag },
  { key: 'award', Icon: Award },
];

const SubmissionEditor: React.FC<SubmissionEditorProps> = ({ config, onChange }) => {
  const { t } = useAdminTranslation('pageBuilder');
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [expandedButtonId, setExpandedButtonId] = useState<string | null>(null);
  const [forms, setForms] = useState<RegistrationForm[]>([]);
  const [uploadingBtnId, setUploadingBtnId] = useState<string | null>(null);
  const [ctaUploadError, setCtaUploadError] = useState<{ btnId: string; message: string } | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const userForms = await getUserRegistrationForms(currentUser.id);
        setForms(userForms);
      } catch (e) {
        console.error('Error loading registration forms:', e);
      }
    })();
  }, [currentUser]);

  const addStep = () => {
    const newStep: TimelineStep = {
      id: Date.now().toString(),
      title: t('edSubmissionNewMilestone'),
      description: '',
      deadline: '',
      icon: 'calendar',
    };
    onChange({ ...config, steps: [...config.steps, newStep] });
    setExpandedStepId(newStep.id);
  };

  const removeStep = (id: string) => {
    onChange({ ...config, steps: config.steps.filter((s) => s.id !== id) });
  };

  const updateStep = (id: string, patch: Partial<TimelineStep>) => {
    onChange({
      ...config,
      steps: config.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const addButton = () => {
    const newBtn: HeroButton = {
      id: Date.now().toString(),
      text: t('edSubmissionNewButtonText'),
      url: '#',
      style: 'secondary',
      actionTarget: 'link',
    };
    onChange({ ...config, buttons: [...config.buttons, newBtn] });
    setExpandedButtonId(newBtn.id);
  };

  const removeButton = (id: string) => {
    onChange({ ...config, buttons: config.buttons.filter((b) => b.id !== id) });
  };

  const updateButton = (id: string, patch: Partial<HeroButton>) => {
    onChange({
      ...config,
      buttons: config.buttons.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });
  };

  const inferActionTarget = (btn: HeroButton): SubmissionActionTarget => {
    if (btn.actionTarget) return btn.actionTarget;
    if (btn.formId) return 'form';
    return 'link';
  };

  const resolveAssetSource = (btn: HeroButton): HeroButtonAssetSource => {
    if (btn.assetSource) return btn.assetSource;
    if (btn.uploadedFileUrl && (!btn.url || btn.url === '#')) return 'upload';
    return 'url';
  };

  const handleConnectTypeChange = (btn: HeroButton, v: SubmissionActionTarget) => {
    setCtaUploadError(null);
    if (v === 'form') {
      updateButton(btn.id, {
        actionTarget: 'form',
        assetSource: undefined,
        uploadedFileUrl: undefined,
      });
    } else if (v === 'document' || v === 'image') {
      updateButton(btn.id, {
        actionTarget: v,
        formId: undefined,
        assetSource: btn.assetSource || 'url',
      });
    } else {
      updateButton(btn.id, {
        actionTarget: v,
        formId: undefined,
        assetSource: undefined,
        uploadedFileUrl: undefined,
      });
    }
  };

  const uploadAsset = async (btnId: string, file: File, action: 'document' | 'image') => {
    if (!currentUser) return;
    setUploadingBtnId(btnId);
    setCtaUploadError(null);
    try {
      const publicUrl =
        action === 'image'
          ? await uploadImageToStorage(currentUser.id, file, 'landing-page-cta-images')
          : await uploadFileToStorage(currentUser.id, file, 'landing-page-cta-documents');
      updateButton(btnId, { uploadedFileUrl: publicUrl, assetSource: 'upload' });
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : String(e);
      setCtaUploadError({ btnId, message });
    } finally {
      setUploadingBtnId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-slate-500">{t('edSubmissionStepsSummary', { count: config.steps.length })}</span>
        <button type="button" onClick={addStep} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
          <Plus size={12} /> {t('edSubmissionAddStep')}
        </button>
      </div>

      <div className="space-y-3">
        {config.steps.map((step) => (
          <div key={step.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <div
              className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpandedStepId(expandedStepId === step.id ? null : step.id)}
            >
              <p className="text-sm font-semibold text-slate-800 truncate">{step.title || t('edSubmissionNewStepFallback')}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStep(step.id);
                  }}
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <Trash2 size={14} />
                </button>
                {expandedStepId === step.id ? (
                  <ChevronUp size={16} className="text-slate-400" />
                ) : (
                  <ChevronDown size={16} className="text-slate-400" />
                )}
              </div>
            </div>
            {expandedStepId === step.id && (
              <div className="p-4 border-t border-slate-100 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t('edSubmissionTitlePlaceholder')}</label>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => updateStep(step.id, { title: e.target.value })}
                    placeholder={t('edSubmissionTitlePlaceholder')}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t('edSubmissionDescriptionLabel')}</label>
                  <textarea
                    rows={2}
                    maxLength={50}
                    value={step.description}
                    onChange={(e) => updateStep(step.id, { description: e.target.value.slice(0, 50) })}
                    placeholder={t('edSubmissionDescriptionPlaceholder')}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm resize-none bg-white text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {step.description.length}/50 {t('edSubmissionChars')}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t('edSubmissionDeadlineLabel')}</label>
                  <input
                    type="date"
                    value={step.deadline || ''}
                    onChange={(e) => updateStep(step.id, { deadline: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                  />
                  {step.date && !step.deadline && (
                    <p className="text-[10px] text-amber-600 mt-1">{t('edSubmissionLegacyDateHint')}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t('edSubmissionIconLabel')}</label>
                  <div className="flex flex-wrap gap-2">
                    {STEP_ICONS.map(({ key, Icon }) => {
                      const active = (step.icon || 'calendar') === key;
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => updateStep(step.id, { icon: key })}
                          className={`p-2 rounded-lg border transition-colors ${
                            active ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                          }`}
                          title={key}
                        >
                          <Icon size={16} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center mb-3">
          <div className="flex flex-col gap-0.5">
            <label className="block text-xs font-medium text-slate-700">{t('edSubmissionActionButtons')}</label>
            <span className="text-xs text-slate-500">{t('edSubmissionCtaSummary', { count: config.buttons.length })}</span>
          </div>
          <button type="button" onClick={addButton} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800 shrink-0">
            <Plus size={12} /> {t('edSubmissionAddButton')}
          </button>
        </div>
        <div className="space-y-3">
          {config.buttons.map((btn) => {
            const mode = inferActionTarget(btn);
            const assetSrc = resolveAssetSource(btn);
            return (
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
                      onClick={(e) => {
                        e.stopPropagation();
                        removeButton(btn.id);
                        if (expandedButtonId === btn.id) setExpandedButtonId(null);
                      }}
                      className="text-slate-400 hover:text-red-500 p-1"
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
                  <div className="p-4 border-t border-slate-100 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">{t('edSubmissionButtonLabelPlaceholder')}</label>
                      <input
                        type="text"
                        value={btn.text}
                        onChange={(e) => updateButton(btn.id, { text: e.target.value })}
                        placeholder={t('edSubmissionButtonLabelPlaceholder')}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">{t('edSubmissionConnectType')}</label>
                      <select
                        value={mode}
                        onChange={(e) => handleConnectTypeChange(btn, e.target.value as SubmissionActionTarget)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                      >
                        <option value="document">{t('edSubmissionConnectDocument')}</option>
                        <option value="link">{t('edSubmissionConnectLink')}</option>
                        <option value="image">{t('edSubmissionConnectImage')}</option>
                        <option value="form">{t('edSubmissionConnectForm')}</option>
                      </select>
                    </div>

                    {mode === 'form' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">{t('edHeroSelectForm')}</label>
                        <select
                          value={btn.formId || ''}
                          onChange={(e) => updateButton(btn.id, { formId: e.target.value || undefined })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                        >
                          <option value="">{t('edHeroSelectForm')}</option>
                          {forms.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.title}
                            </option>
                          ))}
                        </select>
                        {forms.length === 0 && <p className="text-[10px] text-amber-600 mt-1">{t('edHeroNoFormsAvailable')}</p>}
                      </div>
                    )}

                    {mode === 'link' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">{t('edSubmissionUrlOrPath')}</label>
                        <input
                          type="text"
                          value={btn.url}
                          onChange={(e) => updateButton(btn.id, { url: e.target.value })}
                          placeholder="https://…"
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                        />
                      </div>
                    )}

                    {(mode === 'document' || mode === 'image') && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">{t('edSubmissionAssetSourceLabel')}</label>
                          <select
                            value={assetSrc}
                            onChange={(e) => {
                              setCtaUploadError(null);
                              const v = e.target.value as HeroButtonAssetSource;
                              updateButton(btn.id, {
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
                              onChange={(e) => updateButton(btn.id, { url: e.target.value })}
                              placeholder={mode === 'image' ? 'https://…/image.png' : 'https://…/document.pdf'}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-slate-700">{t('edSubmissionChooseFile')}</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                accept={
                                  mode === 'image'
                                    ? 'image/*'
                                    : '.pdf,.doc,.docx,.ppt,.pptx,.txt,.csv,.xls,.xlsx,.zip,.md,application/pdf'
                                }
                                disabled={!currentUser || uploadingBtnId === btn.id}
                                onFocus={() => setCtaUploadError((prev) => (prev?.btnId === btn.id ? null : prev))}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadAsset(btn.id, file, mode);
                                  e.target.value = '';
                                }}
                                className="block w-full text-xs text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-indigo-50 file:px-2 file:py-1 file:text-indigo-700"
                              />
                              {uploadingBtnId === btn.id && (
                                <span className="flex items-center gap-1 text-xs text-indigo-600 shrink-0">
                                  <Loader2 className="animate-spin shrink-0" size={16} />
                                  {t('edSubmissionUploading')}
                                </span>
                              )}
                            </div>
                            {ctaUploadError?.btnId === btn.id && (
                              <p className="text-[10px] text-red-600 whitespace-pre-wrap break-words">
                                {t('edSubmissionUploadFailed')}: {ctaUploadError.message}
                              </p>
                            )}
                            {btn.uploadedFileUrl && (
                              <p className="text-[10px] text-slate-500 break-all" title={btn.uploadedFileUrl}>
                                {btn.uploadedFileUrl}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400">{t('edSubmissionUploadedHint')}</p>
                          </div>
                        )}
                      </>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">{t('edHeroButtonStyle')}</label>
                      <select
                        value={btn.style}
                        onChange={(e) => updateButton(btn.id, { style: e.target.value as HeroButton['style'] })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                      >
                        <option value="primary">{t('edHeroStylePrimary')}</option>
                        <option value="secondary">{t('edHeroStyleSecondary')}</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubmissionEditor;
