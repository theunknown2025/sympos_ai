import React from 'react';

interface AdditionalInfoSectionProps {
  data: {
    content: string;
  };
  onChange: (data: { content: string }) => void;
}

const AdditionalInfoSection: React.FC<AdditionalInfoSectionProps> = ({ data, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Additional Information</label>
      <textarea
        value={data.content || ''}
        onChange={(e) => onChange({ ...data, content: e.target.value })}
        placeholder="Add any other information relevant to your professional profile..."
        rows={6}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
      />
    </div>
  );
};

export default AdditionalInfoSection;
