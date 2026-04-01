import React from 'react';
import { getEditorTranslations } from '../editorTranslations';

interface ProfileSectionProps {
  data: {
    content: string;
  };
  onChange: (data: { content: string }) => void;
  language?: 'en' | 'fr' | 'ar';
  direction?: 'ltr' | 'rtl';
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ data, onChange, language = 'en', direction = 'ltr' }) => {
  const t = getEditorTranslations(language);

  return (
    <div dir={direction}>
      <label className="block text-sm font-medium text-slate-700 mb-1">{t.profileSummary}</label>
      <textarea
        value={data.content || ''}
        onChange={(e) => onChange({ ...data, content: e.target.value })}
        placeholder={direction === 'rtl' ? 'اكتب ملخصًا موجزًا عن نفسك، اهتماماتك البحثية، وخلفيتك المهنية...' : 'Write a brief summary about yourself, your research interests, and professional background...'}
        rows={6}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        dir={direction}
      />
    </div>
  );
};

export default ProfileSection;
