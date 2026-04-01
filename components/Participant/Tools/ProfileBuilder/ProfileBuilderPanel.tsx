import React, { useState } from 'react';
import { ProfessorProfile, ProfileSection } from '../../../../services/profileBuilderService';
import { GripVertical, Trash2, Plus, ChevronDown, ChevronUp, User, FileText, GraduationCap, Briefcase, BookOpen, Award, Image, Book } from 'lucide-react';
import GeneralInfoSection from './sections/GeneralInfoSection';
import ProfileSectionComponent from './sections/ProfileSection';
import EducationSection from './sections/EducationSection';
import ExperiencesSection from './sections/ExperiencesSection';
import PublicationsSection from './sections/PublicationsSection';
import CertificationsSection from './sections/CertificationsSection';
import MediaSection from './sections/MediaSection';
import BlogSection from './sections/BlogSection';
import { v4 as uuidv4 } from 'uuid';
import { getSectionTitle } from './sectionTranslations';

interface ProfileBuilderPanelProps {
  profile: Omit<ProfessorProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  onUpdateSection: (sectionId: string, data: any) => void;
  onDeleteSection: (sectionId: string) => void;
  onReorderSections: (sections: ProfileSection[]) => void;
  onAddSection: (section: ProfileSection) => void;
  onUpdateGeneralInfo: (generalInfo: any) => void;
  onProfileImageUpload: (file: File) => void;
}

