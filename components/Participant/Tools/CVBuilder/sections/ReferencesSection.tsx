import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Reference {
  id: string;
  name: string;
  position: string;
  company: string;
  email: string;
  phone?: string;
  relationship?: string;
}

interface ReferencesSectionProps {
  data: {
    references: Reference[];
  };
  onChange: (data: { references: Reference[] }) => void;
}

const ReferencesSection: React.FC<ReferencesSectionProps> = ({ data, onChange }) => {
  const handleAddReference = () => {
    onChange({
      references: [
        ...data.references,
        {
          id: uuidv4(),
          name: '',
          position: '',
          company: '',
          email: '',
          phone: '',
          relationship: '',
        },
      ],
    });
  };

  const handleRemoveReference = (id: string) => {
    onChange({
      references: data.references.filter((ref) => ref.id !== id),
    });
  };

  const handleUpdateReference = (id: string, field: keyof Reference, value: string) => {
    onChange({
      references: data.references.map((ref) =>
        ref.id === id ? { ...ref, [field]: value } : ref
      ),
    });
  };

  return (
    <div className="space-y-4">
      {data.references.map((reference, index) => (
        <div key={reference.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-900">Reference {index + 1}</h4>
            {data.references.length > 1 && (
              <button
                onClick={() => handleRemoveReference(reference.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove reference"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={reference.name || ''}
                onChange={(e) => handleUpdateReference(reference.id, 'name', e.target.value)}
                placeholder="Reference Name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Position</label>
                <input
                  type="text"
                  value={reference.position || ''}
                  onChange={(e) => handleUpdateReference(reference.id, 'position', e.target.value)}
                  placeholder="Job Title"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Company</label>
                <input
                  type="text"
                  value={reference.company || ''}
                  onChange={(e) => handleUpdateReference(reference.id, 'company', e.target.value)}
                  placeholder="Company Name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={reference.email || ''}
                  onChange={(e) => handleUpdateReference(reference.id, 'email', e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  value={reference.phone || ''}
                  onChange={(e) => handleUpdateReference(reference.id, 'phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Relationship (Optional)</label>
              <input
                type="text"
                value={reference.relationship || ''}
                onChange={(e) => handleUpdateReference(reference.id, 'relationship', e.target.value)}
                placeholder="e.g., Former Manager, Colleague"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleAddReference}
        className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Add Reference
      </button>
    </div>
  );
};

export default ReferencesSection;
