import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, XCircle, Loader2, AlertCircle } from 'lucide-react';

export type DecisionStatus = 'accepted' | 'reserved' | 'rejected';

interface SubmissionDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (decision: DecisionStatus, comment: string) => Promise<void>;
  currentDecision?: DecisionStatus;
  currentComment?: string;
}

const SubmissionDecisionModal: React.FC<SubmissionDecisionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentDecision,
  currentComment = ''
}) => {
  const [decision, setDecision] = useState<DecisionStatus | null>(currentDecision || null);
  const [comment, setComment] = useState<string>(currentComment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update state when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setDecision(currentDecision || null);
      setComment(currentComment || '');
      setError('');
    }
  }, [isOpen, currentDecision, currentComment]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!decision) {
      setError('Please select a decision');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit(decision, comment);
      onClose();
      // Reset form after successful submission
      setDecision(null);
      setComment('');
    } catch (err: any) {
      setError(err.message || 'Error saving decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset to current values when closing without saving
      setDecision(currentDecision || null);
      setComment(currentComment);
      setError('');
    }
  };

  const decisionOptions: Array<{ value: DecisionStatus; label: string; icon: React.ReactNode; color: string }> = [
    {
      value: 'accepted',
      label: 'Accept',
      icon: <CheckCircle size={20} />,
      color: 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      value: 'reserved',
      label: 'Reserve',
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
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Submission Decision</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Decision Options */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              {currentDecision ? 'Update Decision' : 'Select a Decision'}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {decisionOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDecision(option.value)}
                  disabled={isSubmitting}
                  className={`
                    flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all
                    ${decision === option.value
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

          {/* Comment Section */}
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
              placeholder="Add comments about your decision (optional)"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
            <p className="mt-2 text-xs text-slate-500">
              {comment.length} character{comment.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Footer */}
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
            disabled={isSubmitting || !decision}
            className="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Saving...
              </>
            ) : (
              'Save Decision'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDecisionModal;

