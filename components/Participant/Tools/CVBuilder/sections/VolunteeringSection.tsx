import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Volunteering {
  id: string;
  organization: string;
  role: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface VolunteeringSectionProps {
  data: {
    volunteerings: Volunteering[];
  };
  onChange: (data: { volunteerings: Volunteering[] }) => void;
}

const VolunteeringSection: React.FC<VolunteeringSectionProps> = ({ data, onChange }) => {
  const handleAddVolunteering = () => {
    onChange({
      volunteerings: [
        ...data.volunteerings,
        {
          id: uuidv4(),
          organization: '',
          role: '',
          description: '',
          startDate: '',
          endDate: '',
        },
      ],
    });
  };

  const handleRemoveVolunteering = (id: string) => {
    onChange({
      volunteerings: data.volunteerings.filter((vol) => vol.id !== id),
    });
  };

  const handleUpdateVolunteering = (id: string, field: keyof Volunteering, value: string) => {
    onChange({
      volunteerings: data.volunteerings.map((vol) =>
        vol.id === id ? { ...vol, [field]: value } : vol
      ),
    });
  };

  return (
    <div className="space-y-4">
      {data.volunteerings.map((volunteering, index) => (
        <div key={volunteering.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-900">Volunteering {index + 1}</h4>
            {data.volunteerings.length > 1 && (
              <button
                onClick={() => handleRemoveVolunteering(volunteering.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove volunteering"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Organization</label>
              <input
                type="text"
                value={volunteering.organization || ''}
                onChange={(e) => handleUpdateVolunteering(volunteering.id, 'organization', e.target.value)}
                placeholder="Organization Name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Role/Position</label>
              <input
                type="text"
                value={volunteering.role || ''}
                onChange={(e) => handleUpdateVolunteering(volunteering.id, 'role', e.target.value)}
                placeholder="Volunteer Role"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={volunteering.description || ''}
                onChange={(e) => handleUpdateVolunteering(volunteering.id, 'description', e.target.value)}
                placeholder="Describe your volunteering activities and contributions..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  type="text"
                  value={volunteering.startDate || ''}
                  onChange={(e) => handleUpdateVolunteering(volunteering.id, 'startDate', e.target.value)}
                  placeholder="MM/YYYY"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                <input
                  type="text"
                  value={volunteering.endDate || ''}
                  onChange={(e) => handleUpdateVolunteering(volunteering.id, 'endDate', e.target.value)}
                  placeholder="MM/YYYY or Present"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleAddVolunteering}
        className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Add Volunteering Experience
      </button>
    </div>
  );
};

export default VolunteeringSection;
