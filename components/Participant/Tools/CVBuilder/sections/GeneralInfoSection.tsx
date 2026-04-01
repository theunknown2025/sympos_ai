import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Link {
  id: string;
  platform: string;
  url: string;
}

interface GeneralInfoSectionProps {
  data: {
    email: string;
    phone: string;
    address: string;
    links: Link[];
  };
  onChange: (data: { email: string; phone: string; address: string; links: Link[] }) => void;
}

const availablePlatforms = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'github', label: 'GitHub' },
  { value: 'gitlab', label: 'GitLab' },
  { value: 'google-scholar', label: 'Google Scholar' },
  { value: 'orcid', label: 'ORCID' },
  { value: 'researchgate', label: 'ResearchGate' },
  { value: 'website', label: 'Personal Website' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'other', label: 'Other' },
];

const GeneralInfoSection: React.FC<GeneralInfoSectionProps> = ({ data, onChange }) => {
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
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <input
          type="email"
          value={data.email || ''}
          onChange={(e) => onChange({ ...data, email: e.target.value })}
          placeholder="john.doe@example.com"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
        <input
          type="tel"
          value={data.phone || ''}
          onChange={(e) => onChange({ ...data, phone: e.target.value })}
          placeholder="+1 (555) 123-4567"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
        <input
          type="text"
          value={data.address || ''}
          onChange={(e) => onChange({ ...data, address: e.target.value })}
          placeholder="City, Country"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Links</label>
        <div className="space-y-2">
          {(data.links || []).map((link, index) => (
            <div key={link.id} className="flex items-center gap-2">
              <select
                value={link.platform || ''}
                onChange={(e) => handleUpdateLink(link.id, 'platform', e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                <option value="">Select Platform</option>
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
              />
              {(data.links || []).length > 1 && (
                <button
                  onClick={() => handleRemoveLink(link.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remove link"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleAddLink}
            className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneralInfoSection;
