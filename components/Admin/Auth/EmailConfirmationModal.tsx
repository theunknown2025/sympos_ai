import React from 'react';
import { X, Mail, CheckCircle } from 'lucide-react';

interface EmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  type?: 'register' | 'login';
}

const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  email,
  type = 'register'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 relative animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="text-green-600" size={32} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
          Check Your Email
        </h2>

        {/* Message */}
        <div className="text-center mb-6">
          <p className="text-slate-600 mb-2">
            {type === 'register' 
              ? 'We\'ve sent a confirmation link to:'
              : 'Please check your email and click the confirmation link to verify your account.'
            }
          </p>
          {type === 'register' && (
            <p className="font-semibold text-indigo-600 break-all">{email}</p>
          )}
          <p className="text-slate-500 text-sm mt-4">
            Click the link in the email to confirm your account and complete your {type === 'register' ? 'registration' : 'login'}.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-indigo-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-indigo-800">
              <p className="font-medium mb-1">Didn't receive the email?</p>
              <ul className="list-disc list-inside space-y-1 text-indigo-700">
                <li>Check your spam/junk folder</li>
                <li>Make sure the email address is correct</li>
                <li>Wait a few minutes and try again</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all"
        >
          Got it, thanks!
        </button>
      </div>
    </div>
  );
};

export default EmailConfirmationModal;

