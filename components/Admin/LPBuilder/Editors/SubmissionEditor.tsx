import React, { useState } from 'react';
import { SubmissionSectionConfig, TimelineStep, HeroButton, TimelineStepIcon } from '../../../../types';
import { SectionActionButtonForm } from './SectionActionButtonEditor';
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
} from 'lucide-react';
import { useAdminTranslation } from '../../../../i18n/admin/hooks/useAdminTranslation';

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
          {config.buttons.map((btn) => (
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
                <div className="p-2 border-t border-slate-100 bg-white">
                  <SectionActionButtonForm
                    button={btn}
                    onChange={(next) => updateButton(btn.id, next)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubmissionEditor;
