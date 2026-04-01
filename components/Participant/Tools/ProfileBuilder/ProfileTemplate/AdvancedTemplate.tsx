import React from 'react';
import { ProfessorProfile } from '../../../../../services/profileBuilderService';
import { Mail, Phone, MapPin, Linkedin, Github, GraduationCap, Fingerprint, BookOpen, Globe, Twitter, FileText, Briefcase, Award, Image, Book, Download, ExternalLink } from 'lucide-react';
import { generateDesignStyles } from '../designUtils';
import { getTranslatedSectionTitle } from '../sectionTranslations';

interface AdvancedTemplateProps {
  profile: ProfessorProfile;
}

const AdvancedTemplate: React.FC<AdvancedTemplateProps> = ({ profile }) => {
  const generalInfo = profile.generalInfo || {};
  const designStyles = generateDesignStyles(profile.design);
  const direction = profile.design?.language?.direction || 'ltr';
  const language = profile.design?.language?.code || 'en';

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'profile':
        return <FileText size={20} className="text-indigo-600" />;
      case 'education':
        return <GraduationCap size={20} className="text-indigo-600" />;
      case 'experiences':
        return <Briefcase size={20} className="text-indigo-600" />;
      case 'publications':
        return <BookOpen size={20} className="text-indigo-600" />;
      case 'certifications':
        return <Award size={20} className="text-indigo-600" />;
      case 'media':
        return <Image size={20} className="text-indigo-600" />;
      case 'blog':
        return <Book size={20} className="text-indigo-600" />;
      default:
        return <FileText size={20} className="text-indigo-600" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return <Linkedin size={18} />;
      case 'github':
        return <Github size={18} />;
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

  const renderSectionContent = (section: any) => {
    switch (section.type) {
      case 'profile':
        return (
          <div className="prose max-w-none">
            <p className="text-slate-700 whitespace-pre-line leading-relaxed">{section.data.content || 'No content yet.'}</p>
          </div>
        );
      case 'education':
        return (
          <div className="space-y-4">
            {section.data.educations?.map((edu: any, index: number) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-lg">
                      {edu.degree || 'Degree'} {edu.field && `in ${edu.field}`}
                    </h3>
                    <p className="text-indigo-600 font-medium mt-1">{edu.institution || 'Institution'}</p>
                  </div>
                  {(edu.startDate || edu.endDate) && (
                    <span className="text-sm text-slate-500 whitespace-nowrap bg-white px-3 py-1 rounded-full" style={designStyles.dates}>
                      {edu.startDate} - {edu.endDate || 'Present'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      case 'experiences':
        return (
          <div className="space-y-4">
            {section.data.experiences?.map((exp: any, index: number) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-lg">{exp.position || 'Position'}</h3>
                    <p className="text-indigo-600 font-medium mt-1">{exp.company || 'Company'}</p>
                    {exp.description && (
                      <p className="text-slate-600 mt-2 text-sm leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                  {(exp.startDate || exp.endDate) && (
                    <span className="text-sm text-slate-500 whitespace-nowrap bg-white px-3 py-1 rounded-full" style={designStyles.dates}>
                      {exp.startDate} - {exp.endDate || 'Present'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      case 'publications':
        return (
          <div className="space-y-4">
            {section.data.publications?.map((pub: any, index: number) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <h3 className="font-semibold text-slate-900 text-lg">{pub.title || 'Publication Title'}</h3>
                {pub.authors && <p className="text-slate-600 mt-1">{pub.authors}</p>}
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  {pub.publisher && <span className="text-sm text-slate-500">{pub.publisher}</span>}
                  {pub.date && <span className="text-sm text-slate-500" style={designStyles.dates}>{pub.date}</span>}
                </div>
                {pub.url && (
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mt-2 text-sm font-medium"
                    style={designStyles.links}
                  >
                    <ExternalLink size={16} />
                    View Publication
                  </a>
                )}
                {pub.description && (
                  <p className="text-slate-600 mt-2 text-sm leading-relaxed">{pub.description}</p>
                )}
              </div>
            ))}
          </div>
        );
      case 'certifications':
        return (
          <div className="space-y-4">
            {section.data.certifications?.map((cert: any, index: number) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <h3 className="font-semibold text-slate-900 text-lg">{cert.name || 'Certification Name'}</h3>
                <p className="text-indigo-600 font-medium mt-1">{cert.issuer || 'Issuer'}</p>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  {cert.date && <span className="text-sm text-slate-500" style={designStyles.dates}>{cert.date}</span>}
                  {cert.credentialId && <span className="text-sm text-slate-500">ID: {cert.credentialId}</span>}
                </div>
                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mt-2 text-sm font-medium"
                    style={designStyles.links}
                  >
                    <ExternalLink size={16} />
                    Verify Credential
                  </a>
                )}
              </div>
            ))}
          </div>
        );
      case 'media':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.data.mediaItems?.map((item: any, index: number) => (
              <div key={index} className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                {item.type === 'image' && item.url && (
                  <img src={item.url} alt={item.title || 'Media'} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  {item.title && <h3 className="font-semibold text-slate-900">{item.title}</h3>}
                  {item.description && <p className="text-slate-600 text-sm mt-1">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        );
      case 'blog':
        return (
          <div className="space-y-4">
            {section.data.blogPosts?.map((post: any, index: number) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <h3 className="font-semibold text-slate-900 text-lg">{post.title || 'Blog Post Title'}</h3>
                {post.date && <p className="text-sm text-slate-500 mt-1" style={designStyles.dates}>{post.date}</p>}
                {post.content && (
                  <p className="text-slate-600 mt-2 text-sm leading-relaxed line-clamp-3">{post.content}</p>
                )}
                {post.url && (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mt-2 text-sm font-medium"
                    style={designStyles.links}
                  >
                    <ExternalLink size={16} />
                    Read More
                  </a>
                )}
              </div>
            ))}
          </div>
        );
      default:
        return <div className="text-slate-600">No content available</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" style={designStyles.background} dir={direction}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                {profile.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                    <span className="text-indigo-400 text-sm">No Image</span>
                  </div>
                )}
              </div>

              {/* General Information */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-white mb-2" style={designStyles.titles}>
                  {generalInfo.title && `${generalInfo.title} `}
                  {generalInfo.firstName || ''} {generalInfo.lastName || ''}
                </h1>
                {generalInfo.position && (
                  <p className="text-xl text-indigo-100 mt-1" style={designStyles.subtitles}>{generalInfo.position}</p>
                )}
                {generalInfo.organization && (
                  <p className="text-indigo-100 mt-1" style={designStyles.subtitles}>{generalInfo.organization}</p>
                )}
                
                {/* Contact Information */}
                <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
                  {generalInfo.email && (
                    <a
                      href={`mailto:${generalInfo.email}`}
                      className="flex items-center gap-2 text-white hover:text-indigo-100 transition-colors"
                      style={designStyles.links}
                    >
                      <Mail size={18} />
                      <span className="text-sm">{generalInfo.email}</span>
                    </a>
                  )}
                  {generalInfo.phone && (
                    <a
                      href={`tel:${generalInfo.phone}`}
                      className="flex items-center gap-2 text-white hover:text-indigo-100 transition-colors"
                      style={designStyles.links}
                    >
                      <Phone size={18} />
                      <span className="text-sm">{generalInfo.phone}</span>
                    </a>
                  )}
                  {generalInfo.address && (
                    <div className="flex items-center gap-2 text-white">
                      <MapPin size={18} />
                      <span className="text-sm">{generalInfo.address}</span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {generalInfo.links && generalInfo.links.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                    {generalInfo.links.map((link: any, index: number) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors text-sm"
                        style={designStyles.links}
                      >
                        {getPlatformIcon(link.platform)}
                        <span>{link.platform}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bio Section */}
            {generalInfo.bio && (
              <div className="mt-6 pt-6 border-t border-indigo-400/30">
                <p className="text-white/90 leading-relaxed whitespace-pre-line">{generalInfo.bio}</p>
              </div>
            )}

            {/* Section Titles Navigation */}
            {profile.sections.length > 0 && (
              <div className="mt-6 pt-6 border-t border-indigo-400/30">
                <h3 className="text-lg font-semibold text-white mb-4">Sections</h3>
                <div className="flex flex-wrap gap-3">
                  {profile.sections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <a
                        key={section.id}
                        href={`#section-${section.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors text-sm"
                        style={designStyles.links}
                      >
                        {getSectionIcon(section.type)}
                        <span>{getTranslatedSectionTitle(section.type, section.title, language as 'en' | 'fr' | 'ar')}</span>
                      </a>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content - Full Width */}
        <div className="space-y-6">
          {profile.sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <div
                key={section.id}
                id={`section-${section.id}`}
                className="bg-white rounded-xl shadow-md p-6 scroll-mt-8"
                style={designStyles.section ? designStyles.section(section.id) : {}}
              >
                <h2 className={`text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3 pb-3 border-b border-slate-200 ${direction === 'rtl' ? 'flex-row-reverse justify-end text-right' : 'justify-start text-left'}`} dir={direction} style={designStyles.titles}>
                  {direction === 'ltr' && getSectionIcon(section.type)}
                  {getTranslatedSectionTitle(section.type, section.title, language as 'en' | 'fr' | 'ar')}
                  {direction === 'rtl' && getSectionIcon(section.type)}
                </h2>
                {renderSectionContent(section)}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedTemplate;
