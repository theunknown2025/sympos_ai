import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Publication {
  id: string;
  title: string;
  authors: string;
  publisher: string;
  date: string;
  url?: string;
  description?: string;
}

interface PublicationsSectionProps {
  data: {
    publications: Publication[];
  };
  onChange: (data: { publications: Publication[] }) => void;
}

const PublicationsSection: React.FC<PublicationsSectionProps> = ({ data, onChange }) => {
  const handleAddPublication = () => {
    onChange({
      publications: [
        ...data.publications,
        {
          id: uuidv4(),
          title: '',
          authors: '',
          publisher: '',
          date: '',
          url: '',
          description: '',
        },
      ],
    });
  };

  const handleRemovePublication = (id: string) => {
    onChange({
      publications: data.publications.filter((pub) => pub.id !== id),
    });
  };

  const handleUpdatePublication = (id: string, field: keyof Publication, value: string) => {
    onChange({
      publications: data.publications.map((pub) =>
        pub.id === id ? { ...pub, [field]: value } : pub
      ),
    });
  };

  return (
    <div className="space-y-4">
      {data.publications.map((publication, index) => (
        <div key={publication.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-900">Publication {index + 1}</h4>
            {data.publications.length > 1 && (
              <button
                onClick={() => handleRemovePublication(publication.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove publication"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
              <input
                type="text"
                value={publication.title || ''}
                onChange={(e) => handleUpdatePublication(publication.id, 'title', e.target.value)}
                placeholder="Publication Title"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Authors</label>
              <input
                type="text"
                value={publication.authors || ''}
                onChange={(e) => handleUpdatePublication(publication.id, 'authors', e.target.value)}
                placeholder="Author names"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Publisher/Journal</label>
              <input
                type="text"
                value={publication.publisher || ''}
                onChange={(e) => handleUpdatePublication(publication.id, 'publisher', e.target.value)}
                placeholder="Publisher or Journal Name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="text"
                  value={publication.date || ''}
                  onChange={(e) => handleUpdatePublication(publication.id, 'date', e.target.value)}
                  placeholder="MM/YYYY"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">URL (Optional)</label>
                <input
                  type="url"
                  value={publication.url || ''}
                  onChange={(e) => handleUpdatePublication(publication.id, 'url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description (Optional)</label>
              <textarea
                value={publication.description || ''}
                onChange={(e) => handleUpdatePublication(publication.id, 'description', e.target.value)}
                placeholder="Brief description or abstract..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleAddPublication}
        className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Add Publication
      </button>
    </div>
  );
};

export default PublicationsSection;
