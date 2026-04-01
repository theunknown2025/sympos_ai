import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublishedProfileBySlug, ProfessorProfile } from '../../../../services/profileBuilderService';
import { Mail, Phone, MapPin, Linkedin, Github, GraduationCap, Fingerprint, BookOpen, Globe, Twitter, ExternalLink, FileText, Briefcase, Award, Image, Book } from 'lucide-react';
import { Loader2, AlertCircle } from 'lucide-react';
import { generateDesignStyles } from './designUtils';
import { getTranslatedSectionTitle } from './sectionTranslations';
import ProfileTemplate from './ProfileTemplate';

interface PublicProfileViewerProps {
  slug: string;
}

const PublicProfileViewer: React.FC<PublicProfileViewerProps> = ({ slug }) => {
  const [profile, setProfile] = useState<ProfessorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!slug) {
        setError('Profile slug is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const loadedProfile = await getPublishedProfileBySlug(slug);
        if (loadedProfile) {
          setProfile(loadedProfile);
          // Set initial active tab when profile loads
          if (loadedProfile.sections.length > 0) {
            setActiveTab(loadedProfile.sections[0].id);
          }
        } else {
          setError('Profile not found or not published');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={40} />
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Profile Not Found</h2>
              <p className="text-slate-600">{error || 'This profile does not exist or is not publicly available.'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  const getPlatformLabel = (platform: string) => {
    const platformMap: Record<string, string> = {
      'linkedin': 'LinkedIn',
      'github': 'GitHub',
      'google-scholar': 'Google Scholar',
      'orcid': 'ORCID',
      'researchgate': 'ResearchGate',
      'website': 'Website',
      'twitter': 'Twitter/X',
      'other': 'Other',
    };
    return platformMap[platform] || platform;
  };

  // Check if a template is selected
  const template = profile.design?.template || 'default';
  
  // If a template is selected (not default), use the template component
  if (template !== 'default') {
    return <ProfileTemplate profile={profile} />;
  }

  const generalInfo = profile.generalInfo || {};
  const designStyles = generateDesignStyles(profile.design);
  const direction = profile.design?.language?.direction || 'ltr';
  const language = profile.design?.language?.code || 'en';

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'profile':
        return <FileText size={20} className="text-indigo-600 flex-shrink-0" />;
      case 'education':
        return <GraduationCap size={20} className="text-indigo-600 flex-shrink-0" />;
      case 'experiences':
        return <Briefcase size={20} className="text-indigo-600 flex-shrink-0" />;
      case 'publications':
        return <BookOpen size={20} className="text-indigo-600 flex-shrink-0" />;
      case 'certifications':
        return <Award size={20} className="text-indigo-600 flex-shrink-0" />;
      case 'media':
        return <Image size={20} className="text-indigo-600 flex-shrink-0" />;
      case 'blog':
        return <Book size={20} className="text-indigo-600 flex-shrink-0" />;
      default:
        return <FileText size={20} className="text-indigo-600 flex-shrink-0" />;
    }
  };

  const renderSectionContent = (section: any) => {
    switch (section.type) {
      case 'profile':
        return (
          <div className="prose max-w-none">
            <p className="text-slate-700 whitespace-pre-line">{section.data.content || 'No content yet.'}</p>
          </div>
        );
      case 'education':
        return (
          <div className="space-y-4">
            {section.data.educations?.map((edu: any, index: number) => (
              <div key={index} className="border-l-2 border-indigo-500 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {edu.degree || 'Degree'} {edu.field && `in ${edu.field}`}
                    </h3>
                    <p className="text-slate-600">{edu.institution || 'Institution'}</p>
                  </div>
                  {(edu.startDate || edu.endDate) && (
                    <span className="text-sm text-slate-500 whitespace-nowrap" style={designStyles.dates}>
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
              <div key={index} className="border-l-2 border-indigo-500 pl-4 py-2">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="font-semibold text-slate-900">{exp.position || 'Position'}</h3>
                    <p className="text-slate-600">{exp.company || 'Company'}</p>
                  </div>
                  {(exp.startDate || exp.endDate) && (
                    <span className="text-sm text-slate-500 whitespace-nowrap" style={designStyles.dates}>
                      {exp.startDate} - {exp.endDate || 'Present'}
                    </span>
                  )}
                </div>
                {exp.description && (
                  <p className="text-slate-700 text-sm mt-2 whitespace-pre-line">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        );
      case 'publications':
        return (
          <div className="space-y-4">
            {section.data.publications?.map((pub: any, index: number) => (
              <div key={index} className="border-l-2 border-indigo-500 pl-4 py-2">
                <h3 className="font-semibold text-slate-900">{pub.title || 'Publication Title'}</h3>
                {pub.authors && <p className="text-slate-600 text-sm mt-1">{pub.authors}</p>}
                <p className="text-slate-600 text-sm">{pub.publisher || 'Publisher'}</p>
                {pub.date && <p className="text-sm text-slate-500 mt-1">{pub.date}</p>}
                {pub.description && (
                  <p className="text-slate-700 text-sm mt-2 whitespace-pre-line">{pub.description}</p>
                )}
                {pub.url && (
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline text-sm mt-2 inline-flex items-center gap-1"
                    style={designStyles.links}
                  >
                    View Publication <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        );
      case 'certifications':
        return (
          <div className="space-y-4">
            {section.data.certifications?.map((cert: any, index: number) => (
              <div key={index} className="border-l-2 border-indigo-500 pl-4 py-2">
                <h3 className="font-semibold text-slate-900">{cert.name || 'Certification'}</h3>
                <p className="text-slate-600">{cert.issuer || 'Issuer'}</p>
                {cert.date && <p className="text-sm text-slate-500 mt-1" style={designStyles.dates}>{cert.date}</p>}
                {cert.credentialId && (
                  <p className="text-sm text-slate-600 mt-1">ID: {cert.credentialId}</p>
                )}
                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline text-sm mt-2 inline-flex items-center gap-1"
                    style={designStyles.links}
                  >
                    View Credential <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        );
      case 'media':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.data.mediaItems?.map((item: any, index: number) => (
              <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
                {item.type === 'image' && item.url && (
                  <img
                    src={item.url}
                    alt={item.title || 'Media'}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-slate-900 text-sm">{item.title || 'Media Title'}</h3>
                  {item.description && (
                    <p className="text-slate-600 text-xs mt-1">{item.description}</p>
                  )}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline text-xs mt-2 inline-flex items-center gap-1"
                    >
                      View <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      case 'blog':
        return (
          <div className="space-y-4">
            {section.data.blogPosts?.map((post: any, index: number) => (
              <div key={index} className="border-l-2 border-indigo-500 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{post.title || 'Blog Post Title'}</h3>
                    {post.date && <p className="text-sm text-slate-500 mt-1" style={designStyles.dates}>{post.date}</p>}
                    {post.content && (
                      <p className="text-slate-700 text-sm mt-2 whitespace-pre-line line-clamp-3">
                        {post.content}
                      </p>
                    )}
                  </div>
                </div>
                {post.url && (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline text-sm mt-2 inline-flex items-center gap-1"
                    style={designStyles.links}
                  >
                    Read More <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        );
      default:
        return <p className="text-slate-500">No content available.</p>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" style={{ ...designStyles.background }} dir={direction}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Section: Image and General Info - Sticky */}
          <div className="sticky top-0 z-20 bg-white pb-4 pt-4 mb-8 border-b border-slate-200 shadow-sm">
            <div className="flex gap-6 pb-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt="Profile"
                  className="w-32 h-32 rounded-lg object-cover border-2 border-slate-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-lg bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                  <span className="text-slate-400 text-sm">No Image</span>
                </div>
              )}
            </div>

            {/* General Information */}
            <div className="flex-1">
              <div className="mb-3">
                <h1 className="text-2xl font-bold text-slate-900" style={designStyles.titles}>
                  {generalInfo.title && `${generalInfo.title} `}
                  {generalInfo.firstName || ''} {generalInfo.lastName || ''}
                </h1>
                {generalInfo.position && (
                  <p className="text-lg text-slate-600 mt-1" style={designStyles.subtitles}>{generalInfo.position}</p>
                )}
                {generalInfo.organization && (
                  <p className="text-slate-600 mt-1" style={designStyles.subtitles}>{generalInfo.organization}</p>
                )}
              </div>

              <div className="space-y-2 text-sm">
                {generalInfo.email && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="text-indigo-600 flex-shrink-0" size={16} />
                    <a href={`mailto:${generalInfo.email}`} className="hover:text-indigo-600">
                      {generalInfo.email}
                    </a>
                  </div>
                )}
                {generalInfo.phone && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="text-indigo-600 flex-shrink-0" size={16} />
                    <a href={`tel:${generalInfo.phone}`} className="hover:text-indigo-600">
                      {generalInfo.phone}
                    </a>
                  </div>
                )}
                {generalInfo.address && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="text-indigo-600 flex-shrink-0" size={16} />
                    <span>{generalInfo.address}</span>
                  </div>
                )}
              </div>

              {generalInfo.bio && (
                <p className="text-slate-700 text-sm mt-3 whitespace-pre-line">{generalInfo.bio}</p>
              )}

              {generalInfo.links && generalInfo.links.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {generalInfo.links.map((link: any, index: number) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm"
                    >
                      {getPlatformIcon(link.platform)}
                      <span>{getPlatformLabel(link.platform)}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Tabs Section */}
          {profile.sections.length > 0 && (() => {
            const tabsLayout = profile.design?.tabsLayout || {
              orientation: 'horizontal',
              display: 'per-section',
            };
            const isVertical = tabsLayout.orientation === 'vertical';
            const isFullDisplay = tabsLayout.display === 'full';

            if (isVertical) {
              // Vertical layout: tabs on the left
              return (
                <div className="flex gap-6">
                  {/* Tab Navigation - Left Side - Sticky */}
                  <div className="flex-shrink-0 w-48">
                    <div className={`sticky top-0 flex flex-col gap-1 border-r border-slate-200 pr-4 bg-white pt-4 pb-4 self-start ${direction === 'rtl' ? 'border-l border-r-0 pl-4 pr-0' : ''}`}>
                      {profile.sections
                        .sort((a, b) => a.order - b.order)
                        .map((section) => (
                          <button
                            key={section.id}
                            onClick={() => setActiveTab(section.id)}
                            className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors rounded-l-lg ${
                              direction === 'rtl' ? 'text-right rounded-r-lg rounded-l-none' : 'text-left'
                            } ${
                              activeTab === section.id
                                ? direction === 'rtl' ? 'border-r-2' : 'border-l-2'
                                : ''
                            }`}
                            dir={direction}
                            style={
                              activeTab === section.id
                                ? designStyles.tabs?.activeButton
                                : designStyles.tabs?.button
                            }
                            onMouseEnter={(e) => {
                              if (activeTab !== section.id && designStyles.tabs?.hoverButton) {
                                Object.assign(e.currentTarget.style, designStyles.tabs.hoverButton);
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (activeTab !== section.id && designStyles.tabs?.button) {
                                Object.assign(e.currentTarget.style, designStyles.tabs.button);
                              }
                            }}
                          >
                            {getTranslatedSectionTitle(section.type, section.title, language as 'en' | 'fr' | 'ar')}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Tab Content - Right Side */}
                  <div className="flex-1 min-h-[300px]">
                    {isFullDisplay ? (
                      // Full display: show all sections
                      <>
                        {profile.sections
                          .sort((a, b) => a.order - b.order)
                          .map((section) => (
                            <div
                              key={section.id}
                              style={designStyles.section ? designStyles.section(section.id) : {}}
                              className="p-4 rounded-lg mb-6"
                            >
                              <h2 className={`text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2 ${direction === 'rtl' ? 'flex-row-reverse justify-end text-right' : 'justify-start text-left'}`} dir={direction} style={designStyles.titles}>
                                {direction === 'ltr' && getSectionIcon(section.type)}
                                {getTranslatedSectionTitle(section.type, section.title, language as 'en' | 'fr' | 'ar')}
                                {direction === 'rtl' && getSectionIcon(section.type)}
                              </h2>
                              {renderSectionContent(section)}
                            </div>
                          ))}
                      </>
                    ) : (
                      // Per-section display: show only active section
                      activeTab && (
                        <>
                          {profile.sections
                            .sort((a, b) => a.order - b.order)
                            .filter((section) => section.id === activeTab)
                            .map((section) => (
                              <div
                                key={section.id}
                                style={designStyles.section ? designStyles.section(section.id) : {}}
                                className="p-4 rounded-lg"
                              >
                                <h2 className={`text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`} style={designStyles.titles}>
                                  {direction === 'ltr' && getSectionIcon(section.type)}
                                  {getTranslatedSectionTitle(section.type, section.title, language as 'en' | 'fr' | 'ar')}
                                  {direction === 'rtl' && getSectionIcon(section.type)}
                                </h2>
                                {renderSectionContent(section)}
                              </div>
                            ))}
                        </>
                      )
                    )}
                  </div>
                </div>
              );
            } else {
              // Horizontal layout: tabs at the top
              return (
                <div>
                  {/* Tab Navigation - Sticky */}
                  <div className="sticky top-0 z-20 bg-white pb-2 pt-4 mb-6 border-b border-slate-200 shadow-sm" dir={direction}>
                    <div className="flex gap-1">
                    {profile.sections
                      .sort((a, b) => a.order - b.order)
                      .map((section) => (
                        <button
                          key={section.id}
                          onClick={() => setActiveTab(section.id)}
                          className={`flex-1 px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors text-center rounded-t-lg ${
                            activeTab === section.id
                              ? 'border-b-2'
                              : ''
                          }`}
                          dir={direction}
                          style={
                            activeTab === section.id
                              ? designStyles.tabs?.activeButton
                              : designStyles.tabs?.button
                          }
                          onMouseEnter={(e) => {
                            if (activeTab !== section.id && designStyles.tabs?.hoverButton) {
                              Object.assign(e.currentTarget.style, designStyles.tabs.hoverButton);
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeTab !== section.id && designStyles.tabs?.button) {
                              Object.assign(e.currentTarget.style, designStyles.tabs.button);
                            }
                          }}
                        >
                          {getTranslatedSectionTitle(section.type, section.title, language as 'en' | 'fr' | 'ar')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="min-h-[300px]">
                    {isFullDisplay ? (
                      // Full display: show all sections
                      <>
                        {profile.sections
                          .sort((a, b) => a.order - b.order)
                          .map((section) => (
                            <div
                              key={section.id}
                              style={designStyles.section ? designStyles.section(section.id) : {}}
                              className="p-4 rounded-lg mb-6"
                            >
                              <h2 className={`text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2 ${direction === 'rtl' ? 'flex-row-reverse justify-end text-right' : 'justify-start text-left'}`} dir={direction} style={designStyles.titles}>
                                {direction === 'ltr' && getSectionIcon(section.type)}
                                {getTranslatedSectionTitle(section.type, section.title, language as 'en' | 'fr' | 'ar')}
                                {direction === 'rtl' && getSectionIcon(section.type)}
                              </h2>
                              {renderSectionContent(section)}
                            </div>
                          ))}
                      </>
                    ) : (
                      // Per-section display: show only active section
                      activeTab && (
                        <>
                          {profile.sections
                            .sort((a, b) => a.order - b.order)
                            .filter((section) => section.id === activeTab)
                            .map((section) => (
                              <div
                                key={section.id}
                                style={designStyles.section ? designStyles.section(section.id) : {}}
                                className="p-4 rounded-lg"
                              >
                                <h2 className={`text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`} style={designStyles.titles}>
                                  {direction === 'ltr' && getSectionIcon(section.type)}
                                  {getTranslatedSectionTitle(section.type, section.title, language as 'en' | 'fr' | 'ar')}
                                  {direction === 'rtl' && getSectionIcon(section.type)}
                                </h2>
                                {renderSectionContent(section)}
                              </div>
                            ))}
                        </>
                      )
                    )}
                  </div>
                </div>
              );
            }
          })()}
        </div>
      </div>
    </div>
  );
};

export default PublicProfileViewer;
