import React from 'react';
import { 
  Mail, Phone, MapPin, Globe, Link as LinkIcon, 
  User, Briefcase, UserCircle, Edit2, Trash2
} from 'lucide-react';
import { ParticipantProfile } from '../../../types';

interface ProfilePreviewProps {
  profile: ParticipantProfile;
  onEdit: () => void;
  onDelete: () => void;
}

const ProfilePreview: React.FC<ProfilePreviewProps> = ({ profile, onEdit, onDelete }) => {
  const {
    profilePicture, fullName, email, phone, address,
    title, position, organization, bio, website, websites, links,
    orcidId, googleScholar, researchGate, otherLinks,
    country, city, timezone
  } = profile;

  // Format ORCID ID for display (add dashes if not present)
  const formatOrcidForDisplay = (orcid: string): string => {
    if (!orcid) return '';
    // Remove all non-digit characters
    const digits = orcid.replace(/\D/g, '');
    // Format with dashes: 0000-0000-0000-0000
    if (digits.length <= 4) {
      return digits;
    } else if (digits.length <= 8) {
      return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    } else if (digits.length <= 12) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
    } else {
      return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}-${digits.slice(12)}`;
    }
  };

  const formattedOrcidId = orcidId ? formatOrcidForDisplay(orcidId) : '';

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <UserCircle className="text-indigo-600" size={32} />
            Participant Profile
          </h1>
          <p className="text-slate-500 mt-2">View and manage your participant profile information</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Edit2 size={16} />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {/* Profile Picture and Basic Info */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <User className="text-white" size={20} />
            </div>
            Personal Information
          </h2>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {profilePicture && (
              <div className="flex-shrink-0">
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              </div>
            )}
            <div className="flex-1 space-y-4">
              {fullName && (
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {title && <span className="text-slate-600 font-normal">{title} </span>}
                    {fullName}
                  </h3>
                </div>
              )}
              {position && (
                <p className="text-lg text-slate-700 font-medium">{position}</p>
              )}
              {organization && (
                <p className="text-slate-600">{organization}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Mail className="text-white" size={20} />
              </div>
              Contact Information
            </h2>
          </div>

          <div className="p-6 space-y-5">
            {email && (
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <Mail className="text-indigo-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Email</label>
                  <a href={`mailto:${email}`} className="text-slate-900 font-medium hover:text-indigo-600 transition-colors break-words">
                    {email}
                  </a>
                </div>
              </div>
            )}

            {phone && (
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <Phone className="text-indigo-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Phone Number</label>
                  <a href={`tel:${phone}`} className="text-slate-900 font-medium hover:text-indigo-600 transition-colors">
                    {phone}
                  </a>
                </div>
              </div>
            )}

            {address && (
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <MapPin className="text-indigo-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Address</label>
                  <p className="text-slate-900 font-medium break-words">{address}</p>
                </div>
              </div>
            )}

            {(country || city) && (
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <MapPin className="text-indigo-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Location</label>
                  <p className="text-slate-900 font-medium">
                    {city && country ? `${city}, ${country}` : city || country}
                  </p>
                </div>
              </div>
            )}

            {timezone && (
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <Globe className="text-indigo-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Timezone</label>
                  <p className="text-slate-900 font-medium">{timezone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Briefcase className="text-white" size={20} />
              </div>
              Professional Information
            </h2>
          </div>

          <div className="p-6 space-y-5">
            {position && (
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <Briefcase className="text-indigo-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Position</label>
                  <p className="text-slate-900 font-medium">{position}</p>
                </div>
              </div>
            )}

            {organization && (
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <Briefcase className="text-indigo-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Organization</label>
                  <p className="text-slate-900 font-medium">{organization}</p>
                </div>
              </div>
            )}

            {bio && (
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <User className="text-indigo-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Biography</label>
                  <p className="text-slate-900 font-medium break-words whitespace-pre-wrap">{bio}</p>
                </div>
              </div>
            )}

            {website && (
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <Globe className="text-indigo-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Website</label>
                  <a
                    href={website.startsWith('http') ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-900 font-medium hover:text-indigo-600 transition-colors break-words"
                  >
                    {website}
                  </a>
                </div>
              </div>
            )}

            {websites && websites.length > 0 && websites.map((site, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <Globe className="text-indigo-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Website {websites.length > 1 ? index + 1 : ''}</label>
                  <a
                    href={site.startsWith('http') ? site : `https://${site}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-900 font-medium hover:text-indigo-600 transition-colors break-words"
                  >
                    {site}
                  </a>
                </div>
              </div>
            ))}

            {links && links.length > 0 && (
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <LinkIcon className="text-indigo-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Links</label>
                  <div className="space-y-2">
                    {links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 text-indigo-600 hover:text-indigo-800 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm font-medium"
                      >
                        <LinkIcon size={14} />
                        {link.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Academic Identifiers */}
      {(formattedOrcidId || googleScholar || researchGate || (otherLinks && otherLinks.length > 0)) && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <LinkIcon className="text-white" size={20} />
              </div>
              Academic Identifiers
            </h2>
          </div>

          <div className="p-6 space-y-5">
            {formattedOrcidId && (
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <LinkIcon className="text-indigo-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">ORCID ID</label>
                  <a
                    href={`https://orcid.org/${orcidId.replace(/-/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-900 font-medium hover:text-indigo-600 transition-colors break-words"
                  >
                    {formattedOrcidId}
                  </a>
                </div>
              </div>
            )}

            {googleScholar && (
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <LinkIcon className="text-indigo-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Google Scholar</label>
                  <a
                    href={googleScholar.startsWith('http') ? googleScholar : `https://${googleScholar}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-900 font-medium hover:text-indigo-600 transition-colors break-words"
                  >
                    {googleScholar}
                  </a>
                </div>
              </div>
            )}

            {researchGate && (
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <LinkIcon className="text-indigo-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">ResearchGate</label>
                  <a
                    href={researchGate.startsWith('http') ? researchGate : `https://${researchGate}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-900 font-medium hover:text-indigo-600 transition-colors break-words"
                  >
                    {researchGate}
                  </a>
                </div>
              </div>
            )}

            {otherLinks && otherLinks.length > 0 && (
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <LinkIcon className="text-indigo-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Other Academic Links</label>
                  <div className="space-y-2">
                    {otherLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.startsWith('http') ? link : `https://${link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 text-indigo-600 hover:text-indigo-800 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm font-medium"
                      >
                        <LinkIcon size={14} />
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePreview;
