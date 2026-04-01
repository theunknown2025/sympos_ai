import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { getProfiles, deleteProfile, ProfessorProfile } from '../../../../services/profileBuilderService';
import { Trash2, Edit, Loader2, AlertCircle } from 'lucide-react';

interface ProfileListProps {
  onSelectProfile: (profile: ProfessorProfile) => void;
}

const ProfileList: React.FC<ProfileListProps> = ({ onSelectProfile }) => {
  const { currentUser } = useAuth();
  const [profiles, setProfiles] = useState<ProfessorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.id) {
      loadProfiles();
    }
  }, [currentUser]);

  const loadProfiles = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getProfiles(currentUser.id);
      setProfiles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (profileId: string) => {
    if (!currentUser?.id) return;
    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
      setDeletingId(profileId);
      await deleteProfile(profileId, currentUser.id);
      setProfiles(profiles.filter((p) => p.id !== profileId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete profile');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
        <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
        <span>{error}</span>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">No profiles found. Create your first profile to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {profiles.map((profile) => (
        <div
          key={profile.id}
          className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-slate-900">{profile.title}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => onSelectProfile(profile)}
                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                title="Edit profile"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(profile.id)}
                disabled={deletingId === profile.id}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                title="Delete profile"
              >
                {deletingId === profile.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </div>
          </div>
          {profile.profileImage && (
            <div className="mb-3">
              <img
                src={profile.profileImage}
                alt="Profile"
                className="w-full h-32 object-cover rounded-lg"
              />
            </div>
          )}
          <div className="text-sm text-slate-600">
            <p>Updated: {new Date(profile.updatedAt).toLocaleDateString()}</p>
            <p className="mt-1">Sections: {profile.sections.length}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProfileList;
