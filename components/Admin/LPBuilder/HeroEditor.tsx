import React, { useState, useEffect } from 'react';
import { HeroConfig, HeroButton, RegistrationForm } from '../../../types';
import { ImageIcon, Type, AlignLeft, AlignCenter, Clock, Plus, Trash2, Link as LinkIcon, FileText, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getUserRegistrationForms } from '../../../services/registrationFormService';

interface HeroEditorProps {
  config: HeroConfig;
  onChange: (config: HeroConfig) => void;
  title?: string;
  onTitleChange?: (title: string) => void;
  date?: string;
  location?: string;
  onDateChange?: (date: string) => void;
  onLocationChange?: (location: string) => void;
}

const HeroEditor: React.FC<HeroEditorProps> = ({ config, onChange, title, onTitleChange, date, location, onDateChange, onLocationChange }) => {
  const [forms, setForms] = useState<RegistrationForm[]>([]);
  const { currentUser } = useAuth();
  // Track button mode: 'url' or 'form'. If formId is defined (even if empty), mode is 'form', otherwise 'url'
  const getButtonMode = (btn: HeroButton): 'url' | 'form' => {
    // If formId is defined (including empty string), we're in form mode
    // Use a special check: if url is '#' and formId is undefined, it's URL mode
    // If formId is defined (even as empty string), it's form mode
    return btn.formId !== undefined ? 'form' : 'url';
  };

  useEffect(() => {
    if (currentUser) {
      const loadForms = async () => {
        try {
          const userForms = await getUserRegistrationForms(currentUser.id);
          setForms(userForms);
        } catch (error) {
          console.error('Error loading forms:', error);
        }
      };
      loadForms();
      }
  }, [currentUser]);

  const update = (field: keyof HeroConfig, value: any) => {
    onChange({ ...config, [field]: value });
  };

  const addButton = () => {
    const newBtn: HeroButton = { id: Date.now().toString(), text: 'New Action', url: '#', style: 'secondary' };
    update('buttons', [...config.buttons, newBtn]);
  };

  const removeButton = (id: string) => {
    update('buttons', config.buttons.filter(b => b.id !== id));
  };

  const updateButton = (id: string, field: keyof HeroButton, value: string | undefined) => {
    const updatedButtons = config.buttons.map(b => {
      if (b.id === id) {
        return { ...b, [field]: value };
      }
      return b;
    });
    update('buttons', updatedButtons);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-2">
          <Type size={14}/> Main Title
        </label>
        <input 
          type="text" 
          value={title || ''}
          onChange={(e) => onTitleChange?.(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm bg-white text-slate-900"
          placeholder="Conference Title"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-2">
          <Calendar size={14}/> Date
        </label>
        <input 
          type="date" 
          value={date || ''}
          onChange={(e) => onDateChange?.(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm bg-white text-slate-900"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-2">
          <MapPin size={14}/> Location
        </label>
        <input 
          type="text" 
          value={location || ''}
          onChange={(e) => onLocationChange?.(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm bg-white text-slate-900"
          placeholder="e.g. San Francisco, CA"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-2">
          <ImageIcon size={14}/> Background Image
        </label>
        <input 
          type="text" 
          value={config.backgroundImage}
          onChange={(e) => update('backgroundImage', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm bg-white text-slate-900"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-2">
          <Type size={14}/> Tagline / Subtitle
        </label>
        <input 
          type="text" 
          value={config.tagline}
          onChange={(e) => update('tagline', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm bg-white text-slate-900"
          placeholder="e.g. Innovating the Future"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-2">Text Alignment</label>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => update('layout', 'left')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${config.layout === 'left' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <AlignLeft size={14} /> Left
          </button>
          <button 
            onClick={() => update('layout', 'center')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${config.layout === 'center' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <AlignCenter size={14} /> Center
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Overlay Opacity ({config.overlayOpacity}%)</label>
        <input 
          type="range" 
          min="0" 
          max="90" 
          value={config.overlayOpacity}
          onChange={(e) => update('overlayOpacity', parseInt(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Show Timer</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={config.showTimer}
              onChange={(e) => update('showTimer', e.target.checked)}
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Show Date</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={config.showDate}
              onChange={(e) => update('showDate', e.target.checked)}
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Show Location</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={config.showLocation}
              onChange={(e) => update('showLocation', e.target.checked)}
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
          </label>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-xs font-medium text-slate-700">Action Buttons</label>
          <button onClick={addButton} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-3">
          {config.buttons.map((btn) => (
            <div key={btn.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Button</span>
                <button onClick={() => removeButton(btn.id)} className="text-slate-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
              <input 
                type="text" 
                value={btn.text}
                onChange={(e) => updateButton(btn.id, 'text', e.target.value)}
                placeholder="Button Text"
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
              />
              <div className="space-y-2">
                {/* Button Type Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Button Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Switch to URL mode - clear formId
                        const updatedButtons = config.buttons.map(b => {
                          if (b.id === btn.id) {
                            return { ...b, formId: undefined, url: b.url || '#' };
                          }
                          return b;
                        });
                        update('buttons', updatedButtons);
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                        getButtonMode(btn) === 'url'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <LinkIcon size={14} />
                      <span className="text-xs font-medium">URL</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Switch to Form mode - set formId to empty string to show selector, clear URL
                        const updatedButtons = config.buttons.map(b => {
                          if (b.id === btn.id) {
                            return { ...b, formId: '' as string | undefined, url: '#' };
                          }
                          return b;
                        });
                        update('buttons', updatedButtons);
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg transition-colors cursor-pointer ${
                        getButtonMode(btn) === 'form'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <FileText size={14} />
                      <span className="text-xs font-medium">Form</span>
                    </button>
                  </div>
                </div>

                {/* Style Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Button Style</label>
                  <select 
                    value={btn.style}
                    onChange={(e) => updateButton(btn.id, 'style', e.target.value as any)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                  </select>
                </div>

                {/* URL Input - shown when URL mode is selected */}
                {getButtonMode(btn) === 'url' && (
                  <div className="relative">
                    <LinkIcon size={12} className="absolute left-2 top-2.5 text-slate-400"/>
                    <input 
                      type="text" 
                      value={btn.url}
                      onChange={(e) => updateButton(btn.id, 'url', e.target.value)}
                      placeholder="https://example.com or #section"
                      className="w-full pl-6 pr-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                    />
                  </div>
                )}

                {/* Form Selection - shown when Form mode is selected */}
                {getButtonMode(btn) === 'form' && (
                  <div className="relative">
                    <FileText size={12} className="absolute left-2 top-2.5 text-slate-400 z-10"/>
                    <select
                      value={btn.formId || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Update formId with selected value (empty string if none selected)
                        updateButton(btn.id, 'formId', value || '');
                      }}
                      className="w-full pl-6 pr-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                    >
                      <option value="">Select a form...</option>
                      {forms.length === 0 ? (
                        <option value="" disabled>No forms available. Create a form first.</option>
                      ) : (
                        forms.map((form) => (
                          <option key={form.id} value={form.id}>
                            {form.title}
                          </option>
                        ))
                      )}
                    </select>
                    {btn.formId && btn.formId !== '' && forms.find(f => f.id === btn.formId) && (
                      <p className="text-xs text-slate-500 mt-1 ml-6">
                        Selected: {forms.find(f => f.id === btn.formId)?.title}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroEditor;