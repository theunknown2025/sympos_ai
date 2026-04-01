import React from 'react';
import { CV } from '../../../../services/cvService';
import { Download, Mail, Phone, MapPin, Linkedin, Github, GitBranch, GraduationCap, Fingerprint, BookOpen, Globe, Twitter } from 'lucide-react';
import { exportCVToPDF } from './exportCVToPDF';

interface CVPreviewProps {
  cv: Omit<CV, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
}

const CVPreview: React.FC<CVPreviewProps> = ({ cv }) => {
  const handleExportPDF = () => {
    exportCVToPDF(cv);
  };

  const renderSection = (section: any) => {
    switch (section.type) {
      case 'title':
        return (
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {section.data.title || 'Your Name'}
            </h1>
            {section.data.subtitle && (
              <p className="text-lg text-slate-600">{section.data.subtitle}</p>
            )}
          </div>
        );
      case 'generalInfo':
        const getPlatformIcon = (platform: string) => {
          switch (platform) {
            case 'linkedin':
              return <Linkedin size={18} />;
            case 'github':
              return <Github size={18} />;
            case 'gitlab':
              return <GitBranch size={18} />;
            case 'google-scholar':
              return <GraduationCap size={18} />;
            case 'orcid':
              return <Fingerprint size={18} />;
            case 'researchgate':
              return <BookOpen size={18} />;
            case 'twitter':
              return <Twitter size={18} />;
            case 'website':
            case 'other':
            default:
              return <Globe size={18} />;
          }
        };

        const getPlatformLabel = (platform: string) => {
          const platformObj = availablePlatforms.find((p) => p.value === platform);
          return platformObj ? platformObj.label : platform;
        };

        return (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-300 pb-2">
              Contact Information
            </h2>
            <div className="space-y-3">
              {section.data.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="text-indigo-600 flex-shrink-0" size={18} />
                  <a
                    href={`mailto:${section.data.email}`}
                    className="text-slate-700 hover:text-indigo-600 transition-colors"
                  >
                    {section.data.email}
                  </a>
                </div>
              )}
              {section.data.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="text-indigo-600 flex-shrink-0" size={18} />
                  <a
                    href={`tel:${section.data.phone}`}
                    className="text-slate-700 hover:text-indigo-600 transition-colors"
                  >
                    {section.data.phone}
                  </a>
                </div>
              )}
              {section.data.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="text-indigo-600 flex-shrink-0" size={18} />
                  <span className="text-slate-700">{section.data.address}</span>
                </div>
              )}
              {section.data.links && section.data.links.length > 0 && (
                <div className="space-y-2 mt-4">
                  {section.data.links.map((link: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <div className="text-indigo-600 flex-shrink-0">
                        {getPlatformIcon(link.platform)}
                      </div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-700 hover:text-indigo-600 transition-colors"
                      >
                        {getPlatformLabel(link.platform)}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-300 pb-2">
              Profile
            </h2>
            <p className="text-slate-700 whitespace-pre-line">{section.data.content}</p>
          </div>
        );
      case 'professionalExperience':
        return (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-300 pb-2">
              Professional Experience
            </h2>
            <div className="space-y-4">
              {section.data.experiences?.map((exp: any, index: number) => (
                <div key={index} className="border-l-2 border-indigo-500 pl-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="font-semibold text-slate-900">{exp.position || 'Position'}</h3>
                      <p className="text-slate-600">{exp.company || 'Company'}</p>
                    </div>
                    {(exp.startDate || exp.endDate) && (
                      <span className="text-sm text-slate-500 whitespace-nowrap">
                        {exp.startDate} - {exp.endDate || 'Present'}
                      </span>
                    )}
                  </div>
                  {exp.description && (
                    <p className="text-slate-700 text-sm mt-2 whitespace-pre-line">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'education':
        return (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-300 pb-2">
              Education
            </h2>
            <div className="space-y-4">
              {section.data.educations?.map((edu: any, index: number) => (
                <div key={index} className="border-l-2 border-indigo-500 pl-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {edu.degree || 'Degree'} {edu.field && `in ${edu.field}`}
                      </h3>
                      <p className="text-slate-600">{edu.institution || 'Institution'}</p>
                    </div>
                    {(edu.startDate || edu.endDate) && (
                      <span className="text-sm text-slate-500 whitespace-nowrap">
                        {edu.startDate} - {edu.endDate || 'Present'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'skills':
        return (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-300 pb-2">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {section.data.skills?.map((skill: any, index: number) => (
                <div key={index} className="px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <span className="font-medium text-slate-900">{skill.name}</span>
                  {skill.proficiency && (
                    <span className="text-xs text-slate-600 ml-2">({skill.proficiency})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'languageSkills':
        return (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-300 pb-2">
              Language Skills
            </h2>
            <div className="space-y-2">
              {section.data.languages?.map((lang: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{lang.name}</span>
                  <span className="text-sm text-slate-600">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'certificatesCourses':
        return (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-300 pb-2">
              Certificates & Courses
            </h2>
            <div className="space-y-3">
              {section.data.certificates?.map((cert: any, index: number) => (
                <div key={index} className="border-l-2 border-indigo-500 pl-4">
                  <h3 className="font-semibold text-slate-900">{cert.name || 'Certificate'}</h3>
                  <p className="text-slate-600">{cert.issuer || 'Issuer'}</p>
                  {cert.date && <p className="text-sm text-slate-500 mt-1">{cert.date}</p>}
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      View Credential
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'projects':
        return (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-300 pb-2">
              Projects
            </h2>
            <div className="space-y-4">
              {section.data.projects?.map((project: any, index: number) => (
                <div key={index} className="border-l-2 border-indigo-500 pl-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="font-semibold text-slate-900">{project.name || 'Project Name'}</h3>
                      {project.technologies && (
                        <p className="text-sm text-slate-600 mt-1">{project.technologies}</p>
                      )}
                    </div>
                    {(project.startDate || project.endDate) && (
                      <span className="text-sm text-slate-500 whitespace-nowrap">
                        {project.startDate} - {project.endDate || 'Present'}
                      </span>
                    )}
                  </div>
                  {project.description && (
                    <p className="text-slate-700 text-sm mt-2 whitespace-pre-line">
                      {project.description}
                    </p>
                  )}
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline text-sm mt-2 inline-block"
                    >
                      View Project
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'volunteering':
        return (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-300 pb-2">
              Volunteering Experience
            </h2>
            <div className="space-y-4">
              {section.data.volunteerings?.map((vol: any, index: number) => (
                <div key={index} className="border-l-2 border-indigo-500 pl-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="font-semibold text-slate-900">{vol.role || 'Role'}</h3>
                      <p className="text-slate-600">{vol.organization || 'Organization'}</p>
                    </div>
                    {(vol.startDate || vol.endDate) && (
                      <span className="text-sm text-slate-500 whitespace-nowrap">
                        {vol.startDate} - {vol.endDate || 'Present'}
                      </span>
                    )}
                  </div>
                  {vol.description && (
                    <p className="text-slate-700 text-sm mt-2 whitespace-pre-line">
                      {vol.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'publications':
        return (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-300 pb-2">
              Publications
            </h2>
            <div className="space-y-3">
              {section.data.publications?.map((pub: any, index: number) => (
                <div key={index} className="border-l-2 border-indigo-500 pl-4">
                  <h3 className="font-semibold text-slate-900">{pub.title || 'Publication Title'}</h3>
                  {pub.authors && <p className="text-slate-600 text-sm mt-1">{pub.authors}</p>}
                  <p className="text-slate-600 text-sm">{pub.publisher || 'Publisher'}</p>
                  {pub.date && <p className="text-sm text-slate-500 mt-1">{pub.date}</p>}
                  {pub.description && (
                    <p className="text-slate-700 text-sm mt-2 whitespace-pre-line">
                      {pub.description}
                    </p>
                  )}
                  {pub.url && (
                    <a
                      href={pub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline text-sm mt-2 inline-block"
                    >
                      View Publication
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'references':
        return (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-300 pb-2">
              References
            </h2>
            <div className="space-y-3">
              {section.data.references?.map((ref: any, index: number) => (
                <div key={index} className="border-l-2 border-indigo-500 pl-4">
                  <h3 className="font-semibold text-slate-900">{ref.name || 'Reference Name'}</h3>
                  <p className="text-slate-600">{ref.position || 'Position'}</p>
                  <p className="text-slate-600 text-sm">{ref.company || 'Company'}</p>
                  {ref.email && (
                    <p className="text-sm text-slate-600 mt-1">
                      <span className="font-medium">Email:</span> {ref.email}
                    </p>
                  )}
                  {ref.phone && (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Phone:</span> {ref.phone}
                    </p>
                  )}
                  {ref.relationship && (
                    <p className="text-sm text-slate-500 mt-1 italic">{ref.relationship}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'additionalInfo':
        return (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-300 pb-2">
              Additional Information
            </h2>
            <p className="text-slate-700 whitespace-pre-line">{section.data.content}</p>
          </div>
        );
      case 'externalProfiles':
        return (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-300 pb-2">
              External Profiles
            </h2>
            <div className="space-y-2">
              {section.data.profiles?.map((profile: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-900">{profile.platform || 'Platform'}</span>
                    {profile.username && (
                      <span className="text-sm text-slate-600 ml-2">({profile.username})</span>
                    )}
                  </div>
                  {profile.url && (
                    <a
                      href={profile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      Visit Profile
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Preview</h2>
        <button
          onClick={handleExportPDF}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
        >
          <Download size={16} />
          Export PDF
        </button>
      </div>
      <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        <div className="max-w-3xl mx-auto">
          {/* Profile Image */}
          {cv.profileImage && (
            <div className="text-center mb-6">
              <img
                src={cv.profileImage}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-slate-200 mx-auto"
              />
            </div>
          )}

          {/* Sections */}
          {cv.sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <div key={section.id}>{renderSection(section)}</div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CVPreview;
