import React, { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Award
} from 'lucide-react';
import { ApprovalStatus, CertificateTemplate } from '../../../types';
import { getUserBadgeTemplates } from '../../../services/badgeTemplateService';
import { useAuth } from '../../../hooks/useAuth';

interface RegistrationApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (approval: ApprovalStatus, comment: string, badgeTemplateId?: string) => Promise<void>;
  currentApproval?: ApprovalStatus;
  currentComment?: string;
  registrationName: string;
}

const RegistrationApprovalModal: React.FC<RegistrationApprovalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentApproval,
  currentComment = '',
  registrationName
}) => {
  const { currentUser } = useAuth();
  const [approval, setApproval] = useState<ApprovalStatus | null>(currentApproval || null);
  const [comment, setComment] = useState<string>(currentComment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [badgeTemplates, setBadgeTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedBadgeTemplateId, setSelectedBadgeTemplateId] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApproval(currentApproval || null);
      setComment(currentComment || '');
      setError('');
      setSelectedBadgeTemplateId('');
      if (currentUser) {
        loadBadgeTemplates();
      }
    }
  }, [isOpen, currentApproval, currentComment, currentUser]);

  const loadBadgeTemplates = async () => {
    if (!currentUser) return;
    try {
      setLoadingTemplates(true);
      const templates = await getUserBadgeTemplates(currentUser.id);
      setBadgeTemplates(templates);
    } catch (err: any) {
      console.error('Error loading badge templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!approval) {
      setError('Please select an approval decision');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit(approval, comment, selectedBadgeTemplateId || undefined);
    } catch (err: any) {
      setError(err.message || 'Error saving approval decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setApproval(currentApproval || null);
      setComment(currentComment);
      setError('');
    }
  };

  const approvalOptions: Array<{ value: ApprovalStatus; label: string; icon: React.ReactNode; color: string }> = [
    {
      value: 'accepted',
      label: 'Approve',
      icon: <CheckCircle size={20} />,
      color: 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      value: 'reserved',
      label: 'Approve with Reserve',
      icon: <Clock size={20} />,
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
    },
    {
      value: 'rejected',
      label: 'Reject',
      icon: <XCircle size={20} />,
      color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Registration Approval</h2>
            <p className="text-sm text-slate-600 mt-1">Review registration for: {registrationName}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              {currentApproval ? 'Update Approval Status' : 'Select Approval Status'}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {approvalOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setApproval(option.value)}
                  disabled={isSubmitting}
                  className={`
                    flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all
                    ${approval === option.value
                      ? `${option.color} border-current font-semibold`
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="badgeTemplate" className="block text-sm font-semibold text-slate-700 mb-2">
              Badge Template (Optional)
            </label>
            {loadingTemplates ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                <Loader2 className="animate-spin" size={16} />
                <span>Loading badge templates...</span>
              </div>
            ) : (
              <select
                id="badgeTemplate"
                value={selectedBadgeTemplateId}
                onChange={(e) => setSelectedBadgeTemplateId(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">No badge template</option>
                {badgeTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
            )}
            {badgeTemplates.length === 0 && !loadingTemplates && (
              <p className="mt-2 text-xs text-slate-500">
                No badge templates available. Create one in the Certificates section.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-semibold text-slate-700 mb-2">
              Comments
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              placeholder="Add comments about your approval decision (optional)"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
            <p className="mt-2 text-xs text-slate-500">
              {comment.length} character{comment.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !approval}
            className="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Saving...
              </>
            ) : (
              'Save Approval'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationApprovalModal;
