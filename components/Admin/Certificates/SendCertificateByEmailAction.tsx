import React from 'react';
import { Mail } from 'lucide-react';

interface SendCertificateByEmailActionProps {
  onClick: () => void;
  disabled?: boolean;
  selectedCount: number;
  sending?: boolean;
  onOpenModal?: () => void;
}

const SendCertificateByEmailAction: React.FC<SendCertificateByEmailActionProps> = ({
  onClick,
  disabled = false,
  selectedCount,
  sending = false,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 h-full flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center mb-4">
          <Mail className="text-green-600" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Send Certificate by Email</h3>
        <p className="text-sm text-slate-500 mb-6">
          Email certificates directly to participants
        </p>
      </div>
      
      <button
        onClick={onClick}
        disabled={disabled || sending}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
      >
        <Mail size={18} />
        {sending ? 'Sending...' : `Send ${selectedCount > 0 ? `${selectedCount} ` : ''}Certificate${selectedCount !== 1 ? 's' : ''}`}
      </button>
    </div>
  );
};

export default SendCertificateByEmailAction;
