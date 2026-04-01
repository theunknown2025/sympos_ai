import React from 'react';
import { CV } from '../../../../services/cvService';
import { Eye } from 'lucide-react';

interface CVPreviewCardProps {
  cv: CV;
  onView: () => void;
}

const CVPreviewCard: React.FC<CVPreviewCardProps> = ({ cv, onView }) => {
  const renderSectionPreview = (section: any) => {
    switch (section.type) {
      case 'title':
        return section.data.title || 'Untitled';
      case 'generalInfo':
        return section.data.email || 'No contact info';
      case 'profile':
        return section.data.content ? section.data.content.substring(0, 100) + '...' : 'No profile';
      case 'professionalExperience':
        return section.data.experiences?.[0]?.position || 'No experience';
      case 'education':
        return section.data.educations?.[0]?.degree || 'No education';
      default:
        return section.title;
    }
  };

  const getFirstSectionContent = () => {
    const sortedSections = cv.sections.sort((a, b) => a.order - b.order);
    if (sortedSections.length > 0) {
      return renderSectionPreview(sortedSections[0]);
    }
    return 'No content';
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Preview Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-slate-50">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{cv.title}</h3>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-4">
        {cv.profileImage && (
          <div className="mb-3 flex justify-center">
            <img
              src={cv.profileImage}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
            />
          </div>
        )}

        {/* Mini Preview */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 min-h-[120px]">
          <div className="space-y-2">
            {cv.sections
              .sort((a, b) => a.order - b.order)
              .slice(0, 3)
              .map((section, idx) => (
                <div key={section.id} className="text-xs">
                  <span className="font-medium text-slate-700">{section.title}:</span>{' '}
                  <span className="text-slate-600">
                    {renderSectionPreview(section)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>{cv.sections.length} section{cv.sections.length !== 1 ? 's' : ''}</span>
          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded">
            {new Date(cv.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CVPreviewCard;
