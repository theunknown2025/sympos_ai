import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { saveCV, CV, CVSection } from '../../../../services/cvService';
import { uploadImageToStorage } from '../../../../services/storageService';
import CVBuilderPanel from './CVBuilderPanel';
import CVPreview from './CVPreview';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CVBuilderEditorProps {
  initialCV?: CV | null;
}

const CVBuilderEditor: React.FC<CVBuilderEditorProps> = ({ initialCV }) => {
  const { currentUser } = useAuth();
  
  const getDefaultCV = (): Omit<CV, 'id' | 'userId' | 'createdAt' | 'updatedAt'> => ({
    title: 'My CV',
    profileImage: undefined,
    sections: [
      {
        id: uuidv4(),
        type: 'title',
        title: 'Title',
        order: 0,
        data: { title: 'Your Name', subtitle: 'Your Title' },
      },
      {
        id: uuidv4(),
        type: 'generalInfo',
        title: 'General Information',
        order: 1,
        data: { email: '', phone: '', address: '', links: [] },
      },
      {
        id: uuidv4(),
        type: 'profile',
        title: 'Profile',
        order: 2,
        data: { content: '' },
      },
      {
        id: uuidv4(),
        type: 'professionalExperience',
        title: 'Professional Experience',
        order: 3,
        data: { experiences: [{ id: uuidv4(), company: '', position: '', startDate: '', endDate: '', description: '' }] },
      },
      {
        id: uuidv4(),
        type: 'education',
        title: 'Education',
        order: 4,
        data: { educations: [{ id: uuidv4(), institution: '', degree: '', field: '', startDate: '', endDate: '' }] },
      },
    ],
  });

  const [cv, setCv] = useState<Omit<CV, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>(
    initialCV
      ? {
          title: initialCV.title,
          profileImage: initialCV.profileImage,
          sections: initialCV.sections,
        }
      : getDefaultCV()
  );
  
  const [cvId, setCvId] = useState<string | undefined>(initialCV?.id);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdateSection = (sectionId: string, data: any) => {
    setCv((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, data } : section
      ),
    }));
  };

  const handleDeleteSection = (sectionId: string) => {
    setCv((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.id !== sectionId),
    }));
  };

  const handleReorderSections = (newSections: CVSection[]) => {
    setCv((prev) => ({
      ...prev,
      sections: newSections,
    }));
  };

  const handleAddSection = (section: CVSection) => {
    setCv((prev) => ({
      ...prev,
      sections: [...prev.sections, section],
    }));
  };

  const handleProfileImageUpload = async (file: File) => {
    if (!currentUser?.id) return;

    try {
      const imageUrl = await uploadImageToStorage(currentUser.id, file, 'cv-images');
      setCv((prev) => ({
        ...prev,
        profileImage: imageUrl,
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    }
  };

  useEffect(() => {
    if (initialCV) {
      setCv({
        title: initialCV.title,
        profileImage: initialCV.profileImage,
        sections: initialCV.sections,
      });
      setCvId(initialCV.id);
    } else {
      setCv(getDefaultCV());
      setCvId(undefined);
    }
  }, [initialCV]);

  const handleSave = async () => {
    if (!currentUser?.id) {
      setError('You must be logged in to save CVs');
      return;
    }

    if (!cv.title.trim()) {
      setError('Please enter a CV title');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(false);

      const savedCV = await saveCV(currentUser.id, { ...cv, id: cvId });
      setCvId(savedCV.id);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save CV');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Save button */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex-1">
          <input
            type="text"
            value={cv.title}
            onChange={(e) => setCv((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="CV Title"
            className="text-xl font-bold text-slate-900 bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save CV
            </>
          )}
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          CV saved successfully!
        </div>
      )}

      {/* Builder and Preview */}
      <div className="flex-1 flex gap-4 min-h-0">
        <div className="w-1/2 border-r border-slate-200 pr-4 overflow-y-auto">
          <CVBuilderPanel
            cv={cv}
            onUpdateSection={handleUpdateSection}
            onDeleteSection={handleDeleteSection}
            onReorderSections={handleReorderSections}
            onAddSection={handleAddSection}
            onProfileImageUpload={handleProfileImageUpload}
          />
        </div>
        <div className="w-1/2 pl-4 overflow-y-auto">
          <CVPreview cv={cv} />
        </div>
      </div>
    </div>
  );
};

export default CVBuilderEditor;
