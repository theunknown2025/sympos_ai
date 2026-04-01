import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Building, Mail, Phone, MapPin, Globe, 
  Link as LinkIcon, User, Calendar, Target, Eye, GraduationCap, Briefcase, Users, FileText } from 'lucide-react';
import { getPublishedOrganizerProfile } from '../../../services/organizerProfileService';
import { OrganizerProfile } from '../../../types';
import CommitteeDisplayer from './CommitteeDisplayer';
import EventDisplayer from './EventDisplayer';
import BlogArticlesDisplayer from './BlogArticlesDisplayer';

interface PublicEntityProfileViewerProps {
  slug: string;
}

const PublicEntityProfileViewer: React.FC<PublicEntityProfileViewerProps> = ({ slug }) => {
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const profileData = await getPublishedOrganizerProfile(slug);
        if (profileData) {
          setProfile(profileData);
        } else {
          setError('Profile not found or not published');
        }
      } catch (err: any) {
        console.error('Error loading published profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadProfile();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 font-medium">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="text-red-500" size={48} />
        <h1 className="text-2xl font-bold text-slate-900">Profile Not Found</h1>
        <p className="text-slate-600 text-center max-w-md">
          {error || 'The profile you are looking for does not exist or is not published.'}
        </p>
      </div>
    );
  }

  const {
    entityLogo, entityBanner, entityName, entityCreationDate, entityLegalStatus,
    entityCountry, entityCity, entityOfficialWebsite, entityEmail, entityPhone,
    entityAddress, entityWebsites, entityLinks, entityMission, entityVision,
    entityScientificDomains, representativePhoto, representativeFullName,
    representativeEmail, representativePhone, representativeFunction,
    showCommittees, showEvents, showBlogArticles, userId
  } = profile;

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getLegalStatusLabel = (status?: string): string => {
    const labels: Record<string, string> = {
      'publique': 'Publique',
      'privée': 'Privée',
      'fondation': 'Fondation',
      'consortium académique': 'Consortium académique'
    };
    return status ? (labels[status] || status) : '';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Banner */}
      {entityBanner && (
        <div className="relative w-full h-64 md:h-96 bg-slate-200">
          <img 
            src={entityBanner} 
            alt="Entity banner" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Entity Information Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
            {/* Logo */}
            {entityLogo && (
              <div className="flex-shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 border border-slate-300 rounded-lg overflow-hidden bg-white p-2">
                  <img 
                    src={entityLogo} 
                    alt="Entity logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Entity Details */}
            <div className="flex-1 w-full">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">{entityName || 'Unnamed Entity'}</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entityCreationDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="text-slate-400 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-slate-500">Date de création</p>
                      <p className="text-slate-900 font-medium">{formatDate(entityCreationDate)}</p>
                    </div>
                  </div>
                )}

                {entityLegalStatus && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="text-slate-400 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-slate-500">Statut juridique</p>
                      <p className="text-slate-900 font-medium">{getLegalStatusLabel(entityLegalStatus)}</p>
                    </div>
                  </div>
                )}

                {(entityCountry || entityCity) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="text-slate-400 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-slate-500">Location</p>
                      <p className="text-slate-900 font-medium">
                        {[entityCity, entityCountry].filter(Boolean).join(', ') || 'Not specified'}
                      </p>
                    </div>
                  </div>
                )}

                {entityOfficialWebsite && (
                  <div className="flex items-start gap-3">
                    <Globe className="text-slate-400 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-slate-500">Site web officiel</p>
                      <a 
                        href={entityOfficialWebsite} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 font-medium break-all"
                      >
                        {entityOfficialWebsite}
                      </a>
                    </div>
                  </div>
                )}

                {entityEmail && (
                  <div className="flex items-start gap-3">
                    <Mail className="text-slate-400 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-slate-500">Email institutionnel</p>
                      <a 
                        href={`mailto:${entityEmail}`}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        {entityEmail}
                      </a>
                    </div>
                  </div>
                )}

                {entityPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="text-slate-400 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-slate-500">Téléphone</p>
                      <a 
                        href={`tel:${entityPhone}`}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        {entityPhone}
                      </a>
                    </div>
                  </div>
                )}

                {entityAddress && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <MapPin className="text-slate-400 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-slate-500">Adresse</p>
                      <p className="text-slate-900 font-medium">{entityAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Websites */}
          {entityWebsites && entityWebsites.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Globe size={20} />
                Autres sites web
              </h3>
              <div className="flex flex-wrap gap-2">
                {entityWebsites.map((website, index) => (
                  <a
                    key={index}
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Globe size={14} />
                    {website}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Other Links */}
          {entityLinks && entityLinks.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <LinkIcon size={20} />
                Autres liens
              </h3>
              <div className="flex flex-wrap gap-2">
                {entityLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <LinkIcon size={14} />
                    {link.name || link.url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Mission */}
          {entityMission && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Target size={20} />
                Mission
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{entityMission}</p>
            </div>
          )}

          {/* Vision */}
          {entityVision && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Eye size={20} />
                Vision
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{entityVision}</p>
            </div>
          )}

          {/* Scientific Domains */}
          {entityScientificDomains && entityScientificDomains.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <GraduationCap size={20} />
                Domaines scientifiques
              </h3>
              <div className="flex flex-wrap gap-2">
                {entityScientificDomains.map((domain, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-4 py-2 bg-violet-50 text-violet-700 rounded-lg font-medium"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          )}
            </div>

          {/* Representative Information Card */}
          {(representativeFullName || representativeEmail || representativePhone || representativeFunction || representativePhoto) && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 md:p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User size={24} />
                Representative
              </h2>

              <div className="flex flex-col md:flex-row items-start gap-6">
                {/* Representative Photo */}
                {representativePhoto && (
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                      <img 
                        src={representativePhoto} 
                        alt="Representative" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Representative Details */}
                <div className="flex-1">
                  {representativeFullName && (
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">{representativeFullName}</h3>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {representativeFunction && (
                      <div className="flex items-start gap-3">
                        <Briefcase className="text-slate-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-slate-500">Function</p>
                          <p className="text-slate-900 font-medium">{representativeFunction}</p>
                        </div>
                      </div>
                    )}

                    {representativeEmail && (
                      <div className="flex items-start gap-3">
                        <Mail className="text-slate-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-slate-500">Email</p>
                          <a 
                            href={`mailto:${representativeEmail}`}
                            className="text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            {representativeEmail}
                          </a>
                        </div>
                      </div>
                    )}

                    {representativePhone && (
                      <div className="flex items-start gap-3">
                        <Phone className="text-slate-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-slate-500">Phone Number</p>
                          <a 
                            href={`tel:${representativePhone}`}
                            className="text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            {representativePhone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="lg:col-span-1 space-y-6">
            {/* Committees Section */}
            {showCommittees && userId && (
              <div className="bg-white rounded-lg border border-slate-200 p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Users size={20} />
                  Committees
                </h2>
                <CommitteeDisplayer userId={userId} />
              </div>
            )}

            {/* Events Section */}
            {showEvents && userId && (
              <div className="bg-white rounded-lg border border-slate-200 p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar size={20} />
                  Events
                </h2>
                <EventDisplayer userId={userId} />
              </div>
            )}

            {/* Blog Articles Section */}
            {showBlogArticles && userId && (
              <div className="bg-white rounded-lg border border-slate-200 p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText size={20} />
                  Blog Articles
                </h2>
                <BlogArticlesDisplayer userId={userId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicEntityProfileViewer;
