import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Edit2, Trash2, X, Plus, Loader2, 
  Building, Mail, Phone, MapPin, Globe, Link as LinkIcon, 
  User, Briefcase, Image as ImageIcon, FileImage, Calendar,
  Target, Eye, GraduationCap, Users, FileText
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { 
  getOrganizerProfile, 
  saveOrganizerProfile, 
  deleteOrganizerProfile,
  getOrganizerProfileById
} from '../../../services/organizerProfileService';
import { uploadImageToStorage } from '../../../services/storageService';
import { OrganizerProfile, OrganizerProfileLink } from '../../../types';
import EntityProfilePreview from './EntityProfilePreview';

const EntityProfile: React.FC = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Entity Information
  const [entityLogo, setEntityLogo] = useState<string>('');
  const [entityLogoFile, setEntityLogoFile] = useState<File | null>(null);
  const [entityLogoPreview, setEntityLogoPreview] = useState<string>('');
  const [entityBanner, setEntityBanner] = useState<string>('');
  const [entityBannerFile, setEntityBannerFile] = useState<File | null>(null);
  const [entityBannerPreview, setEntityBannerPreview] = useState<string>('');
  const [entityName, setEntityName] = useState('');
  const [entityCreationDate, setEntityCreationDate] = useState('');
  const [entityLegalStatus, setEntityLegalStatus] = useState('');
  const [entityCountry, setEntityCountry] = useState('');
  const [entityCity, setEntityCity] = useState('');
  const [entityOfficialWebsite, setEntityOfficialWebsite] = useState('');
  const [entityEmail, setEntityEmail] = useState('');
  const [entityPhone, setEntityPhone] = useState('');
  const [entityAddress, setEntityAddress] = useState('');
  const [entityWebsites, setEntityWebsites] = useState<string[]>([]);
  const [websiteInput, setWebsiteInput] = useState('');
  const [entityLinks, setEntityLinks] = useState<OrganizerProfileLink[]>([]);
  const [entityMission, setEntityMission] = useState('');
  const [entityVision, setEntityVision] = useState('');
  const [entityScientificDomains, setEntityScientificDomains] = useState<string[]>([]);
  const [scientificDomainInput, setScientificDomainInput] = useState('');

  // Representative Information
  const [representativePhoto, setRepresentativePhoto] = useState<string>('');
  const [representativePhotoFile, setRepresentativePhotoFile] = useState<File | null>(null);
  const [representativePhotoPreview, setRepresentativePhotoPreview] = useState<string>('');
  const [representativeFullName, setRepresentativeFullName] = useState('');
  const [representativeEmail, setRepresentativeEmail] = useState('');
  const [representativePhone, setRepresentativePhone] = useState('');
  const [representativeFunction, setRepresentativeFunction] = useState('');

  // Display Toggles
  const [showCommittees, setShowCommittees] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showBlogArticles, setShowBlogArticles] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const representativePhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      loadProfile();
    }
  }, [currentUser]);

  useEffect(() => {
    if (profile && !loading && !saving) {
      setIsEditing(false);
    }
  }, [profile, loading, saving]);

  const loadProfile = async (silent = false): Promise<OrganizerProfile | null> => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError('');
      if (!currentUser?.id) return null;

      const profileData = await getOrganizerProfile(currentUser.id);
      if (profileData) {
        setProfile(profileData);
        setEntityLogo(profileData.entityLogo || '');
        setEntityLogoPreview(profileData.entityLogo || '');
        setEntityBanner(profileData.entityBanner || '');
        setEntityBannerPreview(profileData.entityBanner || '');
        setEntityName(profileData.entityName || '');
        setEntityCreationDate(profileData.entityCreationDate || '');
        setEntityLegalStatus(profileData.entityLegalStatus || '');
        setEntityCountry(profileData.entityCountry || '');
        setEntityCity(profileData.entityCity || '');
        setEntityOfficialWebsite(profileData.entityOfficialWebsite || '');
        setEntityEmail(profileData.entityEmail || '');
        setEntityPhone(profileData.entityPhone || '');
        setEntityAddress(profileData.entityAddress || '');
        setEntityWebsites(profileData.entityWebsites || []);
        setEntityLinks(profileData.entityLinks || []);
        setEntityMission(profileData.entityMission || '');
        setEntityVision(profileData.entityVision || '');
        setEntityScientificDomains(profileData.entityScientificDomains || []);
        setRepresentativePhoto(profileData.representativePhoto || '');
        setRepresentativePhotoPreview(profileData.representativePhoto || '');
        setRepresentativeFullName(profileData.representativeFullName || '');
        setRepresentativeEmail(profileData.representativeEmail || '');
        setRepresentativePhone(profileData.representativePhone || '');
        setRepresentativeFunction(profileData.representativeFunction || '');
        setShowCommittees(profileData.showCommittees || false);
        setShowEvents(profileData.showEvents || false);
        setShowBlogArticles(profileData.showBlogArticles || false);
        setIsEditing(false);
        return profileData;
      } else {
        setEntityEmail(currentUser.email || '');
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

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner' | 'representative'
  ) => {
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
      
      if (type === 'logo') {
        setEntityLogoFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          setEntityLogoPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else if (type === 'banner') {
        setEntityBannerFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          setEntityBannerPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else if (type === 'representative') {
        setRepresentativePhotoFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          setRepresentativePhotoPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAddWebsite = () => {
    if (websiteInput.trim() && !entityWebsites.includes(websiteInput.trim())) {
      setEntityWebsites([...entityWebsites, websiteInput.trim()]);
      setWebsiteInput('');
    }
  };

  const handleRemoveWebsite = (website: string) => {
    setEntityWebsites(entityWebsites.filter(w => w !== website));
  };

  const handleAddLink = () => {
    const newLink: OrganizerProfileLink = {
      id: `link-${Date.now()}`,
      name: '',
      url: '',
    };
    setEntityLinks([...entityLinks, newLink]);
  };

  const handleUpdateLink = (linkId: string, field: 'name' | 'url', value: string) => {
    setEntityLinks(entityLinks.map(l => l.id === linkId ? { ...l, [field]: value } : l));
  };

  const handleRemoveLink = (linkId: string) => {
    setEntityLinks(entityLinks.filter(l => l.id !== linkId));
  };

  const handleAddScientificDomain = () => {
    if (scientificDomainInput.trim() && !entityScientificDomains.includes(scientificDomainInput.trim())) {
      setEntityScientificDomains([...entityScientificDomains, scientificDomainInput.trim()]);
      setScientificDomainInput('');
    }
  };

  const handleRemoveScientificDomain = (domain: string) => {
    setEntityScientificDomains(entityScientificDomains.filter(d => d !== domain));
  };

  const handleSave = async () => {
    try {
      if (!currentUser?.id) {
        setError('User not authenticated');
        return;
      }

      setSaving(true);
      setError('');

      // Upload images if files are selected
      let logoUrl = entityLogo;
      if (entityLogoFile) {
        logoUrl = await uploadImageToStorage(currentUser.id, entityLogoFile, 'organizer-profiles');
      }

      let bannerUrl = entityBanner;
      if (entityBannerFile) {
        bannerUrl = await uploadImageToStorage(currentUser.id, entityBannerFile, 'organizer-profiles');
      }

      let representativePhotoUrl = representativePhoto;
      if (representativePhotoFile) {
        representativePhotoUrl = await uploadImageToStorage(currentUser.id, representativePhotoFile, 'organizer-profiles');
      }

      const profileData: Omit<OrganizerProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        entityLogo: logoUrl,
        entityBanner: bannerUrl,
        entityName,
        entityCreationDate: entityCreationDate || undefined,
        entityLegalStatus: entityLegalStatus || undefined,
        entityCountry: entityCountry || undefined,
        entityCity: entityCity || undefined,
        entityOfficialWebsite: entityOfficialWebsite || undefined,
        entityEmail: entityEmail || undefined,
        entityPhone: entityPhone || undefined,
        entityAddress: entityAddress || undefined,
        entityWebsites: entityWebsites.length > 0 ? entityWebsites : undefined,
        entityLinks: entityLinks.length > 0 ? entityLinks : undefined,
        entityMission: entityMission || undefined,
        entityVision: entityVision || undefined,
        entityScientificDomains: entityScientificDomains.length > 0 ? entityScientificDomains : undefined,
        representativePhoto: representativePhotoUrl,
        representativeFullName: representativeFullName || undefined,
        representativeEmail: representativeEmail || undefined,
        representativePhone: representativePhone || undefined,
        representativeFunction: representativeFunction || undefined,
        showCommittees: showCommittees,
        showEvents: showEvents,
        showBlogArticles: showBlogArticles,
      };

      const profileId = await saveOrganizerProfile(currentUser.id, profileData);
      
      // Reload profile to get updated data including publish status
      const updatedProfile = await getOrganizerProfileById(profileId);
      if (updatedProfile) {
        setProfile(updatedProfile);
        // Update all state with fresh data
        setEntityLogo(updatedProfile.entityLogo || '');
        setEntityLogoPreview(updatedProfile.entityLogo || '');
        setEntityBanner(updatedProfile.entityBanner || '');
        setEntityBannerPreview(updatedProfile.entityBanner || '');
        // ... other state updates if needed
      } else {
        await loadProfile(true);
      }
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!profile || !window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      await deleteOrganizerProfile(profile.id);
      setProfile(null);
      // Reset all fields
      setEntityLogo('');
      setEntityLogoPreview('');
      setEntityBanner('');
      setEntityBannerPreview('');
      setEntityName('');
      setEntityCreationDate('');
      setEntityLegalStatus('');
      setEntityCountry('');
      setEntityCity('');
      setEntityOfficialWebsite('');
      setEntityEmail('');
      setEntityPhone('');
      setEntityAddress('');
      setEntityWebsites([]);
      setEntityLinks([]);
      setEntityMission('');
      setEntityVision('');
      setEntityScientificDomains([]);
      setRepresentativePhoto('');
      setRepresentativePhotoPreview('');
      setRepresentativeFullName('');
      setRepresentativeEmail('');
      setRepresentativePhone('');
      setRepresentativeFunction('');
      setIsEditing(true);
    } catch (err: any) {
      console.error('Error deleting profile:', err);
      setError(err.message || 'Failed to delete profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  // Display Mode - Use EntityProfilePreview component (only if profile exists and not editing)
  if (profile && !isEditing) {
    return (
      <EntityProfilePreview
        profile={profile}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
        onProfileUpdate={async (updatedProfile) => {
          setProfile(updatedProfile);
          await loadProfile(true);
        }}
      />
    );
  }

  // Edit Mode - Show when editing or when no profile exists yet
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Building className="text-indigo-600" size={32} />
            Profile Folder
          </h1>
          <p className="text-slate-500 mt-2">Fill in your entity profile information</p>
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
        {/* Entity Information Section */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Building size={24} />
            Entity Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Logo
              </label>
              <div className="flex items-center gap-4">
                {(entityLogoPreview || entityLogo) && (
                  <div className="relative w-32 h-32 border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                    <img 
                      src={entityLogoPreview || entityLogo} 
                      alt="Logo preview" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'logo')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <ImageIcon size={18} />
                    {entityLogo || entityLogoPreview ? 'Change Logo' : 'Upload Logo'}
                  </button>
                </div>
              </div>
            </div>

            {/* Banner */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Banner
              </label>
              <div className="flex items-center gap-4">
                {(entityBannerPreview || entityBanner) && (
                  <div className="relative w-full h-48 border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                    <img 
                      src={entityBannerPreview || entityBanner} 
                      alt="Banner preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'banner')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <ImageIcon size={18} />
                    {entityBanner || entityBannerPreview ? 'Change Banner' : 'Upload Banner'}
                  </button>
                </div>
              </div>
            </div>

            {/* Entity Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nom officiel de l'université / institution *
              </label>
              <input
                type="text"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {/* Creation Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date de création
              </label>
              <input
                type="date"
                value={entityCreationDate}
                onChange={(e) => setEntityCreationDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Legal Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Statut juridique
              </label>
              <select
                value={entityLegalStatus}
                onChange={(e) => setEntityLegalStatus(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select...</option>
                <option value="publique">Publique</option>
                <option value="privée">Privée</option>
                <option value="fondation">Fondation</option>
                <option value="consortium académique">Consortium académique</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Pays
              </label>
              <input
                type="text"
                value={entityCountry}
                onChange={(e) => setEntityCountry(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ville
              </label>
              <input
                type="text"
                value={entityCity}
                onChange={(e) => setEntityCity(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Official Website */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Site web officiel
              </label>
              <input
                type="url"
                value={entityOfficialWebsite}
                onChange={(e) => setEntityOfficialWebsite(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://example.com"
              />
            </div>

            {/* Entity Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email institutionnel
              </label>
              <input
                type="email"
                value={entityEmail}
                onChange={(e) => setEntityEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Entity Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={entityPhone}
                onChange={(e) => setEntityPhone(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Adresse
              </label>
              <textarea
                value={entityAddress}
                onChange={(e) => setEntityAddress(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Additional Websites */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Autres sites web
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={websiteInput}
                  onChange={(e) => setWebsiteInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddWebsite())}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://example.com"
                />
                <button
                  type="button"
                  onClick={handleAddWebsite}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
              {entityWebsites.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entityWebsites.map((website, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg"
                    >
                      <Globe size={14} />
                      {website}
                      <button
                        type="button"
                        onClick={() => handleRemoveWebsite(website)}
                        className="text-indigo-700 hover:text-indigo-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Other Links */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Autres liens
              </label>
              {entityLinks.map((link) => (
                <div key={link.id} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={link.name}
                    onChange={(e) => handleUpdateLink(link.id, 'name', e.target.value)}
                    placeholder="Nom du lien"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => handleUpdateLink(link.id, 'url', e.target.value)}
                    placeholder="URL"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(link.id)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddLink}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                Add Link
              </button>
            </div>

            {/* Mission */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Target size={18} />
                Mission
              </label>
              <textarea
                value={entityMission}
                onChange={(e) => setEntityMission(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Mission statement..."
              />
            </div>

            {/* Vision */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Eye size={18} />
                Vision
              </label>
              <textarea
                value={entityVision}
                onChange={(e) => setEntityVision(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Vision statement..."
              />
            </div>

            {/* Scientific Domains */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <GraduationCap size={18} />
                Domaines scientifiques
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={scientificDomainInput}
                  onChange={(e) => setScientificDomainInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddScientificDomain())}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter scientific domain"
                />
                <button
                  type="button"
                  onClick={handleAddScientificDomain}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
              {entityScientificDomains.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entityScientificDomains.map((domain, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 text-violet-700 rounded-lg"
                    >
                      {domain}
                      <button
                        type="button"
                        onClick={() => handleRemoveScientificDomain(domain)}
                        className="text-violet-700 hover:text-violet-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Representative Information Section */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <User size={24} />
            Representative Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Representative Photo */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Photo
              </label>
              <div className="flex items-center gap-4">
                {(representativePhotoPreview || representativePhoto) && (
                  <div className="relative w-32 h-32 border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                    <img 
                      src={representativePhotoPreview || representativePhoto} 
                      alt="Representative preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <input
                    ref={representativePhotoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'representative')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => representativePhotoInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <ImageIcon size={18} />
                    {representativePhoto || representativePhotoPreview ? 'Change Photo' : 'Upload Photo'}
                  </button>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={representativeFullName}
                onChange={(e) => setRepresentativeFullName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={representativeEmail}
                onChange={(e) => setRepresentativeEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={representativePhone}
                onChange={(e) => setRepresentativePhone(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Function */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Function
              </label>
              <input
                type="text"
                value={representativeFunction}
                onChange={(e) => setRepresentativeFunction(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Director, President, etc."
              />
            </div>
          </div>
        </div>

        {/* Display Settings Section */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Globe size={24} />
            Public Profile Display Settings
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Control which sections appear in your published profile
          </p>

          <div className="space-y-4">
            {/* Show Committees Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <Users size={18} />
                  Display Committees
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  Show committees section in public profile
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCommittees}
                  onChange={(e) => setShowCommittees(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Show Events Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <Calendar size={18} />
                  Display Events
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  Show events section in public profile
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showEvents}
                  onChange={(e) => setShowEvents(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Show Blog Articles Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <FileText size={18} />
                  Display Blog Articles
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  Show blog articles section in public profile
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBlogArticles}
                  onChange={(e) => setShowBlogArticles(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          {profile && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 size={18} />
              Delete Profile
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EntityProfile;
