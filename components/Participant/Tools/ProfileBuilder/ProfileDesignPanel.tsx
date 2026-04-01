import React, { useState } from 'react';
import { ProfileDesign } from '../../../../services/profileBuilderService';
import { Palette, Image, Sparkles, Type, Calendar, Link as LinkIcon, Square, Layers, Layout, Languages, ChevronDown, ChevronUp } from 'lucide-react';
import { uploadImageToStorage } from '../../../../services/storageService';
import { useAuth } from '../../../../hooks/useAuth';
import TabsLayoutSettings from './TabsLayoutSettings';
import TemplateSelector from './ProfileTemplate/TemplateSelector';

interface ProfileDesignPanelProps {
  design: ProfileDesign | undefined;
  onUpdate: (design: ProfileDesign) => void;
  sections: Array<{ id: string; title: string }>;
}

const ProfileDesignPanel: React.FC<ProfileDesignPanelProps> = ({ design, onUpdate, sections }) => {
  const { currentUser } = useAuth();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set<string>();
      if (!prev.has(sectionId)) {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const updateDesign = (updates: Partial<ProfileDesign>) => {
    onUpdate({
      ...design,
      ...updates,
    });
  };

  const updateColors = (updates: Partial<ProfileDesign['colors']>) => {
    updateDesign({
      colors: {
        ...design?.colors,
        ...updates,
      },
    });
  };

  const updateTabs = (updates: Partial<ProfileDesign['colors']>['tabs']) => {
    updateColors({
      tabs: {
        ...design?.colors?.tabs,
        ...updates,
      },
    });
  };

  const updateBackground = (updates: Partial<ProfileDesign['background']>) => {
    updateDesign({
      background: {
        ...design?.background,
        ...updates,
      },
    });
  };

  const updateBanner = (updates: Partial<ProfileDesign['banner']>) => {
    updateDesign({
      banner: {
        ...design?.banner,
        ...updates,
      },
    });
  };

  const updateSectionDesign = (sectionId: string, updates: ProfileDesign['sections'] extends Record<string, infer T> ? T : never) => {
    updateDesign({
      sections: {
        ...design?.sections,
        [sectionId]: {
          ...design?.sections?.[sectionId],
          ...updates,
        },
      },
    });
  };

  const handleImageUpload = async (file: File, type: 'background' | 'banner') => {
    if (!currentUser?.id) return;

    try {
      const imageUrl = await uploadImageToStorage(currentUser.id, file, 'profile-images');
      if (type === 'background') {
        updateBackground({ image: imageUrl });
      } else {
        updateBanner({ image: imageUrl });
      }
    } catch (err: any) {
      console.error('Failed to upload image:', err);
    }
  };

  const ColorInput: React.FC<{
    label: string;
    value?: string;
    onChange: (value: string) => void;
    icon?: React.ReactNode;
  }> = ({ label, value, onChange, icon }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
        {icon}
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
      </div>
    </div>
  );

  const BackgroundTypeSelector: React.FC<{
    type: 'background' | 'banner';
    currentType?: 'color' | 'gradient' | 'image';
    onTypeChange: (type: 'color' | 'gradient' | 'image') => void;
  }> = ({ type, currentType, onTypeChange }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {type === 'background' ? 'Background Type' : 'Banner Type'}
      </label>
      <div className="flex gap-2">
        <button
          onClick={() => onTypeChange('color')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentType === 'color'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Color
        </button>
        <button
          onClick={() => onTypeChange('gradient')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentType === 'gradient'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Gradient
        </button>
        <button
          onClick={() => onTypeChange('image')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentType === 'image'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Image
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Component Colors */}
      <div className="mb-6 border border-slate-200 rounded-lg bg-white">
        <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => toggleSection('colors')}
            className="flex items-center gap-2 flex-1 text-left hover:text-indigo-600 transition-colors"
          >
            <Palette size={18} className="text-indigo-600" />
            <h3 className="font-medium text-slate-900">Component Colors</h3>
            {expandedSections.has('colors') ? (
              <ChevronUp className="text-slate-400 ml-auto" size={18} />
            ) : (
              <ChevronDown className="text-slate-400 ml-auto" size={18} />
            )}
          </button>
        </div>
        {expandedSections.has('colors') && (
          <div className="p-4 space-y-4">
            {/* Tabs Colors */}
            <div className="border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Layers size={16} />
                Tabs
              </h4>
              <ColorInput
                label="Main Color"
                value={design?.colors?.tabs?.main}
                onChange={(value) => updateTabs({ main: value })}
              />
              <ColorInput
                label="Hover Color"
                value={design?.colors?.tabs?.hover}
                onChange={(value) => updateTabs({ hover: value })}
              />
              <ColorInput
                label="Active Color"
                value={design?.colors?.tabs?.active}
                onChange={(value) => updateTabs({ active: value })}
              />
              <ColorInput
                label="Text Color"
                value={design?.colors?.tabs?.text}
                onChange={(value) => updateTabs({ text: value })}
              />
            </div>

            {/* Other Component Colors */}
            <ColorInput
              label="Titles"
              value={design?.colors?.titles}
              onChange={(value) => updateColors({ titles: value })}
              icon={<Type size={16} />}
            />
            <ColorInput
              label="Subtitles"
              value={design?.colors?.subtitles}
              onChange={(value) => updateColors({ subtitles: value })}
              icon={<Type size={16} />}
            />
            <ColorInput
              label="Dates"
              value={design?.colors?.dates}
              onChange={(value) => updateColors({ dates: value })}
              icon={<Calendar size={16} />}
            />
            <ColorInput
              label="Links"
              value={design?.colors?.links}
              onChange={(value) => updateColors({ links: value })}
              icon={<LinkIcon size={16} />}
            />
            <ColorInput
              label="Borders"
              value={design?.colors?.borders}
              onChange={(value) => updateColors({ borders: value })}
              icon={<Square size={16} />}
            />
          </div>
        )}
      </div>

      {/* Background */}
      <div className="mb-6 border border-slate-200 rounded-lg bg-white">
        <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => toggleSection('background')}
            className="flex items-center gap-2 flex-1 text-left hover:text-indigo-600 transition-colors"
          >
            <Sparkles size={18} className="text-indigo-600" />
            <h3 className="font-medium text-slate-900">Background</h3>
            {expandedSections.has('background') ? (
              <ChevronUp className="text-slate-400 ml-auto" size={18} />
            ) : (
              <ChevronDown className="text-slate-400 ml-auto" size={18} />
            )}
          </button>
        </div>
        {expandedSections.has('background') && (
          <div className="p-4">
            <BackgroundTypeSelector
              type="background"
              currentType={design?.background?.type}
              onTypeChange={(type) => updateBackground({ type })}
            />
            {design?.background?.type === 'color' && (
              <ColorInput
                label="Background Color"
                value={design?.background?.color}
                onChange={(value) => updateBackground({ color: value })}
              />
            )}
            {design?.background?.type === 'gradient' && (
              <div className="space-y-4">
                <ColorInput
                  label="Gradient From"
                  value={design?.background?.gradient?.from}
                  onChange={(value) =>
                    updateBackground({
                      gradient: {
                        ...design?.background?.gradient,
                        from: value,
                      },
                    })
                  }
                />
                <ColorInput
                  label="Gradient To"
                  value={design?.background?.gradient?.to}
                  onChange={(value) =>
                    updateBackground({
                      gradient: {
                        ...design?.background?.gradient,
                        to: value,
                      },
                    })
                  }
                />
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Direction
                  </label>
                  <select
                    value={design?.background?.gradient?.direction || 'to right'}
                    onChange={(e) =>
                      updateBackground({
                        gradient: {
                          ...design?.background?.gradient,
                          direction: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="to right">To Right</option>
                    <option value="to bottom">To Bottom</option>
                    <option value="to left">To Left</option>
                    <option value="to top">To Top</option>
                    <option value="to bottom right">To Bottom Right</option>
                    <option value="to bottom left">To Bottom Left</option>
                    <option value="to top right">To Top Right</option>
                    <option value="to top left">To Top Left</option>
                  </select>
                </div>
              </div>
            )}
            {design?.background?.type === 'image' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Background Image
                </label>
                {design?.background?.image && (
                  <img
                    src={design.background.image}
                    alt="Background"
                    className="w-full h-32 object-cover rounded-lg mb-2 border border-slate-200"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'background');
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Banner Header */}
      <div className="mb-6 border border-slate-200 rounded-lg bg-white">
        <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => toggleSection('banner')}
            className="flex items-center gap-2 flex-1 text-left hover:text-indigo-600 transition-colors"
          >
            <Image size={18} className="text-indigo-600" />
            <h3 className="font-medium text-slate-900">Banner Header</h3>
            {expandedSections.has('banner') ? (
              <ChevronUp className="text-slate-400 ml-auto" size={18} />
            ) : (
              <ChevronDown className="text-slate-400 ml-auto" size={18} />
            )}
          </button>
        </div>
        {expandedSections.has('banner') && (
          <div className="p-4">
            <BackgroundTypeSelector
              type="banner"
              currentType={design?.banner?.type}
              onTypeChange={(type) => updateBanner({ type })}
            />
            {design?.banner?.type === 'color' && (
              <ColorInput
                label="Banner Color"
                value={design?.banner?.color}
                onChange={(value) => updateBanner({ color: value })}
              />
            )}
            {design?.banner?.type === 'gradient' && (
              <div className="space-y-4">
                <ColorInput
                  label="Gradient From"
                  value={design?.banner?.gradient?.from}
                  onChange={(value) =>
                    updateBanner({
                      gradient: {
                        ...design?.banner?.gradient,
                        from: value,
                      },
                    })
                  }
                />
                <ColorInput
                  label="Gradient To"
                  value={design?.banner?.gradient?.to}
                  onChange={(value) =>
                    updateBanner({
                      gradient: {
                        ...design?.banner?.gradient,
                        to: value,
                      },
                    })
                  }
                />
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Direction
                  </label>
                  <select
                    value={design?.banner?.gradient?.direction || 'to right'}
                    onChange={(e) =>
                      updateBanner({
                        gradient: {
                          ...design?.banner?.gradient,
                          direction: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="to right">To Right</option>
                    <option value="to bottom">To Bottom</option>
                    <option value="to left">To Left</option>
                    <option value="to top">To Top</option>
                    <option value="to bottom right">To Bottom Right</option>
                    <option value="to bottom left">To Bottom Left</option>
                    <option value="to top right">To Top Right</option>
                    <option value="to top left">To Top Left</option>
                  </select>
                </div>
              </div>
            )}
            {design?.banner?.type === 'image' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Banner Image
                </label>
                {design?.banner?.image && (
                  <img
                    src={design.banner.image}
                    alt="Banner"
                    className="w-full h-32 object-cover rounded-lg mb-2 border border-slate-200"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'banner');
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="mb-6 border border-slate-200 rounded-lg bg-white">
        <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => toggleSection('tabsLayout')}
            className="flex items-center gap-2 flex-1 text-left hover:text-indigo-600 transition-colors"
          >
            <Layout size={18} className="text-indigo-600" />
            <h3 className="font-medium text-slate-900">Tabs</h3>
            {expandedSections.has('tabsLayout') ? (
              <ChevronUp className="text-slate-400 ml-auto" size={18} />
            ) : (
              <ChevronDown className="text-slate-400 ml-auto" size={18} />
            )}
          </button>
        </div>
        {expandedSections.has('tabsLayout') && (
          <div className="p-4">
            <TabsLayoutSettings design={design} onUpdate={updateDesign} />
          </div>
        )}
      </div>

      {/* Template Selection */}
      <div className="mb-6 border border-slate-200 rounded-lg bg-white">
        <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => toggleSection('template')}
            className="flex items-center gap-2 flex-1 text-left hover:text-indigo-600 transition-colors"
          >
            <Sparkles size={18} className="text-indigo-600" />
            <h3 className="font-medium text-slate-900">Template</h3>
            {expandedSections.has('template') ? (
              <ChevronUp className="text-slate-400 ml-auto" size={18} />
            ) : (
              <ChevronDown className="text-slate-400 ml-auto" size={18} />
            )}
          </button>
        </div>
        {expandedSections.has('template') && (
          <div className="p-4">
            <TemplateSelector design={design} onUpdate={updateDesign} />
          </div>
        )}
      </div>

      {/* Language/Direction */}
      <div className="mb-6 border border-slate-200 rounded-lg bg-white">
        <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => toggleSection('language')}
            className="flex items-center gap-2 flex-1 text-left hover:text-indigo-600 transition-colors"
          >
            <Languages size={18} className="text-indigo-600" />
            <h3 className="font-medium text-slate-900">Language</h3>
            {expandedSections.has('language') ? (
              <ChevronUp className="text-slate-400 ml-auto" size={18} />
            ) : (
              <ChevronDown className="text-slate-400 ml-auto" size={18} />
            )}
          </button>
        </div>
        {expandedSections.has('language') && (
          <div className="p-4 space-y-6">
            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Language
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => updateDesign({ 
                    language: { 
                      code: 'en',
                      direction: 'ltr'
                    } 
                  })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    design?.language?.code === 'en' || !design?.language?.code
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`text-2xl font-bold ${
                      design?.language?.code === 'en' || !design?.language?.code
                        ? 'text-indigo-600'
                        : 'text-slate-400'
                    }`}>
                      EN
                    </div>
                    <span className={`text-sm font-medium ${
                      design?.language?.code === 'en' || !design?.language?.code
                        ? 'text-indigo-700'
                        : 'text-slate-600'
                    }`}>
                      English
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => updateDesign({ 
                    language: { 
                      code: 'fr',
                      direction: 'ltr'
                    } 
                  })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    design?.language?.code === 'fr'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`text-2xl font-bold ${
                      design?.language?.code === 'fr'
                        ? 'text-indigo-600'
                        : 'text-slate-400'
                    }`}>
                      FR
                    </div>
                    <span className={`text-sm font-medium ${
                      design?.language?.code === 'fr'
                        ? 'text-indigo-700'
                        : 'text-slate-600'
                    }`}>
                      Français
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => updateDesign({ 
                    language: { 
                      code: 'ar',
                      direction: 'rtl'
                    } 
                  })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    design?.language?.code === 'ar'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`text-2xl font-bold ${
                      design?.language?.code === 'ar'
                        ? 'text-indigo-600'
                        : 'text-slate-400'
                    }`}>
                      ع
                    </div>
                    <span className={`text-sm font-medium ${
                      design?.language?.code === 'ar'
                        ? 'text-indigo-700'
                        : 'text-slate-600'
                    }`}>
                      العربية
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Text Direction */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Text Direction
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateDesign({ 
                    language: { 
                      code: design?.language?.code || 'en',
                      direction: 'ltr'
                    } 
                  })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    design?.language?.direction === 'ltr' || !design?.language?.direction
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`text-2xl font-bold ${
                      design?.language?.direction === 'ltr' || !design?.language?.direction
                        ? 'text-indigo-600'
                        : 'text-slate-400'
                    }`}>
                      →
                    </div>
                    <span className={`text-sm font-medium ${
                      design?.language?.direction === 'ltr' || !design?.language?.direction
                        ? 'text-indigo-700'
                        : 'text-slate-600'
                    }`}>
                      Left to Right
                    </span>
                    <span className="text-xs text-slate-500 text-center">
                      LTR
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => updateDesign({ 
                    language: { 
                      code: design?.language?.code || 'en',
                      direction: 'rtl'
                    } 
                  })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    design?.language?.direction === 'rtl'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`text-2xl font-bold ${
                      design?.language?.direction === 'rtl'
                        ? 'text-indigo-600'
                        : 'text-slate-400'
                    }`}>
                      ←
                    </div>
                    <span className={`text-sm font-medium ${
                      design?.language?.direction === 'rtl'
                        ? 'text-indigo-700'
                        : 'text-slate-600'
                    }`}>
                      Right to Left
                    </span>
                    <span className="text-xs text-slate-500 text-center">
                      RTL
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section Colors */}
      <div className="border border-slate-200 rounded-lg bg-white">
        <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => toggleSection('sections')}
            className="flex items-center gap-2 flex-1 text-left hover:text-indigo-600 transition-colors"
          >
            <Layers size={18} className="text-indigo-600" />
            <h3 className="font-medium text-slate-900">Section Colors</h3>
            {expandedSections.has('sections') ? (
              <ChevronUp className="text-slate-400 ml-auto" size={18} />
            ) : (
              <ChevronDown className="text-slate-400 ml-auto" size={18} />
            )}
          </button>
        </div>
        {expandedSections.has('sections') && (
          <div className="p-4 space-y-4">
            {sections.map((section) => (
              <div key={section.id} className="border-b border-slate-200 pb-4 last:border-b-0">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">{section.title}</h4>
                <ColorInput
                  label="Background Color"
                  value={design?.sections?.[section.id]?.backgroundColor}
                  onChange={(value) =>
                    updateSectionDesign(section.id, { backgroundColor: value })
                  }
                />
                <ColorInput
                  label="Text Color"
                  value={design?.sections?.[section.id]?.textColor}
                  onChange={(value) =>
                    updateSectionDesign(section.id, { textColor: value })
                  }
                />
                <ColorInput
                  label="Border Color"
                  value={design?.sections?.[section.id]?.borderColor}
                  onChange={(value) =>
                    updateSectionDesign(section.id, { borderColor: value })
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDesignPanel;
