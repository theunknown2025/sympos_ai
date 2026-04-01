import React from 'react';
import { ProfessorProfile } from '../../../../../services/profileBuilderService';
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  GraduationCap,
  Fingerprint,
  BookOpen,
  Globe,
  Twitter,
  FileText,
  Briefcase,
  Award,
  Image,
  Book,
  ExternalLink,
} from 'lucide-react';
import { generateDesignStyles } from '../designUtils';
import { getTranslatedSectionTitle } from '../sectionTranslations';

/** Traditional CV-style layout: cream paper, navy & burgundy accents, serif headings, ruled sections. */
interface AdvancedTemplate2Props {
  profile: ProfessorProfile;
}

const ACCENT = '#722f37';
const NAVY = '#1e3a5f';

const AdvancedTemplate2: React.FC<AdvancedTemplate2Props> = ({ profile }) => {
  const generalInfo = profile.generalInfo || {};
  const designStyles = generateDesignStyles(profile.design);
  const direction = profile.design?.language?.direction || 'ltr';
  const language = profile.design?.language?.code || 'en';

  const getSectionIcon = (type: string) => {
    const iconClass = 'text-[#722f37] shrink-0';
    switch (type) {
      case 'profile':
        return <FileText size={18} className={iconClass} />;
      case 'education':
        return <GraduationCap size={18} className={iconClass} />;
      case 'experiences':
        return <Briefcase size={18} className={iconClass} />;
      case 'publications':
        return <BookOpen size={18} className={iconClass} />;
      case 'certifications':
        return <Award size={18} className={iconClass} />;
      case 'media':
        return <Image size={18} className={iconClass} />;
      case 'blog':
        return <Book size={18} className={iconClass} />;
      default:
        return <FileText size={18} className={iconClass} />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return <Linkedin size={16} />;
      case 'github':
        return <Github size={16} />;
      case 'google-scholar':
        return <GraduationCap size={16} />;
      case 'orcid':
        return <Fingerprint size={16} />;
      case 'researchgate':
        return <BookOpen size={16} />;
      case 'twitter':
        return <Twitter size={16} />;
      case 'website':
      case 'other':
      default:
        return <Globe size={16} />;
    }
  };

  const renderSectionContent = (section: { type: string; data: Record<string, unknown> }) => {
    switch (section.type) {
      case 'profile':
        return (
          <div className="prose max-w-none font-serif text-stone-800 leading-relaxed">
            <p className="whitespace-pre-line text-[15px]">{String(section.data.content || 'No content yet.')}</p>
          </div>
        );
      case 'education':
        return (
          <div className="space-y-0 divide-y divide-stone-200 border border-stone-300 bg-white">
            {(section.data.educations as Array<Record<string, string>> | undefined)?.map((edu, index) => (
              <div key={index} className="px-4 py-3 sm:px-5 sm:py-4">
                <div className={`flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between ${direction === 'rtl' ? 'sm:flex-row-reverse' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-lg font-semibold text-stone-900">
                      {edu.degree || 'Degree'}
                      {edu.field ? ` in ${edu.field}` : ''}
                    </h3>
                    <p className="mt-0.5 text-sm font-medium" style={{ color: NAVY }}>
                      {edu.institution || 'Institution'}
                    </p>
                  </div>
                  {(edu.startDate || edu.endDate) && (
                    <span
                      className="shrink-0 font-mono text-xs uppercase tracking-wider text-stone-500"
                      style={designStyles.dates}
                    >
                      {edu.startDate} — {edu.endDate || 'Present'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      case 'experiences':
        return (
          <div className="space-y-0 divide-y divide-stone-200 border border-stone-300 bg-white">
            {(section.data.experiences as Array<Record<string, string>> | undefined)?.map((exp, index) => (
              <div key={index} className="px-4 py-3 sm:px-5 sm:py-4">
                <div className={`flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between ${direction === 'rtl' ? 'sm:flex-row-reverse' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-lg font-semibold text-stone-900">{exp.position || 'Position'}</h3>
                    <p className="mt-0.5 text-sm font-medium" style={{ color: NAVY }}>
                      {exp.company || 'Company'}
                    </p>
                    {exp.description && <p className="mt-2 text-sm leading-relaxed text-stone-600">{exp.description}</p>}
                  </div>
                  {(exp.startDate || exp.endDate) && (
                    <span
                      className="shrink-0 font-mono text-xs uppercase tracking-wider text-stone-500"
                      style={designStyles.dates}
                    >
                      {exp.startDate} — {exp.endDate || 'Present'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      case 'publications':
        return (
          <div className="space-y-0 divide-y divide-stone-200 border border-stone-300 bg-white">
            {(section.data.publications as Array<Record<string, string>> | undefined)?.map((pub, index) => (
              <div
                key={index}
                className={`px-4 py-3 sm:px-5 sm:py-4 ${direction === 'rtl' ? 'border-r-[3px]' : 'border-l-[3px]'}`}
                style={direction === 'rtl' ? { borderRightColor: ACCENT } : { borderLeftColor: ACCENT }}
              >
                <h3 className="font-serif text-lg font-semibold text-stone-900">{pub.title || 'Publication Title'}</h3>
                {pub.authors && <p className="mt-1 text-sm italic text-stone-600">{pub.authors}</p>}
                <div className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  {pub.publisher && <span>{pub.publisher}</span>}
                  {pub.date && (
                    <span style={designStyles.dates}>{pub.date}</span>
                  )}
                </div>
                {pub.url && (
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline decoration-stone-400 underline-offset-4 hover:decoration-[#722f37]"
                    style={designStyles.links}
                  >
                    <ExternalLink size={14} />
                    View publication
                  </a>
                )}
                {pub.description && <p className="mt-2 text-sm leading-relaxed text-stone-600">{pub.description}</p>}
              </div>
            ))}
          </div>
        );
      case 'certifications':
        return (
          <div className="space-y-0 divide-y divide-stone-200 border border-stone-300 bg-white">
            {(section.data.certifications as Array<Record<string, string>> | undefined)?.map((cert, index) => (
              <div key={index} className="px-4 py-3 sm:px-5 sm:py-4">
                <h3 className="font-serif text-lg font-semibold text-stone-900">{cert.name || 'Certification Name'}</h3>
                <p className="mt-0.5 text-sm font-medium" style={{ color: NAVY }}>
                  {cert.issuer || 'Issuer'}
                </p>
                <div className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  {cert.date && <span style={designStyles.dates}>{cert.date}</span>}
                  {cert.credentialId && <span>ID: {cert.credentialId}</span>}
                </div>
                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline decoration-stone-400 underline-offset-4 hover:decoration-[#722f37]"
                    style={designStyles.links}
                  >
                    <ExternalLink size={14} />
                    Verify credential
                  </a>
                )}
              </div>
            ))}
          </div>
        );
      case 'media':
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(section.data.mediaItems as Array<Record<string, string>> | undefined)?.map((item, index) => (
              <div key={index} className="border border-stone-300 bg-white shadow-sm">
                {item.type === 'image' && item.url && (
                  <img src={item.url} alt={item.title || 'Media'} className="h-44 w-full object-cover" />
                )}
                <div className="border-t border-stone-200 p-3">
                  {item.title && <h3 className="font-serif font-semibold text-stone-900">{item.title}</h3>}
                  {item.description && <p className="mt-1 text-sm text-stone-600">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        );
      case 'blog':
        return (
          <div className="space-y-0 divide-y divide-stone-200 border border-stone-300 bg-white">
            {(section.data.blogPosts as Array<Record<string, string>> | undefined)?.map((post, index) => (
              <div key={index} className="px-4 py-3 sm:px-5 sm:py-4">
                <h3 className="font-serif text-lg font-semibold text-stone-900">{post.title || 'Blog Post Title'}</h3>
                {post.date && (
                  <p className="mt-1 font-mono text-xs uppercase tracking-wider text-stone-500" style={designStyles.dates}>
                    {post.date}
                  </p>
                )}
                {post.content && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600">{post.content}</p>}
                {post.url && (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline decoration-stone-400 underline-offset-4 hover:decoration-[#722f37]"
                    style={designStyles.links}
                  >
                    <ExternalLink size={14} />
                    Read more
                  </a>
                )}
              </div>
            ))}
          </div>
        );
      default:
        return <div className="text-sm text-stone-600">No content available</div>;
    }
  };

  const mainFlexDir = direction === 'rtl' ? 'lg:flex-row-reverse' : 'lg:flex-row';

  return (
    <div
      className="min-h-screen bg-[#f4f1ea] text-stone-900"
      style={designStyles.background}
      dir={direction}
    >
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* Document frame */}
        <div className="border border-double border-stone-400 bg-[#fffefb] shadow-[0_2px_24px_rgba(30,58,95,0.08)]">
          {/* Letterhead */}
          <header className="border-b-4 border-[#1e3a5f] px-6 pb-8 pt-10 sm:px-10 sm:pt-12">
            <div className={`flex flex-col items-center gap-6 ${mainFlexDir} lg:items-start lg:gap-10`}>
              <div className="shrink-0">
                {profile.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt=""
                    className="h-40 w-32 border border-stone-400 object-cover shadow-sm sm:h-44 sm:w-36"
                  />
                ) : (
                  <div className="flex h-40 w-32 items-center justify-center border border-dashed border-stone-400 bg-stone-100 text-center text-xs text-stone-500 sm:h-44 sm:w-36">
                    Photo
                  </div>
                )}
              </div>
              <div
                className={`min-w-0 flex-1 text-center ${direction === 'rtl' ? 'lg:text-right' : 'lg:text-left'}`}
              >
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#722f37]">Curriculum profile</p>
                <h1
                  className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#1e3a5f] sm:text-4xl"
                  style={designStyles.titles}
                >
                  {generalInfo.title && `${generalInfo.title} `}
                  {generalInfo.firstName || ''} {generalInfo.lastName || ''}
                </h1>
                <div className="mx-auto mt-4 h-px max-w-xs bg-gradient-to-r from-transparent via-amber-700/50 to-transparent lg:mx-0" />
                {generalInfo.position && (
                  <p className="mt-4 font-serif text-lg text-stone-700" style={designStyles.subtitles}>
                    {generalInfo.position}
                  </p>
                )}
                {generalInfo.organization && (
                  <p className="mt-1 text-sm font-medium text-stone-600" style={designStyles.subtitles}>
                    {generalInfo.organization}
                  </p>
                )}
              </div>
            </div>

            <div
              className={`mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 border-t border-stone-300 pt-6 text-sm text-stone-700 ${
                direction === 'rtl' ? 'lg:justify-end' : 'lg:justify-start'
              }`}
            >
              {generalInfo.email && (
                <a
                  href={`mailto:${generalInfo.email}`}
                  className="inline-flex items-center gap-2 hover:text-[#722f37]"
                  style={designStyles.links}
                >
                  <Mail size={16} className="text-[#1e3a5f]" />
                  {generalInfo.email}
                </a>
              )}
              {generalInfo.phone && (
                <a href={`tel:${generalInfo.phone}`} className="inline-flex items-center gap-2 hover:text-[#722f37]" style={designStyles.links}>
                  <Phone size={16} className="text-[#1e3a5f]" />
                  {generalInfo.phone}
                </a>
              )}
              {generalInfo.address && (
                <span className="inline-flex items-center gap-2">
                  <MapPin size={16} className="text-[#1e3a5f]" />
                  {generalInfo.address}
                </span>
              )}
            </div>

            {generalInfo.links && generalInfo.links.length > 0 && (
              <div
                className={`mt-4 flex flex-wrap justify-center gap-3 ${
                  direction === 'rtl' ? 'lg:justify-end' : 'lg:justify-start'
                }`}
              >
                {generalInfo.links.map((link: { url: string; platform: string }, index: number) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 border border-stone-300 bg-[#faf7f2] px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-stone-700 hover:border-[#722f37]/40 hover:text-[#722f37]"
                    style={designStyles.links}
                  >
                    {getPlatformIcon(link.platform)}
                    {link.platform}
                  </a>
                ))}
              </div>
            )}

            {generalInfo.bio && (
              <div className="mt-8 border-t border-stone-300 pt-6">
                <p
                  className={`mx-auto max-w-3xl text-center font-serif text-[15px] leading-relaxed text-stone-700 lg:mx-0 ${
                    direction === 'rtl' ? 'lg:text-end' : 'lg:text-start'
                  }`}
                >
                  {generalInfo.bio}
                </p>
              </div>
            )}

            {profile.sections.length > 0 && (
              <nav className="mt-8 border-t border-stone-300 pt-6" aria-label="Sections">
                <p
                  className={`mb-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 ${
                    direction === 'rtl' ? 'lg:text-end' : 'lg:text-start'
                  }`}
                >
                  On this page
                </p>
                <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                  {profile.sections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <a
                        key={section.id}
                        href={`#section-${section.id}`}
                        className="inline-flex items-center gap-2 border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-700 hover:border-[#1e3a5f] hover:text-[#1e3a5f]"
                        style={designStyles.links}
                      >
                        {getSectionIcon(section.type)}
                        {getTranslatedSectionTitle(section.type, section.title, language as 'en' | 'fr' | 'ar')}
                      </a>
                    ))}
                </div>
              </nav>
            )}
          </header>

          {/* Body */}
          <div className="space-y-0 divide-y divide-stone-200 px-6 py-8 sm:px-10 sm:py-10">
            {profile.sections
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <section
                  key={section.id}
                  id={`section-${section.id}`}
                  className="scroll-mt-10 pt-8 first:pt-0"
                  style={designStyles.section ? designStyles.section(section.id) : undefined}
                >
                  <h2
                    className={`mb-5 flex items-center gap-3 border-b border-stone-300 pb-2 font-serif text-xl font-bold uppercase tracking-[0.12em] text-[#1e3a5f] sm:text-2xl ${
                      direction === 'rtl' ? 'flex-row-reverse justify-end text-right' : 'text-left'
                    }`}
                    dir={direction}
                    style={designStyles.titles}
                  >
                    {direction === 'ltr' && getSectionIcon(section.type)}
                    <span className="normal-case tracking-normal">
                      {getTranslatedSectionTitle(section.type, section.title, language as 'en' | 'fr' | 'ar')}
                    </span>
                    {direction === 'rtl' && getSectionIcon(section.type)}
                  </h2>
                  {renderSectionContent(section)}
                </section>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTemplate2;
