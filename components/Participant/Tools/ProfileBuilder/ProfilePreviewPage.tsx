import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../hooks/useAuth';
import { getProfile, ProfessorProfile } from '../../../../services/profileBuilderService';
import ProfilePreview from './ProfilePreview';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

const ProfilePreviewPage: React.FC = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfessorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!profileId || !currentUser?.id) {
        setError('Profile ID or user not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const loadedProfile = await getProfile(profileId, currentUser.id);
        if (loadedProfile) {
          setProfile(loadedProfile);
        } else {
          setError('Profile not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [profileId, currentUser]);

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
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Error</h2>
              <p className="text-slate-600">{error || 'Profile not found'}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/jury/tools/profile-builder')}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Profile Builder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/jury/tools/profile-builder')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft size={18} />
            Back to Profile Builder
          </button>
          <h1 className="text-3xl font-bold text-slate-900">{profile.title}</h1>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          <ProfilePreview 
            profile={{
              title: profile.title,
              profileImage: profile.profileImage,
              generalInfo: profile.generalInfo,
              sections: profile.sections,
            }} 
          />
        </div>
      </div>
    </div>
  );
};

export default ProfilePreviewPage;
