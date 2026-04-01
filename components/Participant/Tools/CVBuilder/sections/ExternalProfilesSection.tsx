import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ExternalProfile {
  id: string;
  platform: string;
  url: string;
  username?: string;
}

interface ExternalProfilesSectionProps {
  data: {
    profiles: ExternalProfile[];
  };
  onChange: (data: { profiles: ExternalProfile[] }) => void;
}

const commonPlatforms = [
  'LinkedIn',
  'GitHub',
  'Portfolio',
  'Personal Website',
  'Twitter/X',
  'Medium',
  'Behance',
  'Dribbble',
  'Other',
];

const ExternalProfilesSection: React.FC<ExternalProfilesSectionProps> = ({ data, onChange }) => {
  const handleAddProfile = () => {
    onChange({
      profiles: [
        ...data.profiles,
        {
          id: uuidv4(),
          platform: '',
          url: '',
          username: '',
        },
      ],
    });
  };

  const handleRemoveProfile = (id: string) => {
    onChange({
      profiles: data.profiles.filter((profile) => profile.id !== id),
    });
  };

  const handleUpdateProfile = (id: string, field: keyof ExternalProfile, value: string) => {
    onChange({
      profiles: data.profiles.map((profile) =>
        profile.id === id ? { ...profile, [field]: value } : profile
      ),
    });
  };

  return (
    <div className="space-y-4">
      {data.profiles.map((profile, index) => (
        <div key={profile.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-900">Profile {index + 1}</h4>
            {data.profiles.length > 1 && (
              <button
                onClick={() => handleRemoveProfile(profile.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove profile"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Platform</label>
              <select
                value={profile.platform || ''}
                onChange={(e) => handleUpdateProfile(profile.id, 'platform', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                <option value="">Select Platform</option>
                {commonPlatforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">URL</label>
              <input
                type="url"
                value={profile.url || ''}
                onChange={(e) => handleUpdateProfile(profile.id, 'url', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Username (Optional)</label>
              <input
                type="text"
                value={profile.username || ''}
                onChange={(e) => handleUpdateProfile(profile.id, 'username', e.target.value)}
                placeholder="Your username on this platform"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleAddProfile}
        className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Add External Profile
      </button>
    </div>
  );
};

export default ExternalProfilesSection;
