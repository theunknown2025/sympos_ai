import React, { useState } from 'react';
import { Globe, Loader2, AlertCircle, Copy, Check, X } from 'lucide-react';
import { useAuth } from '../../../../../hooks/useAuth';
import { saveProfile } from '../../../../../services/profileBuilderService';
import { ProfessorProfile } from '../../../../../services/profileBuilderService';

interface PublishActionProps {
  profile: ProfessorProfile;
  onUpdate: (profile: ProfessorProfile) => void;
  className?: string;
}

const PublishAction: React.FC<PublishActionProps> = ({ profile, onUpdate, className = '' }) => {
  const { currentUser } = useAuth();
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showPublishedModal, setShowPublishedModal] = useState(false);
  const [publicSlug, setPublicSlug] = useState(profile.publicSlug || '');
  const [publishedUrl, setPublishedUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handlePublish = async () => {
    if (!currentUser?.id) {
      setError('You must be logged in to publish profiles');
      return;
    }

    if (!profile.id) {
      setError('Profile must be saved before publishing');
      return;
    }

    if (!publicSlug.trim()) {
      setError('Please enter a public slug');
      return;
    }

    try {
      setIsPublishing(true);
      setError(null);

      const slug = publicSlug.trim() || generateSlug(profile.title);
      const publishedUrl = `${window.location.origin}/profiles/${slug}`;

      const updatedProfile = await saveProfile(currentUser.id, {
        ...profile,
        id: profile.id,
        isPublished: true,
        publicSlug: slug,
        publishedUrl: publishedUrl,
      });

      onUpdate(updatedProfile);
      setPublishedUrl(publishedUrl);
      setShowPublishModal(false);
      setShowPublishedModal(true); // Show success modal with URL
    } catch (err: any) {
      setError(err.message || 'Failed to publish profile');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!currentUser?.id || !profile.id) return;

    try {
      setIsPublishing(true);
      setError(null);

      const updatedProfile = await saveProfile(currentUser.id, {
        ...profile,
        id: profile.id,
        isPublished: false,
        publicSlug: undefined,
        publishedUrl: undefined,
      });

      onUpdate(updatedProfile);
      setShowPublishedModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to unpublish profile');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publishedUrl || profile.publishedUrl || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          if (profile.isPublished) {
            // Show published modal with URL and unpublish button
            const url = profile.publishedUrl || (profile.publicSlug ? `${window.location.origin}/profiles/${profile.publicSlug}` : '');
            setPublishedUrl(url);
            setShowPublishedModal(true);
          } else {
            setPublicSlug(generateSlug(profile.title));
            setShowPublishModal(true);
          }
        }}
        className={`p-2 ${
          profile.isPublished
            ? 'text-green-600 hover:bg-green-50'
            : 'text-indigo-600 hover:bg-indigo-50'
        } rounded transition-colors ${className}`}
        title={profile.isPublished ? 'Unpublish profile' : 'Publish profile'}
        disabled={isPublishing}
      >
        {isPublishing ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Globe size={18} />
        )}
      </button>

      {/* Publish Modal - Before Publishing */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Publish Profile</h3>
              <button
                onClick={() => {
                  setShowPublishModal(false);
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Public URL Slug
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">/profiles/</span>
                  <input
                    type="text"
                    value={publicSlug}
                    onChange={(e) => setPublicSlug(e.target.value)}
                    placeholder="my-profile"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Public URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/profiles/${publicSlug || 'your-slug'}`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm"
                  />
                  <button
                    onClick={async () => {
                      const url = `${window.location.origin}/profiles/${publicSlug || 'your-slug'}`;
                      try {
                        await navigator.clipboard.writeText(url);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch (err) {
                        console.error('Failed to copy URL:', err);
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check size={16} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  This URL will be available after publishing
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || !publicSlug.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowPublishModal(false);
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

      {/* Published Modal - After Publishing */}
      {showPublishedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Profile Published</h3>
              <button
                onClick={() => setShowPublishedModal(false)}
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
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium mb-2">Your profile is now publicly accessible!</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Public URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={publishedUrl || profile.publishedUrl || ''}
                    readOnly
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check size={16} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUnpublish}
                  disabled={isPublishing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Unpublishing...
                    </>
                  ) : (
                    'Unpublish'
                  )}
                </button>
                <button
                  onClick={() => setShowPublishedModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PublishAction;
