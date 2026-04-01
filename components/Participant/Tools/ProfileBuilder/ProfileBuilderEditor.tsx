import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { saveProfile, getProfiles, ProfessorProfile, ProfileSection, ProfileDesign } from '../../../../services/profileBuilderService';
import { uploadImageToStorage } from '../../../../services/storageService';
import ProfileBuilderPanel from './ProfileBuilderPanel';
import ProfileDesignPanel from './ProfileDesignPanel';
import ProfilePreview from './ProfilePreview';
import PreviewAction from './actions/PreviewAction';
import ShareAction from './actions/ShareAction';
import PublishAction from './actions/PublishAction';
import EditAction from './actions/EditAction';
import DeleteAction from './actions/DeleteAction';
import { Save, Loader2, AlertCircle, FileText, Palette } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ProfileBuilderEditorProps {
  initialProfile?: ProfessorProfile | null;
}

const ProfileBuilderEditor: React.FC<ProfileBuilderEditorProps> = ({ initialProfile }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const getDefaultProfile = (): Omit<ProfessorProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'> => ({
    title: 'My Professor Profile',
    profileImage: undefined,
    generalInfo: {
      firstName: '',
      lastName: '',
      title: '',
      email: '',
      phone: '',
      address: '',
      organization: '',
      position: '',
      bio: '',
      links: [],
    },
    design: undefined,
    sections: [
      {
        id: uuidv4(),
        type: 'profile',
        title: 'Profile',
        order: 0,
        data: { content: '' },
      },
      {
        id: uuidv4(),
        type: 'education',
        title: 'Education',
        order: 1,
        data: { educations: [{ id: uuidv4(), institution: '', degree: '', field: '', startDate: '', endDate: '' }] },
      },
      {
        id: uuidv4(),
        type: 'experiences',
        title: 'Experiences',
        order: 2,
        data: { experiences: [{ id: uuidv4(), company: '', position: '', startDate: '', endDate: '', description: '' }] },
      },
      {
        id: uuidv4(),
        type: 'publications',
        title: 'Publications',
        order: 3,
        data: { publications: [{ id: uuidv4(), title: '', authors: '', publisher: '', date: '', url: '', description: '' }] },
      },
      {
        id: uuidv4(),
        type: 'certifications',
        title: 'Certifications',
        order: 4,
        data: { certifications: [{ id: uuidv4(), name: '', issuer: '', date: '', credentialId: '', credentialUrl: '' }] },
      },
      {
        id: uuidv4(),
        type: 'media',
        title: 'Media',
        order: 5,
        data: { mediaItems: [{ id: uuidv4(), title: '', type: 'image', url: '', description: '' }] },
      },
      {
        id: uuidv4(),
        type: 'blog',
        title: 'Blog',
        order: 6,
        data: { blogPosts: [{ id: uuidv4(), title: '', content: '', date: '', url: '' }] },
      },
    ],
  });

  const [profile, setProfile] = useState<Omit<ProfessorProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>(
    initialProfile
      ? {
          title: initialProfile.title,
          profileImage: initialProfile.profileImage,
          generalInfo: initialProfile.generalInfo,
          sections: initialProfile.sections,
        }
      : getDefaultProfile()
  );
  
  const [profileId, setProfileId] = useState<string | undefined>(initialProfile?.id);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false); // Start in view mode, switch to edit when needed
  const [fullProfile, setFullProfile] = useState<ProfessorProfile | null>(null); // Store full profile with metadata
  const [activeTab, setActiveTab] = useState<'content' | 'design'>('content'); // Tab for Content/Design

  const handleUpdateSection = (sectionId: string, data: any) => {
    setProfile((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, data } : section
      ),
    }));
  };

  const handleDeleteSection = (sectionId: string) => {
    setProfile((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.id !== sectionId),
    }));
  };

  const handleReorderSections = (newSections: ProfileSection[]) => {
    setProfile((prev) => ({
      ...prev,
      sections: newSections,
    }));
  };

  const handleAddSection = (section: ProfileSection) => {
    setProfile((prev) => ({
      ...prev,
      sections: [...prev.sections, section],
    }));
  };

  const handleUpdateGeneralInfo = (generalInfo: any) => {
    setProfile((prev) => ({
      ...prev,
      generalInfo: { ...prev.generalInfo, ...generalInfo },
    }));
  };

  const handleUpdateDesign = (design: ProfileDesign) => {
    setProfile((prev) => ({
      ...prev,
      design,
    }));
  };

  const handleProfileImageUpload = async (file: File) => {
    if (!currentUser?.id) return;

    try {
      const imageUrl = await uploadImageToStorage(currentUser.id, file, 'profile-images');
      setProfile((prev) => ({
        ...prev,
        profileImage: imageUrl,
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    }
  };

  // Load user's profile on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // If initialProfile is provided, use it (for backward compatibility)
        if (initialProfile) {
          setFullProfile(initialProfile); // Store full profile
          setProfile({
            title: initialProfile.title,
            profileImage: initialProfile.profileImage,
            generalInfo: initialProfile.generalInfo,
            sections: initialProfile.sections,
            design: initialProfile.design,
          });
          setProfileId(initialProfile.id);
          setIsEditMode(false); // View mode for existing profiles
        } else {
          // Otherwise, load the user's profile
          const profiles = await getProfiles(currentUser.id);
          if (profiles.length > 0) {
            // User has a profile, show it in view mode
            const userProfile = profiles[0]; // Get the first (and only) profile
            setFullProfile(userProfile); // Store full profile
            setProfile({
              title: userProfile.title,
              profileImage: userProfile.profileImage,
              generalInfo: userProfile.generalInfo,
              sections: userProfile.sections,
              design: userProfile.design,
            });
            setProfileId(userProfile.id);
            setIsEditMode(false); // View mode
          } else {
            // No profile exists, show default in edit mode
            setProfile(getDefaultProfile());
            setProfileId(undefined);
            setIsEditMode(true); // Edit mode for new profiles
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
        // On error, show default profile in edit mode
        setProfile(getDefaultProfile());
        setProfileId(undefined);
        setIsEditMode(true);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [currentUser, initialProfile]);

  const handleSave = async () => {
    if (!currentUser?.id) {
      setError('You must be logged in to save profiles');
      return;
    }

    if (!profile.title.trim()) {
      setError('Please enter a profile title');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(false);

      const savedProfile = await saveProfile(currentUser.id, { ...profile, id: profileId });
      setFullProfile(savedProfile); // Update full profile
      setProfileId(savedProfile.id);
      setSuccess(true);
      setIsEditMode(false); // Switch to view mode after saving
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex-1">
          {isEditMode ? (
            <input
              type="text"
              value={profile.title}
              onChange={(e) => setProfile((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Profile Title"
              className="text-xl font-bold text-slate-900 bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0"
            />
          ) : (
            <h1 className="text-xl font-bold text-slate-900">{profile.title}</h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Profile
                </>
              )}
            </button>
          ) : (
            <>
              {profileId && fullProfile && (
                <>
                  <PreviewAction profileId={profileId} />
                  <ShareAction profileId={profileId} profileTitle={profile.title} />
                  <PublishAction
                    profile={fullProfile}
                    onUpdate={(updatedProfile) => {
                      setFullProfile(updatedProfile);
                      setProfile({
                        title: updatedProfile.title,
                        profileImage: updatedProfile.profileImage,
                        generalInfo: updatedProfile.generalInfo,
                        sections: updatedProfile.sections,
                        design: updatedProfile.design,
                      });
                    }}
                  />
                  <EditAction onEdit={() => setIsEditMode(true)} />
                  <DeleteAction profileId={profileId} profileTitle={profile.title} />
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Profile saved successfully!
        </div>
      )}

      {/* Content */}
      {isEditMode ? (
        /* Edit Mode: Show Builder/Design Panel and Preview side by side */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-4">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'content'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={16} />
              Content
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'design'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Palette size={16} />
              Design
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex gap-4 min-h-0">
            <div className="w-1/2 border-r border-slate-200 pr-4 overflow-y-auto">
              {activeTab === 'content' ? (
                <ProfileBuilderPanel
                  profile={profile}
                  onUpdateSection={handleUpdateSection}
                  onDeleteSection={handleDeleteSection}
                  onReorderSections={handleReorderSections}
                  onAddSection={handleAddSection}
                  onUpdateGeneralInfo={handleUpdateGeneralInfo}
                  onProfileImageUpload={handleProfileImageUpload}
                />
              ) : (
                <ProfileDesignPanel
                  design={profile.design}
                  onUpdate={handleUpdateDesign}
                  sections={profile.sections.map((s) => ({ id: s.id, title: s.title }))}
                />
              )}
            </div>
            <div className="w-1/2 pl-4 overflow-y-auto">
              <ProfilePreview profile={profile} />
            </div>
          </div>
        </div>
      ) : (
        /* View Mode: Show only Preview */
        <div className="flex-1 min-h-0 overflow-y-auto">
          <ProfilePreview profile={profile} />
        </div>
      )}
    </div>
  );
};

export default ProfileBuilderEditor;
