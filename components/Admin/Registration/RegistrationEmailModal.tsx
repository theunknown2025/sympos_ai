import React, { useState, useEffect } from 'react';
import { X, Award, Loader2 } from 'lucide-react';
import EmailSender from '../Tools/EmailSender/EmailSender';
import type { EmailRecipient } from '../Tools/EmailSender/EmailSender';
import { FormSubmission } from '../../../services/registrationSubmissionService';
import { getBadgeForSubmission } from '../../../services/badgeGeneratorService';

interface RegistrationEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: EmailRecipient[];
  submission: FormSubmission;
}

const RegistrationEmailModal: React.FC<RegistrationEmailModalProps> = ({
  isOpen,
  onClose,
  recipients,
  submission
}) => {
  const [includeBadge, setIncludeBadge] = useState(false);
  const [badgeFile, setBadgeFile] = useState<File | null>(null);
  const [loadingBadge, setLoadingBadge] = useState(false);
  const [badgeError, setBadgeError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIncludeBadge(false);
      setBadgeFile(null);
      setBadgeError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!includeBadge) {
      setBadgeFile(null);
      setBadgeError('');
      return;
    }

    if (badgeFile) return; // Already loaded

    const loadBadge = async () => {
      setLoadingBadge(true);
      setBadgeError('');

      try {
        const badge = await getBadgeForSubmission(submission.id);
        
        if (!badge) {
          setBadgeError('No badge found for this registration');
          setIncludeBadge(false);
          return;
        }

        // Convert badge image URL to File object
        const response = await fetch(badge.badgeImageUrl);
        const blob = await response.blob();
        const file = new File([blob], `badge-${submission.id}.png`, { type: 'image/png' });
        setBadgeFile(file);
      } catch (err: any) {
        console.error('Error loading badge:', err);
        setBadgeError(err.message || 'Failed to load badge');
        setIncludeBadge(false);
      } finally {
        setLoadingBadge(false);
      }
    };

    loadBadge();
  }, [includeBadge, submission.id]);

  const handleEmailSent = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Send Email</h2>
            <p className="text-sm text-slate-600 mt-1">
              Send email to: {submission.generalInfo?.name || submission.submittedBy || 'Registration'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Include Badge Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <Award size={20} className="text-purple-600" />
              <div>
                <label htmlFor="includeBadge" className="text-sm font-medium text-slate-900 cursor-pointer">
                  Include Badge
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Attach the participant's badge to the email
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {loadingBadge && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="animate-spin" size={16} />
                  <span>Loading badge...</span>
                </div>
              )}
              {badgeError && (
                <p className="text-xs text-red-600">{badgeError}</p>
              )}
              {badgeFile && !loadingBadge && (
                <span className="text-xs text-green-600 font-medium">Badge ready</span>
              )}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="includeBadge"
                  checked={includeBadge}
                  onChange={(e) => setIncludeBadge(e.target.checked)}
                  disabled={loadingBadge}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
              </label>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <EmailSender
              isOpen={true}
              inline={true}
              onClose={onClose}
              recipients={recipients}
              initialAttachments={badgeFile ? [badgeFile] : []}
              placeholderReplacer={(template, recipient) => {
                let content = template;
                content = content.replace(/\{\{name\}\}/g, recipient.name || '');
                content = content.replace(/\{\{fullName\}\}/g, recipient.name || '');
                content = content.replace(/\{\{email\}\}/g, recipient.email);
                if (recipient.approvalStatus) {
                  const statusText = recipient.approvalStatus === 'accepted' 
                    ? 'approved' 
                    : recipient.approvalStatus === 'reserved'
                    ? 'approved with reserve'
                    : 'rejected';
                  content = content.replace(/\{\{approvalStatus\}\}/g, statusText);
                  content = content.replace(/\{\{status\}\}/g, statusText);
                }
                if (recipient.comment) {
                  content = content.replace(/\{\{comment\}\}/g, recipient.comment);
                }
                if (recipient.eventTitle) {
                  content = content.replace(/\{\{eventTitle\}\}/g, recipient.eventTitle);
                  content = content.replace(/\{\{event\}\}/g, recipient.eventTitle);
                }
                return content;
              }}
              onSuccess={handleEmailSent}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationEmailModal;
