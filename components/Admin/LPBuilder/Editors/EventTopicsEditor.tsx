import React, { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import type { EventTopicItem, EventTopicIcon } from '../../../../types';
import { useAdminTranslation } from '../../../../i18n/admin/hooks/useAdminTranslation';
import {
  EVENT_TOPIC_ICON_OPTIONS,
  resolveEventTopicIcon,
} from '../shared/eventTopicIcons';

interface EventTopicsEditorProps {
  topics: EventTopicItem[];
  onChange: (items: EventTopicItem[]) => void;
}

const EventTopicsEditor: React.FC<EventTopicsEditorProps> = ({ topics, onChange }) => {
  const { t } = useAdminTranslation('pageBuilder');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addTopic = () => {
    const newItem: EventTopicItem = {
      id: Date.now().toString(),
      name: t('edTopicsNewDefault'),
      icon: 'lightbulb',
      shortDescription: '',
      longDescription: '',
    };
    onChange([...topics, newItem]);
    setExpandedId(newItem.id);
  };

  const removeTopic = (id: string) => {
    onChange(topics.filter((item) => item.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const updateTopic = <K extends keyof EventTopicItem>(id: string, field: K, value: EventTopicItem[K]) => {
    onChange(topics.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-500">{t('edTopicsSummary', { count: topics.length })}</span>
        <button
          type="button"
          onClick={addTopic}
          className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800"
        >
          <Plus size={12} /> {t('edTopicsAdd')}
        </button>
      </div>

      <div className="space-y-3">
        {topics.map((item) => {
          const PreviewIcon = resolveEventTopicIcon(item.icon);
          const isExpanded = expandedId === item.id;

          return (
            <div key={item.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
              <div
                className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedId(isExpanded ? null : item.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600">
                    <PreviewIcon size={16} />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {item.name || t('edTopicsUntitled')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTopic(item.id);
                    }}
                    className="text-slate-400 hover:text-red-500 p-1"
                    aria-label={t('edTopicsRemove')}
                  >
                    <Trash2 size={14} />
                  </button>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-400" />
                  )}
                </div>
              </div>

              {isExpanded ? (
                <div className="p-4 border-t border-slate-100 space-y-3 bg-white">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{t('edTopicsName')}</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateTopic(item.id, 'name', e.target.value)}
                      placeholder={t('edTopicsNamePlaceholder')}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">{t('edTopicsIcon')}</label>
                    <div className="flex flex-wrap gap-2">
                      {EVENT_TOPIC_ICON_OPTIONS.map((iconName) => {
                        const Icon = resolveEventTopicIcon(iconName);
                        const selected = item.icon === iconName;
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => updateTopic(item.id, 'icon', iconName as EventTopicIcon)}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
                              selected
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
                            }`}
                            title={iconName}
                          >
                            <Icon size={16} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {t('edTopicsShortDescription')}
                    </label>
                    <textarea
                      rows={2}
                      value={item.shortDescription}
                      onChange={(e) => updateTopic(item.id, 'shortDescription', e.target.value)}
                      placeholder={t('edTopicsShortPlaceholder')}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm resize-none bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {t('edTopicsLongDescription')}
                    </label>
                    <textarea
                      rows={5}
                      value={item.longDescription}
                      onChange={(e) => updateTopic(item.id, 'longDescription', e.target.value)}
                      placeholder={t('edTopicsLongPlaceholder')}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm resize-y bg-white text-slate-900"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventTopicsEditor;
