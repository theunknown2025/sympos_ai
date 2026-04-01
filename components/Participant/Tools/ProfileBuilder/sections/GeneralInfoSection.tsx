import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getEditorTranslations, getPlatformOptions } from '../editorTranslations';

interface Link {
  id: string;
  platform: string;
  url: string;
}

interface GeneralInfoSectionProps {
  data: {
    firstName?: string;
    lastName?: string;
    title?: string;
    email?: string;
    phone?: string;
    address?: string;
    organization?: string;
    position?: string;
    bio?: string;
    links?: Link[];
  };
  onChange: (data: any) => void;
  language?: 'en' | 'fr' | 'ar';
  direction?: 'ltr' | 'rtl';
}

const GeneralInfoSection: React.FC<GeneralInfoSectionProps> = ({ data, onChange, language = 'en', direction = 'ltr' }) => {
  const t = getEditorTranslations(language);
  const availablePlatforms = getPlatformOptions(language);
  const handleAddLink = () => {
    onChange({
      ...data,
      links: [
        ...(data.links || []),
        {
          id: uuidv4(),
          platform: '',
          url: '',
        },
      ],
    });
  };

  const handleRemoveLink = (id: string) => {
    onChange({
      ...data,
      links: (data.links || []).filter((link) => link.id !== id),
    });
  };

  const handleUpdateLink = (id: string, field: keyof Link, value: string) => {
    onChange({
      ...data,
      links: (data.links || []).map((link) =>
        link.id === id ? { ...link, [field]: value } : link
      ),
    });
  };

  return (
    <div className="space-y-3" dir={direction}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.firstName}</label>
          <input
            type="text"
            value={data.firstName || ''}
            onChange={(e) => onChange({ ...data, firstName: e.target.value })}
            placeholder={direction === 'rtl' ? 'محمد' : 'John'}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            dir={direction}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.lastName}</label>
          <input
            type="text"
            value={data.lastName || ''}
            onChange={(e) => onChange({ ...data, lastName: e.target.value })}
            placeholder={direction === 'rtl' ? 'أحمد' : 'Doe'}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            dir={direction}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t.title}</label>
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder={direction === 'rtl' ? 'د.، أ.د.' : 'Prof., Dr., etc.'}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          dir={direction}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t.email}</label>
        <input
          type="email"
          value={data.email || ''}
          onChange={(e) => onChange({ ...data, email: e.target.value })}
          placeholder="john.doe@example.com"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          dir="ltr"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t.phone}</label>
        <input
          type="tel"
          value={data.phone || ''}
          onChange={(e) => onChange({ ...data, phone: e.target.value })}
          placeholder={direction === 'rtl' ? '+966 50 123 4567' : '+1 (555) 123-4567'}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          dir="ltr"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t.address}</label>
        <input
          type="text"
          value={data.address || ''}
          onChange={(e) => onChange({ ...data, address: e.target.value })}
          placeholder={direction === 'rtl' ? 'الرياض، السعودية' : 'City, Country'}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          dir={direction}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t.organization}</label>
        <input
          type="text"
          value={data.organization || ''}
          onChange={(e) => onChange({ ...data, organization: e.target.value })}
          placeholder={direction === 'rtl' ? 'اسم الجامعة' : 'University Name'}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          dir={direction}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t.position}</label>
        <input
          type="text"
          value={data.position || ''}
          onChange={(e) => onChange({ ...data, position: e.target.value })}
          placeholder={direction === 'rtl' ? 'أستاذ، باحث' : 'Professor, Researcher, etc.'}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          dir={direction}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t.bio}</label>
        <textarea
          value={data.bio || ''}
          onChange={(e) => onChange({ ...data, bio: e.target.value })}
          placeholder={direction === 'rtl' ? 'سيرة ذاتية موجزة...' : 'Brief biography...'}
          rows={4}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          dir={direction}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t.links}</label>
        <div className="space-y-2">
          {(data.links || []).map((link) => (
            <div key={link.id} className="flex items-center gap-2">
              <select
                value={link.platform || ''}
                onChange={(e) => handleUpdateLink(link.id, 'platform', e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                dir={direction}
              >
                <option value="">{direction === 'rtl' ? 'اختر المنصة' : 'Select Platform'}</option>
                {availablePlatforms.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
              <input
                type="url"
                value={link.url || ''}
                onChange={(e) => handleUpdateLink(link.id, 'url', e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                dir="ltr"
              />
              <button
                onClick={() => handleRemoveLink(link.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                title={t.remove}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={handleAddLink}
            className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            {t.addLink}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneralInfoSection;
