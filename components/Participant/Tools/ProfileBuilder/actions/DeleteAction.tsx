import React, { useState } from 'react';
import { Trash2, Loader2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../../../../hooks/useAuth';
import { deleteProfile } from '../../../../../services/profileBuilderService';
import { useNavigate } from 'react-router-dom';

interface DeleteActionProps {
  profileId: string;
  profileTitle: string;
  className?: string;
}

const DeleteAction: React.FC<DeleteActionProps> = ({ profileId, profileTitle, className = '' }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!currentUser?.id) {
      setError('You must be logged in to delete profiles');
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      await deleteProfile(profileId, currentUser.id);
      // Navigate back to profile builder (will show empty state)
      navigate('/jury/tools/profile-builder');
    } catch (err: any) {
      setError(err.message || 'Failed to delete profile');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowDeleteModal(true)}
        className={`p-2 text-red-600 hover:bg-red-50 rounded transition-colors ${className}`}
        title="Delete profile"
      >
        <Trash2 size={18} />
      </button>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Delete Profile</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setError(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2 text-sm">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-4">
              <p className="text-slate-600">
                Are you sure you want to delete <strong>"{profileTitle}"</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setError(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteAction;
