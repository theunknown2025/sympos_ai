import React, { useState } from 'react';
import { CV, CVSection } from '../../../../services/cvService';
import { GripVertical, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import TitleSection from './sections/TitleSection';
import GeneralInfoSection from './sections/GeneralInfoSection';
import ProfileSection from './sections/ProfileSection';
import ProfessionalExperienceSection from './sections/ProfessionalExperienceSection';
import EducationSection from './sections/EducationSection';
import SkillsSection from './sections/SkillsSection';
import LanguageSkillsSection from './sections/LanguageSkillsSection';
import CertificatesCoursesSection from './sections/CertificatesCoursesSection';
import ProjectsSection from './sections/ProjectsSection';
import VolunteeringSection from './sections/VolunteeringSection';
import PublicationsSection from './sections/PublicationsSection';
import ReferencesSection from './sections/ReferencesSection';
import AdditionalInfoSection from './sections/AdditionalInfoSection';
import ExternalProfilesSection from './sections/ExternalProfilesSection';
import AddSectionModal from './AddSectionModal';
import { v4 as uuidv4 } from 'uuid';

interface CVBuilderPanelProps {
  cv: Omit<CV, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  onUpdateSection: (sectionId: string, data: any) => void;
  onDeleteSection: (sectionId: string) => void;
  onReorderSections: (sections: CVSection[]) => void;
  onAddSection: (section: CVSection) => void;
  onProfileImageUpload: (file: File) => void;
}

const CVBuilderPanel: React.FC<CVBuilderPanelProps> = ({
  cv,
  onUpdateSection,
  onDeleteSection,
  onReorderSections,
  onAddSection,
  onProfileImageUpload,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(cv.sections.map((s) => s.id))
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSections = [...cv.sections];
    const draggedSection = newSections[draggedIndex];
    newSections.splice(draggedIndex, 1);
    newSections.splice(index, 0, draggedSection);

    // Update order numbers
    newSections.forEach((section, idx) => {
      section.order = idx;
    });

    onReorderSections(newSections);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const renderSection = (section: CVSection, index: number) => {
    const commonProps = {
      key: section.id,
      data: section.data,
      onChange: (data: any) => onUpdateSection(section.id, data),
    };

    switch (section.type) {
      case 'title':
        return <TitleSection {...commonProps} />;
      case 'generalInfo':
        return <GeneralInfoSection {...commonProps} />;
      case 'profile':
        return <ProfileSection {...commonProps} />;
      case 'professionalExperience':
        return <ProfessionalExperienceSection {...commonProps} />;
      case 'education':
        return <EducationSection {...commonProps} />;
      case 'skills':
        return <SkillsSection {...commonProps} />;
      case 'languageSkills':
        return <LanguageSkillsSection {...commonProps} />;
      case 'certificatesCourses':
        return <CertificatesCoursesSection {...commonProps} />;
      case 'projects':
        return <ProjectsSection {...commonProps} />;
      case 'volunteering':
        return <VolunteeringSection {...commonProps} />;
      case 'publications':
        return <PublicationsSection {...commonProps} />;
      case 'references':
        return <ReferencesSection {...commonProps} />;
      case 'additionalInfo':
        return <AdditionalInfoSection {...commonProps} />;
      case 'externalProfiles':
        return <ExternalProfilesSection {...commonProps} />;
      default:
        return (
          <div className="p-4 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-600">Unknown section type: {section.type}</p>
          </div>
        );
    }
  };

  const handleAddSection = (type: string, title: string) => {
    const newSection: CVSection = {
      id: uuidv4(),
      type,
      title,
      order: cv.sections.length,
      data: getDefaultSectionData(type),
    };
    onAddSection(newSection);
    setShowAddSectionModal(false);
  };

  const getDefaultSectionData = (type: string): any => {
    switch (type) {
      case 'title':
        return { title: '', subtitle: '' };
      case 'generalInfo':
        return { email: '', phone: '', address: '', links: [] };
      case 'profile':
        return { content: '' };
      case 'professionalExperience':
        return { experiences: [{ id: uuidv4(), company: '', position: '', startDate: '', endDate: '', description: '' }] };
      case 'education':
        return { educations: [{ id: uuidv4(), institution: '', degree: '', field: '', startDate: '', endDate: '' }] };
      case 'skills':
        return { skills: [{ id: uuidv4(), name: '', proficiency: 'Intermediate' }] };
      case 'languageSkills':
        return { languages: [{ id: uuidv4(), name: '', proficiency: 'Intermediate' }] };
      case 'certificatesCourses':
        return { certificates: [{ id: uuidv4(), name: '', issuer: '', date: '', credentialId: '', credentialUrl: '' }] };
      case 'projects':
        return { projects: [{ id: uuidv4(), name: '', description: '', technologies: '', url: '', startDate: '', endDate: '' }] };
      case 'volunteering':
        return { volunteerings: [{ id: uuidv4(), organization: '', role: '', description: '', startDate: '', endDate: '' }] };
      case 'publications':
        return { publications: [{ id: uuidv4(), title: '', authors: '', publisher: '', date: '', url: '', description: '' }] };
      case 'references':
        return { references: [{ id: uuidv4(), name: '', position: '', company: '', email: '', phone: '', relationship: '' }] };
      case 'additionalInfo':
        return { content: '' };
      case 'externalProfiles':
        return { profiles: [{ id: uuidv4(), platform: '', url: '', username: '' }] };
      default:
        return {};
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Builder</h2>
        <button
          onClick={() => setShowAddSectionModal(true)}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          Add Section
        </button>
      </div>

      {/* Profile Image Upload */}
      <div className="mb-6 p-4 border border-slate-200 rounded-lg">
        <label className="block text-sm font-medium text-slate-700 mb-2">Profile Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onProfileImageUpload(file);
            }
          }}
          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {cv.profileImage && (
          <div className="mt-3">
            <img
              src={cv.profileImage}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-slate-200"
            />
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {cv.sections
          .sort((a, b) => a.order - b.order)
          .map((section, index) => {
            const isExpanded = expandedSections.has(section.id);
            return (
              <div
                key={section.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="border border-slate-200 rounded-lg bg-white"
              >
                <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2 flex-1">
                    <GripVertical className="text-slate-400 cursor-move" size={18} />
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center gap-2 flex-1 text-left hover:text-indigo-600 transition-colors"
                    >
                      <h3 className="font-medium text-slate-900">{section.title}</h3>
                      {isExpanded ? (
                        <ChevronUp className="text-slate-400" size={18} />
                      ) : (
                        <ChevronDown className="text-slate-400" size={18} />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => onDeleteSection(section.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete section"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {isExpanded && (
                  <div className="p-4">{renderSection(section, index)}</div>
                )}
              </div>
            );
          })}
      </div>

      {showAddSectionModal && (
        <AddSectionModal
          onClose={() => setShowAddSectionModal(false)}
          onAdd={handleAddSection}
          existingSections={cv.sections.map((s) => s.type)}
        />
      )}
    </div>
  );
};

export default CVBuilderPanel;
