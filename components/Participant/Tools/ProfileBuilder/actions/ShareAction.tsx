import React, { useState } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';

interface ShareActionProps {
  profileId: string;
  profileTitle: string;
  className?: string;
}

const ShareAction: React.FC<ShareActionProps> = ({ profileId, profileTitle, className = '' }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const profileUrl = `${window.location.origin}/jury/tools/profile-builder/preview/${profileId}`;

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowShareModal(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShareViaWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: profileTitle,
          text: `Check out my profile: ${profileTitle}`,
          url: profileUrl,
        });
        setShowShareModal(false);
      } catch (err) {
        // User cancelled or error occurred
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  return (
    <>
      <button
        onClick={handleShare}
        className={`p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors ${className}`}
        title="Share profile"
      >
        <Share2 size={18} />
      </button>

      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Share Profile</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Profile Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={profileUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
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
              {navigator.share && (
                <button
                  onClick={handleShareViaWebShare}
                  className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 size={16} />
                  Share via...
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareAction;
