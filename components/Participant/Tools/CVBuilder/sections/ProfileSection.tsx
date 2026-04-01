import React from 'react';

interface ProfileSectionProps {
  data: {
    content: string;
  };
  onChange: (data: { content: string }) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ data, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Profile Summary</label>
      <textarea
        value={data.content || ''}
        onChange={(e) => onChange({ ...data, content: e.target.value })}
        placeholder="Write a brief summary about yourself, your skills, and career objectives..."
        rows={6}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
      />
    </div>
  );
};

export default ProfileSection;
