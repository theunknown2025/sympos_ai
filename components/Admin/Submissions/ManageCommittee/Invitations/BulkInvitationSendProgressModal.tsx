import React from 'react';
import { CheckCircle2, Loader2, X } from 'lucide-react';

interface BulkInvitationSendProgressModalProps {
  isOpen: boolean;
  sent: number;
  total: number;
  failed: number;
  finished: boolean;
  onClose: () => void;
}

const BulkInvitationSendProgressModal: React.FC<BulkInvitationSendProgressModalProps> = ({
  isOpen,
  sent,
  total,
  failed,
  finished,
  onClose,
}) => {
  if (!isOpen) return null;

  const progress = total > 0 ? Math.round((sent / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {finished ? 'Bulk send complete' : 'Sending invitations'}
          </h3>
          {finished && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="text-center py-4">
          {finished ? (
            <CheckCircle2 size={48} className="mx-auto text-emerald-600 mb-3" />
          ) : (
            <Loader2 size={48} className="mx-auto text-indigo-600 animate-spin mb-3" />
          )}
          <p className="text-3xl font-bold text-indigo-600">
            {sent} <span className="text-lg font-medium text-slate-500">/ {total}</span>
          </p>
          <p className="text-sm text-slate-600 mt-2">
            {finished
              ? `${sent} email${sent !== 1 ? 's' : ''} sent successfully`
              : 'Emails sent so far'}
          </p>
          {failed > 0 && (
            <p className="text-sm text-amber-700 mt-1">
              {failed} row{failed !== 1 ? 's' : ''} skipped (missing or invalid email)
            </p>
          )}
        </div>

        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {finished && (
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};

export default BulkInvitationSendProgressModal;
