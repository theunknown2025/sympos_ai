import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Edit2, Trash2, X, Plus, Loader2, 
  Building, Mail, Phone, MapPin, Globe, Link as LinkIcon, 
  User, Briefcase, Image as ImageIcon, FileImage, UserCircle
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { 
  getParticipantProfile, 
  saveParticipantProfile, 
  deleteParticipantProfile 
} from '../../../services/participantProfileService';
import { uploadImageToStorage } from '../../../services/storageService';
import { ParticipantProfile, ParticipantProfileLink } from '../../../types';
import ProfilePreview from './ProfilePreview';

const Profile: React.FC = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<ParticipantProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  

  // Personal Information
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Professional Information
  const [title, setTitle] = useState('');
  const [position, setPosition] = useState('');
  const [organization, setOrganization] = useState('');
  const [bio, setBio] = useState('');

  // Contact & Links
  const [website, setWebsite] = useState('');
  const [websites, setWebsites] = useState<string[]>([]);
  const [websiteInput, setWebsiteInput] = useState('');
  const [links, setLinks] = useState<ParticipantProfileLink[]>([]);

  // Academic Identifiers
  const [orcidId, setOrcidId] = useState('');
  const [googleScholar, setGoogleScholar] = useState('');
  const [researchGate, setResearchGate] = useState('');
  const [otherLinks, setOtherLinks] = useState<string[]>([]);
  const [otherLinkInput, setOtherLinkInput] = useState('');

  // Additional Information
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [timezone, setTimezone] = useState('');

  const pictureInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      loadProfile();
    }
  }, [currentUser]);

  // Ensure that if profile exists, we show preview mode (not edit mode)
  // This prevents showing edit mode when navigating back to the profile page
  useEffect(() => {
    if (profile && !loading && !saving) {
      // If profile exists and we're not loading or saving, ensure we show preview
      setIsEditing(false);
    }
  }, [profile, loading, saving]);

  const loadProfile = async (silent = false): Promise<ParticipantProfile | null> => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError('');
      if (!currentUser?.id) return null;

      const profileData = await getParticipantProfile(currentUser.id);
      if (profileData) {
        setProfile(profileData);
        setProfilePicture(profileData.profilePicture || '');
        setProfilePicturePreview(profileData.profilePicture || '');
        setFullName(profileData.fullName || '');
        setEmail(profileData.email || currentUser.email || '');
        setPhone(profileData.phone || '');
        setAddress(profileData.address || '');
        setTitle(profileData.title || '');
        setPosition(profileData.position || '');
        setOrganization(profileData.organization || '');
        setBio(profileData.bio || '');
        setWebsite(profileData.website || '');
        setWebsites(profileData.websites || []);
        setLinks(profileData.links || []);
        // Format ORCID ID if it exists (in case it's stored without dashes)
        const orcidValue = profileData.orcidId || '';
        setOrcidId(orcidValue ? formatOrcidId(orcidValue) : '');
        setGoogleScholar(profileData.googleScholar || '');
        setResearchGate(profileData.researchGate || '');
        setOtherLinks(profileData.otherLinks || []);
        setCountry(profileData.country || '');
        setCity(profileData.city || '');
        setTimezone(profileData.timezone || '');
        // If profile exists, ensure we're not in edit mode
        setIsEditing(false);
        return profileData;
      } else {
        // No profile exists yet - set email from current user
        setEmail(currentUser.email || '');
        setProfile(null);
        return null;
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
      return null;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePicturePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddWebsite = () => {
    if (websiteInput.trim() && !websites.includes(websiteInput.trim())) {
      setWebsites([...websites, websiteInput.trim()]);
      setWebsiteInput('');
    }
  };

  const handleRemoveWebsite = (website: string) => {
    setWebsites(websites.filter(w => w !== website));
  };

  const handleAddLink = () => {
    const newLink: ParticipantProfileLink = {
      id: `link-${Date.now()}`,
      name: '',
      url: '',
    };
    setLinks([...links, newLink]);
  };

  const handleUpdateLink = (linkId: string, field: 'name' | 'url', value: string) => {
    setLinks(links.map(l => l.id === linkId ? { ...l, [field]: value } : l));
  };

  const handleRemoveLink = (linkId: string) => {
    setLinks(links.filter(l => l.id !== linkId));
  };

  const handleAddOtherLink = () => {
    if (otherLinkInput.trim() && !otherLinks.includes(otherLinkInput.trim())) {
      setOtherLinks([...otherLinks, otherLinkInput.trim()]);
      setOtherLinkInput('');
    }
  };

  const handleRemoveOtherLink = (link: string) => {
    setOtherLinks(otherLinks.filter(l => l !== link));
  };

  const formatOrcidId = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Limit to 16 digits
    const limited = digits.slice(0, 16);
    
    // Format with dashes: 0000-0000-0000-0000
    if (limited.length <= 4) {
      return limited;
    } else if (limited.length <= 8) {
      return `${limited.slice(0, 4)}-${limited.slice(4)}`;
    } else if (limited.length <= 12) {
      return `${limited.slice(0, 4)}-${limited.slice(4, 8)}-${limited.slice(8)}`;
    } else {
      return `${limited.slice(0, 4)}-${limited.slice(4, 8)}-${limited.slice(8, 12)}-${limited.slice(12)}`;
    }
  };

  const handleOrcidIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatOrcidId(e.target.value);
    setOrcidId(formatted);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      if (!currentUser?.id) {
        setError('User not authenticated');
        return;
      }

      let pictureUrl = profilePicture;

      // Upload profile picture if new file selected
      if (profilePictureFile) {
        pictureUrl = await uploadImageToStorage(currentUser.id, profilePictureFile, 'participant-profiles');
        setProfilePicture(pictureUrl);
        setProfilePicturePreview(pictureUrl);
        setProfilePictureFile(null); // Clear the file after upload
      }

      const savedProfileId = await saveParticipantProfile(currentUser.id, {
        profilePicture: pictureUrl || undefined,
        fullName: fullName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        title: title.trim() || undefined,
        position: position.trim() || undefined,
        organization: organization.trim() || undefined,
        bio: bio.trim() || undefined,
        website: website.trim() || undefined,
        websites: websites.length > 0 ? websites : undefined,
        links: links.length > 0 ? links.filter(l => l.name && l.url) : undefined,
        // Remove dashes from ORCID ID before saving (store as digits only)
        orcidId: orcidId.trim().replace(/-/g, '') || undefined,
        googleScholar: googleScholar.trim() || undefined,
        researchGate: researchGate.trim() || undefined,
        otherLinks: otherLinks.length > 0 ? otherLinks : undefined,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        timezone: timezone.trim() || undefined,
      });

      // Update profile state optimistically with saved data
      const updatedProfile: ParticipantProfile = {
        id: savedProfileId,
        userId: currentUser.id,
        profilePicture: pictureUrl || undefined,
        fullName: fullName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        title: title.trim() || undefined,
        position: position.trim() || undefined,
        organization: organization.trim() || undefined,
        bio: bio.trim() || undefined,
        website: website.trim() || undefined,
        websites: websites.length > 0 ? websites : undefined,
        links: links.length > 0 ? links.filter(l => l.name && l.url) : undefined,
        // Remove dashes from ORCID ID before saving (store as digits only)
        orcidId: orcidId.trim().replace(/-/g, '') || undefined,
        googleScholar: googleScholar.trim() || undefined,
        researchGate: researchGate.trim() || undefined,
        otherLinks: otherLinks.length > 0 ? otherLinks : undefined,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        timezone: timezone.trim() || undefined,
        createdAt: profile?.createdAt || new Date(),
        updatedAt: new Date(),
      };
      
      setProfile(updatedProfile);
      setIsEditing(false);
      
      // Reload profile in background (silently) to ensure we have the latest data
      loadProfile(true).then((profileData) => {
        // After reload, ensure we're still not in edit mode if profile exists
        if (profileData) {
          setIsEditing(false);
        }
      }).catch(err => {
        console.error('Error reloading profile:', err);
      });
    } catch (err: any) {
      console.error('Error saving profile:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
        stack: err.stack,
      });
      // Show more detailed error message to user
      const errorMessage = err.details 
        ? `${err.message}: ${err.details}`
        : err.hint
        ? `${err.message} (${err.hint})`
        : err.message || 'Failed to save profile';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!profile || !confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      await deleteParticipantProfile(profile.id);
      setProfile(null);
      // Reset all fields
      setProfilePicture('');
      setProfilePicturePreview('');
      setFullName('');
      setEmail(currentUser?.email || '');
      setPhone('');
      setAddress('');
      setTitle('');
      setPosition('');
      setOrganization('');
      setBio('');
      setWebsite('');
      setWebsites([]);
      setLinks([]);
      setOrcidId('');
      setGoogleScholar('');
      setResearchGate('');
      setOtherLinks([]);
      setCountry('');
      setCity('');
      setTimezone('');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error deleting profile:', err);
      setError(err.message || 'Failed to delete profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Display Mode - Use ProfilePreview component (only if profile exists and not editing)
  // If profile exists, always show preview unless explicitly editing
  if (profile && !isEditing) {
    return (
      <ProfilePreview
        profile={profile}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
      />
    );
  }

  // Edit Mode - Show when editing or when no profile exists yet
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <UserCircle className="text-indigo-600" size={32} />
            Participant Profile
          </h1>
          <p className="text-slate-500 mt-2">Fill in your participant profile information</p>
        </div>
        {profile && (
          <button
            onClick={() => {
              setIsEditing(false);
              loadProfile();
            }}
            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <User className="text-indigo-600" size={20} />
              Personal Information
            </h2>
            
            <div className="space-y-6">
              {/* Profile Picture Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <ImageIcon className="text-slate-500" size={16} />
                  Profile Picture
                </label>
                <input
                  ref={pictureInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePictureUpload}
                  className="hidden"
                />
                {profilePicturePreview ? (
                  <div className="relative">
                    <img 
                      src={profilePicturePreview} 
                      alt="Profile picture preview" 
                      className="w-32 h-32 rounded-full object-cover border-2 border-slate-200 cursor-pointer hover:opacity-90 transition-opacity mx-auto"
                      onClick={() => pictureInputRef.current?.click()}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfilePictureFile(null);
                        setProfilePicturePreview(profilePicture);
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div 
                    className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-full flex flex-col items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 hover:border-indigo-400 transition-colors mx-auto"
                    onClick={() => pictureInputRef.current?.click()}
                  >
                    <ImageIcon className="text-slate-400 mb-2" size={32} />
                    <p className="text-xs text-slate-500 text-center px-2">Click to upload</p>
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <User className="text-slate-500" size={16} />
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Briefcase className="text-slate-500" size={16} />
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Prof., Dr., Mr., Ms."
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Mail className="text-slate-500" size={16} />
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your email"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Phone className="text-slate-500" size={16} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <MapPin className="text-slate-500" size={16} />
                  Address
                </label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your address"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Briefcase className="text-indigo-600" size={20} />
              Professional Information
            </h2>
            
            <div className="space-y-6">
              {/* Position */}
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Briefcase className="text-slate-500" size={16} />
                  Position
                </label>
                <input
                  type="text"
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Professor, Researcher, PhD Candidate"
                />
              </div>

              {/* Organization */}
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Building className="text-slate-500" size={16} />
                  Organization
                </label>
                <input
                  type="text"
                  id="organization"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter organization/institution name"
                />
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <User className="text-slate-500" size={16} />
                  Biography
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter a brief biography or description"
                />
              </div>

              {/* Website */}
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Globe className="text-slate-500" size={16} />
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://example.com"
                />
              </div>

              {/* Additional Websites */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Globe className="text-slate-500" size={16} />
                  Additional Websites
                </label>
                {websites.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {websites.map((website, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm"
                      >
                        {website}
                        <button
                          type="button"
                          onClick={() => handleRemoveWebsite(website)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={websiteInput}
                    onChange={(e) => setWebsiteInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddWebsite();
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Add website URL"
                  />
                  <button
                    type="button"
                    onClick={handleAddWebsite}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Academic Identifiers */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <LinkIcon className="text-slate-500" size={16} />
                  Academic Identifiers
                </label>
                <div className="space-y-4">
                  {/* ORCID ID */}
                  <div>
                    <label htmlFor="orcidId" className="block text-xs text-slate-500 mb-1">
                      ORCID ID
                    </label>
                    <input
                      type="text"
                      id="orcidId"
                      value={orcidId}
                      onChange={handleOrcidIdChange}
                      maxLength={19} // 16 digits + 3 dashes = 19 characters
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="0000-0000-0000-0000"
                    />
                  </div>

                  {/* Google Scholar */}
                  <div>
                    <label htmlFor="googleScholar" className="block text-xs text-slate-500 mb-1">
                      Google Scholar Profile
                    </label>
                    <input
                      type="url"
                      id="googleScholar"
                      value={googleScholar}
                      onChange={(e) => setGoogleScholar(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="https://scholar.google.com/citations?user=..."
                    />
                  </div>

                  {/* ResearchGate */}
                  <div>
                    <label htmlFor="researchGate" className="block text-xs text-slate-500 mb-1">
                      ResearchGate Profile
                    </label>
                    <input
                      type="url"
                      id="researchGate"
                      value={researchGate}
                      onChange={(e) => setResearchGate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="https://www.researchgate.net/profile/..."
                    />
                  </div>

                  {/* Other Academic Links */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Other Academic Links
                    </label>
                    {otherLinks.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {otherLinks.map((link, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs"
                          >
                            {link}
                            <button
                              type="button"
                              onClick={() => handleRemoveOtherLink(link)}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={otherLinkInput}
                        onChange={(e) => setOtherLinkInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddOtherLink();
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Add academic/research link URL"
                      />
                      <button
                        type="button"
                        onClick={handleAddOtherLink}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Links */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <LinkIcon className="text-slate-500" size={16} />
                  Links
                </label>
                {links.length > 0 && (
                  <div className="mb-3 space-y-3">
                    {links.map(link => (
                      <div
                        key={link.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-xs text-slate-500 mb-1">Link Name</label>
                            <input
                              type="text"
                              value={link.name}
                              onChange={(e) => handleUpdateLink(link.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              placeholder="e.g., LinkedIn"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-slate-500 mb-1">URL</label>
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) => handleUpdateLink(link.id, 'url', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              placeholder="https://example.com"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveLink(link.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors mt-6"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add Link
                </button>
              </div>

              {/* Location Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Country"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="City"
                  />
                </div>
              </div>

              {/* Timezone */}
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-slate-700 mb-2">
                  Timezone
                </label>
                <input
                  type="text"
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., UTC, EST, PST"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          {profile && (
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                loadProfile();
              }}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
