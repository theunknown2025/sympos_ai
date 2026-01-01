import React, { useState, useEffect } from 'react';
import { X, Mail, Send, Loader2, AlertCircle, User, CheckCircle2 } from 'lucide-react';
import { ReviewCommitteeMember } from '../../../../types';
import { sendInvitationEmail } from '../../../../services/emailService';

interface InvitationEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  members?: ReviewCommitteeMember[];
  selectedMemberIds?: string[]; // For single invitation, pass one ID. For bulk, pass multiple
}

const DEFAULT_EMAIL_CONTENT = `Dear {{name}},

We are pleased to invite you to join our committee as a valued member.

Your expertise and contributions would be greatly appreciated.

Best regards,
Committee Management Team`;

const InvitationEmailModal: React.FC<InvitationEmailModalProps> = ({
  isOpen,
  onClose,
  members = [],
  selectedMemberIds = []
}) => {
  // Ensure members is always an array
  const safeMembers = Array.isArray(members) ? members : [];
  const [subject, setSubject] = useState('Invitation to Join Committee');
  const [content, setContent] = useState(DEFAULT_EMAIL_CONTENT);
  const [recipients, setRecipients] = useState<Array<{ id: string; email: string; fullName: string; selected: boolean }>>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Initialize recipients based on selectedMemberIds or all members
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (safeMembers.length > 0) {
      const safeSelectedIds = Array.isArray(selectedMemberIds) ? selectedMemberIds : [];
      
      if (safeSelectedIds.length > 0) {
        // Use selected members
        const selected = safeMembers
          .filter(m => m && m.id && safeSelectedIds.includes(m.id))
          .map(m => ({
            id: m.id,
            email: m.email || '',
            fullName: `${m.title ? `${m.title} ` : ''}${m.firstName || ''} ${m.lastName || ''}`.trim(),
            selected: true
          }));
        setRecipients(selected);
      } else {
        // Default: all members selected
        const all = safeMembers
          .filter(m => m && m.id)
          .map(m => ({
            id: m.id,
            email: m.email || '',
            fullName: `${m.title ? `${m.title} ` : ''}${m.firstName || ''} ${m.lastName || ''}`.trim(),
            selected: true
          }));
        setRecipients(all);
      }
    } else {
      setRecipients([]);
    }
  }, [isOpen, safeMembers, selectedMemberIds]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSubject('Invitation to Join Committee');
      setContent(DEFAULT_EMAIL_CONTENT);
      setError('');
      setSuccess(false);
      setRecipients([]);
    }
  }, [isOpen]);

  // Cleanup function for async operations
  useEffect(() => {
    return () => {
      // Cleanup timeout when component unmounts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setSending(false);
    };
  }, []);

  const toggleRecipient = (id: string) => {
    if (!id) return;
    setRecipients(prevRecipients => 
      prevRecipients.map(r => 
        r.id === id ? { ...r, selected: !r.selected } : r
      )
    );
  };

  const handleSend = async () => {
    setError('');
    setSuccess(false);

    const selectedRecipients = recipients.filter(r => r.selected && r.email);
    
    if (selectedRecipients.length === 0) {
      setError('Please select at least one recipient with a valid email address');
      return;
    }

    // Validate all selected recipients have emails
    const invalidRecipients = selectedRecipients.filter(r => !r.email || !r.email.trim());
    if (invalidRecipients.length > 0) {
      setError('Some selected recipients do not have valid email addresses');
      return;
    }

    if (!subject.trim()) {
      setError('Email subject is required');
      return;
    }

    if (!content.trim()) {
      setError('Email content is required');
      return;
    }

    try {
      setSending(true);
      
      await sendInvitationEmail(
        selectedRecipients.map(r => ({ 
          email: r.email.trim(), 
          fullName: r.fullName || r.email 
        })),
        subject.trim(),
        content.trim()
      );

      setSuccess(true);
      
      // Close modal after 2 seconds
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send invitation emails. Please try again.';
      setError(errorMessage);
      console.error('Error sending invitation emails:', err);
      
      // If it's a JWT/auth error, show helpful message
      if (errorMessage.includes('Authentication Error') ||
          errorMessage.includes('Invalid JWT') || 
          errorMessage.includes('JWT') ||
          errorMessage.includes('not authenticated') || 
          errorMessage.includes('Session expired') ||
          errorMessage.includes('expired') ||
          errorMessage.includes('token') ||
          errorMessage.includes('Unauthorized') ||
          errorMessage.includes('Please log in again') ||
          errorMessage.includes('Please log out and log back in')) {
        // If error already contains the formatted message, use it as-is
        if (errorMessage.includes('Authentication Error') && errorMessage.includes('Your session has expired')) {
          setError(errorMessage);
        } else {
          setError(
            'Authentication Error\n\n' +
            'Your session has expired. Please:\n\n' +
            '1. Log out and log back in\n' +
            '2. Try sending the email again\n\n' +
            'If the problem persists, clear your browser cache and try again.'
          );
        }
      }
      // If it's a deployment error, show helpful message
      else if (errorMessage.includes('not deployed') || errorMessage.includes('Function not found')) {
        setError(
          'Edge Function not deployed yet.\n\n' +
          'Please deploy it using:\n' +
          'npx supabase@latest functions deploy send-email\n\n' +
          'See DEPLOY_EMAIL_FUNCTION.md for instructions.'
        );
      }
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  // Don't render if no members available
  if (!safeMembers || safeMembers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">No Members Available</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-slate-600 mb-4">There are no committee members available to send invitations to.</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="text-indigo-600" size={24} />
            <h2 className="text-xl font-semibold text-slate-900">
              Send Invitation Email{recipients.length > 1 ? 's' : ''}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Error sending emails</p>
                  <pre className="text-sm whitespace-pre-wrap font-sans">{error}</pre>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
              <CheckCircle2 size={20} />
              <span>Invitation emails sent successfully!</span>
            </div>
          )}

          {/* Recipients Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Recipients ({recipients.filter(r => r.selected).length} selected)
            </label>
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 max-h-48 overflow-y-auto">
              {recipients.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No members available</p>
              ) : (
                <div className="space-y-2">
                  {recipients.map((recipient) => (
                    <label
                      key={recipient.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        recipient.selected
                          ? 'bg-indigo-50 border border-indigo-200'
                          : 'bg-white border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={recipient.selected}
                        onChange={() => toggleRecipient(recipient.id)}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <User size={18} className="text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {recipient.fullName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {recipient.email}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Tip: Use <code className="bg-slate-100 px-1 py-0.5 rounded">{'{{name}}'}</code> or <code className="bg-slate-100 px-1 py-0.5 rounded">{'{{fullName}}'}</code> in the content to personalize each email
            </p>
          </div>

          {/* Email Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Email Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Email content..."
              rows={12}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-2">
              You can use placeholders: <code className="bg-slate-100 px-1 py-0.5 rounded">{'{{name}}'}</code> or <code className="bg-slate-100 px-1 py-0.5 rounded">{'{{fullName}}'}</code> to personalize the email
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || success}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Sending...
              </>
            ) : (
              <>
                <Send size={18} />
                Send Invitation{recipients.filter(r => r.selected).length > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvitationEmailModal;