const ProfileBuilderPanel: React.FC<ProfileBuilderPanelProps> = ({
  profile,
  onUpdateSection,
  onDeleteSection,
  onReorderSections,
  onAddSection,
  onUpdateGeneralInfo,
  onProfileImageUpload,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isGeneralInfoOpen, setIsGeneralInfoOpen] = useState<boolean>(false);
  const language = profile.design?.language?.code || 'en';
  const direction = profile.design?.language?.direction || 'ltr';

  const toggleGeneralInfo = () => {
    if (isGeneralInfoOpen) {
      setIsGeneralInfoOpen(false);
    } else {
      setIsGeneralInfoOpen(true);
      setExpandedSections(new Set());
    }
  };

  const toggleSectionAccordion = (sectionId: string) => {
    if (expandedSections.has(sectionId)) {
      setExpandedSections(new Set());
    } else {
      setExpandedSections(new Set([sectionId]));
      setIsGeneralInfoOpen(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSections = [...profile.sections];
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

  const renderSection = (section: ProfileSection, index: number) => {
    const commonProps = {
      key: section.id,
      data: section.data,
      onChange: (data: any) => onUpdateSection(section.id, data),
      language: language as 'en' | 'fr' | 'ar',
      direction: direction,
    };

    switch (section.type) {
      case 'profile':
        return <ProfileSectionComponent {...commonProps} />;
      case 'education':
        return <EducationSection {...commonProps} />;
      case 'experiences':
        return <ExperiencesSection {...commonProps} />;
      case 'publications':
        return <PublicationsSection {...commonProps} />;
      case 'certifications':
        return <CertificationsSection {...commonProps} />;
      case 'media':
        return <MediaSection {...commonProps} />;
      case 'blog':
        return <BlogSection {...commonProps} />;
      default:
        return (
          <div className="p-4 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-600">Unknown section type: {section.type}</p>
          </div>
        );
    }
  };

  const handleAddSection = (type: string, title: string) => {
    // Use translated title based on language
    const translatedTitle = getSectionTitle(type, language as 'en' | 'fr' | 'ar');
    const newSection: ProfileSection = {
      id: uuidv4(),
      type,
      title: translatedTitle,
      order: profile.sections.length,
      data: getDefaultSectionData(type),
    };
    onAddSection(newSection);
  };

  const getDefaultSectionData = (type: string): any => {
    switch (type) {
      case 'profile':
        return { content: '' };
      case 'education':
        return { educations: [{ id: uuidv4(), institution: '', degree: '', field: '', startDate: '', endDate: '' }] };
      case 'experiences':
        return { experiences: [{ id: uuidv4(), company: '', position: '', startDate: '', endDate: '', description: '' }] };
      case 'publications':
        return { publications: [{ id: uuidv4(), title: '', authors: '', publisher: '', date: '', url: '', description: '' }] };
      case 'certifications':
        return { certifications: [{ id: uuidv4(), name: '', issuer: '', date: '', credentialId: '', credentialUrl: '' }] };
      case 'media':
        return { mediaItems: [{ id: uuidv4(), title: '', type: 'image', url: '', description: '' }] };
      case 'blog':
        return { blogPosts: [{ id: uuidv4(), title: '', content: '', date: '', url: '' }] };
      default:
        return {};
    }
  };

  const availableSections = [
    { type: 'profile', title: getSectionTitle('profile', language as 'en' | 'fr' | 'ar') },
    { type: 'education', title: getSectionTitle('education', language as 'en' | 'fr' | 'ar') },
    { type: 'experiences', title: getSectionTitle('experiences', language as 'en' | 'fr' | 'ar') },
    { type: 'publications', title: getSectionTitle('publications', language as 'en' | 'fr' | 'ar') },
    { type: 'certifications', title: getSectionTitle('certifications', language as 'en' | 'fr' | 'ar') },
    { type: 'media', title: getSectionTitle('media', language as 'en' | 'fr' | 'ar') },
    { type: 'blog', title: getSectionTitle('blog', language as 'en' | 'fr' | 'ar') },
  ];

  const existingSectionTypes = new Set(profile.sections.map((s) => s.type));

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'profile':
        return <FileText size={18} className="text-indigo-600" />;
      case 'education':
        return <GraduationCap size={18} className="text-indigo-600" />;
      case 'experiences':
        return <Briefcase size={18} className="text-indigo-600" />;
      case 'publications':
        return <BookOpen size={18} className="text-indigo-600" />;
      case 'certifications':
        return <Award size={18} className="text-indigo-600" />;
      case 'media':
        return <Image size={18} className="text-indigo-600" />;
      case 'blog':
        return <Book size={18} className="text-indigo-600" />;
      default:
        return <FileText size={18} className="text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* General Information Section - Accordion */}
      <div className="mb-6 border border-slate-200 rounded-lg bg-white">
        <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
          <button
            onClick={toggleGeneralInfo}
            className="flex items-center gap-2 flex-1 text-left hover:text-indigo-600 transition-colors"
          >
            <User size={18} className="text-indigo-600" />
            <h3 className="font-medium text-slate-900">General Information</h3>
            {isGeneralInfoOpen ? (
              <ChevronUp className="text-slate-400 ml-auto" size={18} />
            ) : (
              <ChevronDown className="text-slate-400 ml-auto" size={18} />
            )}
          </button>
        </div>
        {isGeneralInfoOpen && (
          <div className="p-4 space-y-4">
            <GeneralInfoSection
              data={profile.generalInfo || {}}
              onChange={onUpdateGeneralInfo}
              language={language as 'en' | 'fr' | 'ar'}
              direction={direction}
            />
            
            {/* Profile Image Upload */}
            <div className="pt-4 border-t border-slate-200">
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
              {profile.profileImage && (
                <div className="mt-3">
                  <img
                    src={profile.profileImage}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-slate-200"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {profile.sections
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
                      onClick={() => toggleSectionAccordion(section.id)}
                      className="flex items-center gap-2 flex-1 text-left hover:text-indigo-600 transition-colors"
                    >
                      {getSectionIcon(section.type)}
                      <h3 className="font-medium text-slate-900">{section.title}</h3>
                      {isExpanded ? (
                        <ChevronUp className="text-slate-400 ml-auto" size={18} />
                      ) : (
                        <ChevronDown className="text-slate-400 ml-auto" size={18} />
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

      {/* Add Section Dropdown */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">Add Section</label>
        <select
          onChange={(e) => {
            if (e.target.value) {
              const section = availableSections.find((s) => s.type === e.target.value);
              if (section && !existingSectionTypes.has(section.type)) {
                handleAddSection(section.type, section.title);
                e.target.value = '';
              }
            }
          }}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Select a section to add...</option>
          {availableSections
            .filter((section) => !existingSectionTypes.has(section.type))
            .map((section) => (
              <option key={section.type} value={section.type}>
                {section.title}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};

export default ProfileBuilderPanel;
