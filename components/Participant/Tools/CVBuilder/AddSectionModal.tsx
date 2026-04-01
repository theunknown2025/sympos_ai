import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  CheckSquare, 
  Languages, 
  Award, 
  FolderKanban, 
  Heart, 
  BookOpen, 
  Users, 
  Info, 
  Globe 
} from 'lucide-react';

interface AddSectionModalProps {
  onClose: () => void;
  onAdd: (type: string, title: string) => void;
  existingSections: string[];
}

const availableSections = [
  { type: 'title', title: 'Title', description: 'Name and professional title', icon: User },
  { type: 'generalInfo', title: 'General Information', description: 'Contact information', icon: Mail },
  { type: 'profile', title: 'Profile', description: 'Professional summary', icon: FileText },
  { type: 'professionalExperience', title: 'Professional Experience', description: 'Work history', icon: Briefcase },
  { type: 'education', title: 'Education', description: 'Academic background', icon: GraduationCap },
  { type: 'skills', title: 'Skills', description: 'List your technical and soft skills with proficiency levels', icon: CheckSquare },
  { type: 'languageSkills', title: 'Language Skills', description: 'Showcase your language abilities and proficiency levels', icon: Languages },
  { type: 'certificatesCourses', title: 'Certificates & Courses', description: 'List relevant certifications and professional courses', icon: Award },
  { type: 'projects', title: 'Projects', description: 'Highlight key projects that demonstrate your abilities', icon: FolderKanban },
  { type: 'volunteering', title: 'Volunteering Experience', description: 'Share your volunteering experiences and community work', icon: Heart },
  { type: 'publications', title: 'Publications', description: 'Add your published works, articles, or research papers', icon: BookOpen },
  { type: 'references', title: 'References', description: 'Include professional references or recommendation statements', icon: Users },
  { type: 'additionalInfo', title: 'Additional Information', description: 'Add any other information relevant to your professional profile', icon: Info },
  { type: 'externalProfiles', title: 'External Profiles', description: 'Add links to your professional profiles on external platforms', icon: Globe },
];

const AddSectionModal: React.FC<AddSectionModalProps> = ({ onClose, onAdd, existingSections }) => {
  const [selectedType, setSelectedType] = useState<string>('');

  const handleAdd = () => {
    if (selectedType) {
      const section = availableSections.find((s) => s.type === selectedType);
      if (section) {
        onAdd(selectedType, section.title);
      }
    }
  };

  const availableOptions = availableSections.filter(
    (section) => !existingSections.includes(section.type)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Add Section</h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {availableOptions.length === 0 ? (
            <p className="text-slate-600 text-center py-4">
              All available sections have been added.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-600 mb-4">Select a section to add:</p>
              <div className="grid grid-cols-2 gap-3">
                {availableOptions.map((section) => {
                  const IconComponent = section.icon;
                  return (
                    <button
                      key={section.type}
                      onClick={() => setSelectedType(section.type)}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        selectedType === section.type
                          ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          selectedType === section.type
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <IconComponent size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 mb-1">{section.title}</div>
                          <div className="text-xs text-slate-600 leading-relaxed">{section.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedType || availableOptions.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Section
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSectionModal;
