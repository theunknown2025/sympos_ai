import React, { useState } from 'react';
import { 
  Edit2, Trash2, Building, Mail, Phone, MapPin, Globe, 
  Link as LinkIcon, User, Calendar, Target, Eye, GraduationCap,
  Briefcase, Globe as GlobeIcon, Copy, Check, Loader2, Users, FileText
} from 'lucide-react';
import { OrganizerProfile } from '../../../types';
import { publishOrganizerProfile, unpublishOrganizerProfile, getOrganizerProfileById } from '../../../services/organizerProfileService';
import CommitteeDisplayer from './CommitteeDisplayer';
import EventDisplayer from './EventDisplayer';
import BlogArticlesDisplayer from './BlogArticlesDisplayer';

interface EntityProfilePreviewProps {
  profile: OrganizerProfile;
  onEdit: () => void;
  onDelete: () => void;
  onProfileUpdate?: (profile: OrganizerProfile) => void;
}

const EntityProfilePreview: React.FC<EntityProfilePreviewProps> = ({ profile, onEdit, onDelete, onProfileUpdate }) => {
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const {
    entityLogo, entityBanner, entityName, entityCreationDate, entityLegalStatus,
    entityCountry, entityCity, entityOfficialWebsite, entityEmail, entityPhone,
    entityAddress, entityWebsites, entityLinks, entityMission, entityVision,
    entityScientificDomains, representativePhoto, representativeFullName,
    representativeEmail, representativePhone, representativeFunction,
    isPublished, publishedUrl, publicSlug, showCommittees, showEvents, showBlogArticles, userId
  } = profile;

  const handlePublish = async () => {
    try {
      setPublishing(true);
      if (isPublished) {
        await unpublishOrganizerProfile(profile.id);
        if (onProfileUpdate) {
          onProfileUpdate({ ...profile, isPublished: false, publicSlug: undefined, publishedUrl: undefined });
        }
      } else {
        const url = await publishOrganizerProfile(profile.id);
        if (onProfileUpdate) {
          const updatedProfile = await getOrganizerProfileById(profile.id);
          if (updatedProfile) {
            onProfileUpdate(updatedProfile);
          }
        }
      }
    } catch (error: any) {
      console.error('Error publishing/unpublishing profile:', error);
      alert(error.message || 'Failed to publish/unpublish profile');
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyUrl = async () => {
    if (publishedUrl) {
      try {
        await navigator.clipboard.writeText(publishedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
    }
  };

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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Building className="text-indigo-600" size={32} />
            Profile Folder
          </h1>
          <p className="text-slate-500 mt-2">Entity profile information</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Publish/Unpublish Button */}
          <button
            onClick={handlePublish}
            disabled={publishing}
            className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
              isPublished
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            } disabled:opacity-50`}
            title={isPublished ? 'Unpublish Profile' : 'Publish Profile'}
          >
            {publishing ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <GlobeIcon size={20} />
            )}
          </button>
          
          {/* Edit Button */}
          <button
            onClick={onEdit}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
            title="Edit Profile"
          >
            <Edit2 size={20} />
          </button>
          
          {/* Delete Button */}
          <button
            onClick={onDelete}
            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
            title="Delete Profile"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Published URL Display */}
      {isPublished && publishedUrl && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 mb-1">Profile Published</p>
              <div className="flex items-center gap-2">
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-700 hover:text-green-800 text-sm break-all"
                >
                  {publishedUrl}
                </a>
              </div>
            </div>
            <button
              onClick={handleCopyUrl}
              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center"
              title="Copy URL"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>
      )}

      {/* Banner */}
      {entityBanner && (
        <div className="relative w-full h-64 rounded-lg overflow-hidden bg-slate-200">
          <img 
            src={entityBanner} 
            alt="Entity banner" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Entity Information Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-start gap-6">
              {/* Logo */}
              {entityLogo && (
            <div className="flex-shrink-0">
              <div className="w-32 h-32 border border-slate-300 rounded-lg overflow-hidden bg-white p-2">
                <img 
                  src={entityLogo} 
                  alt="Entity logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

            {/* Entity Details */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{entityName || 'Unnamed Entity'}</h2>
              
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
        </div>

          {/* Additional Websites */}
          {entityWebsites && entityWebsites.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
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
            <div className="bg-white rounded-lg border border-slate-200 p-6">
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
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Target size={20} />
                Mission
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{entityMission}</p>
            </div>
          )}

          {/* Vision */}
          {entityVision && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Eye size={20} />
                Vision
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{entityVision}</p>
            </div>
          )}

          {/* Scientific Domains */}
          {entityScientificDomains && entityScientificDomains.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
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

          {/* Representative Information Card */}
          {(representativeFullName || representativeEmail || representativePhone || representativeFunction || representativePhoto) && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User size={24} />
                Representative
              </h2>

              <div className="flex items-start gap-6">
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
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users size={20} />
                Committees
              </h2>
              <CommitteeDisplayer userId={userId} />
            </div>
          )}

          {/* Events Section */}
          {showEvents && userId && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar size={20} />
                Events
              </h2>
              <EventDisplayer userId={userId} />
            </div>
          )}

          {/* Blog Articles Section */}
          {showBlogArticles && userId && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
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
  );
};

export default EntityProfilePreview;
