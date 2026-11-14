import React, { useEffect, useRef, useState } from 'react';
import {
  Mail,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Settings,
  Users,
} from 'lucide-react';
import { useAuth } from '../../../../../hooks/useAuth';
import { createEmailInvitation } from '../../../../../services/committeeInvitationService';
import type { CommitteeInvitationAttachment } from '../../../../../types';
import InvitationFilesUpload from './InvitationFilesUpload';
import MandatoryInvitationResponseNotice from './MandatoryInvitationResponseNotice';
import BulkInvitationCsvSection from './BulkInvitationCsvSection';
import BulkInvitationSendProgressModal from './BulkInvitationSendProgressModal';
import InvitationMergeFieldInput from './InvitationMergeFieldInput';
import {
  applyBulkInvitationMergeFields,
  findEmailColumn,
  getRowColumnValue,
  isValidEmail,
  MEMBER_EMAIL_MERGE_TOKEN,
  rowToInviteeSnapshot,
  type ParsedBulkInvitationFile,
} from './bulkInvitationCsvUtils';

const DEFAULT_CONTENT = `Dear {{name}},

We are pleased to invite you to join our scientific committee on our platform.

Your expertise and contributions would be greatly appreciated.

Best regards,
Organizing team`;

interface SendEmailInvitationPanelProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const SendEmailInvitationPanel: React.FC<SendEmailInvitationPanelProps> = ({ onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const gearRef = useRef<HTMLDivElement>(null);

  const [bulkMode, setBulkMode] = useState(false);
  const [showGearMenu, setShowGearMenu] = useState(false);
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Invitation to join the scientific committee');
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [attachedFiles, setAttachedFiles] = useState<CommitteeInvitationAttachment[]>([]);
  const [parsedCsv, setParsedCsv] = useState<ParsedBulkInvitationFile | null>(null);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successDetail, setSuccessDetail] = useState('');

  const [progressOpen, setProgressOpen] = useState(false);
  const [progressSent, setProgressSent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [progressFailed, setProgressFailed] = useState(0);
  const [progressFinished, setProgressFinished] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (gearRef.current && !gearRef.current.contains(e.target as Node)) {
        setShowGearMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSingleSend = async () => {
    setError('');
    if (!currentUser?.id) {
      setError('You must be logged in');
      return;
    }
    if (!email.trim() || !isValidEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    if (!subject.trim() || !content.trim()) {
      setError('Subject and message are required');
      return;
    }

    try {
      setSending(true);
      await createEmailInvitation({
        invitedBy: currentUser.id,
        email: email.trim(),
        subject: subject.trim(),
        content: content.trim(),
        attachedFiles,
        inviteeSnapshot: { email: email.trim() },
        sendEmail: true,
      });
      setSuccessDetail('The invitee will receive an email and can respond from their Invitations page.');
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleBulkSend = async () => {
    setError('');
    if (!currentUser?.id) {
      setError('You must be logged in');
      return;
    }
    if (!parsedCsv) {
      setError('Upload a CSV file with column titles in the first row.');
      return;
    }
    if (!subject.trim() || !content.trim()) {
      setError('Subject and message are required');
      return;
    }

    const emailColumn = findEmailColumn(parsedCsv.headers);
    if (!emailColumn) {
      setError("File doesn't respect format. An 'email' column is required.");
      return;
    }

    const total = parsedCsv.rows.length;
    setProgressOpen(true);
    setProgressFinished(false);
    setProgressSent(0);
    setProgressTotal(total);
    setProgressFailed(0);
    setSending(true);

    let sent = 0;
    let failed = 0;

    try {
      for (let i = 0; i < parsedCsv.rows.length; i++) {
        const row = parsedCsv.rows[i];
        const recipientEmail = getRowColumnValue(row, parsedCsv.headers, [
          'email',
          'e-mail',
          'mail',
          'courriel',
        ]);

        if (!recipientEmail || !isValidEmail(recipientEmail)) {
          failed += 1;
          setProgressFailed(failed);
          continue;
        }

        const mergeOptions = { memberEmail: email };
        const personalizedSubject = applyBulkInvitationMergeFields(
          subject,
          row,
          parsedCsv.headers,
          mergeOptions
        );
        const personalizedContent = applyBulkInvitationMergeFields(
          content,
          row,
          parsedCsv.headers,
          mergeOptions
        );
        const inviteeSnapshot = rowToInviteeSnapshot(row, parsedCsv.headers);

        try {
          await createEmailInvitation({
            invitedBy: currentUser.id,
            email: recipientEmail,
            subject: personalizedSubject.trim(),
            content: personalizedContent.trim(),
            attachedFiles,
            inviteeSnapshot: { ...inviteeSnapshot, email: recipientEmail },
            sendEmail: true,
          });
          sent += 1;
        } catch (rowErr) {
          console.error(`Failed to send invitation to ${recipientEmail}:`, rowErr);
          failed += 1;
        }

        setProgressSent(sent);
        setProgressFailed(failed);
      }

      setProgressFinished(true);
      setSuccessDetail(
        `${sent} of ${total} invitation email${sent !== 1 ? 's' : ''} sent${
          failed > 0 ? ` (${failed} skipped)` : ''
        }.`
      );
    } catch (err: unknown) {
      setProgressOpen(false);
      setError(err instanceof Error ? err.message : 'Failed to send bulk invitations');
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (bulkMode) void handleBulkSend();
    else void handleSingleSend();
  };

  const closeProgressModal = () => {
    setProgressOpen(false);
    if (progressSent > 0) {
      setSuccess(true);
    }
  };

  const toggleBulkMode = () => {
    setBulkMode((prev) => !prev);
    setShowGearMenu(false);
    setError('');
    if (!bulkMode) {
      setParsedCsv(null);
    }
  };

  if (success) {
    return (
      <div className="text-center py-10">
        <CheckCircle2 size={48} className="mx-auto text-emerald-600 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {bulkMode ? 'Bulk invitations sent' : 'Invitation sent'}
        </h3>
        <p className="text-slate-600 mb-6">{successDetail}</p>
        <button
          type="button"
          onClick={() => {
            onSuccess?.();
            onClose();
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Mail className="text-indigo-600" size={24} />
            <h2 className="text-xl font-semibold text-slate-900">Send email invitation</h2>
            {bulkMode && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Multiple emails
              </span>
            )}
          </div>
        </div>

        <div className="relative" ref={gearRef}>
          <button
            type="button"
            onClick={() => setShowGearMenu((prev) => !prev)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200"
            title="Options"
          >
            <Settings size={20} />
          </button>
          {showGearMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
              <button
                type="button"
                onClick={toggleBulkMode}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 text-left"
              >
                <Users size={16} className="text-indigo-600" />
                {bulkMode ? 'Switch to single email' : 'Send multiple emails'}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex gap-2">
          <AlertCircle size={20} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Member email {!bulkMode && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={
            bulkMode
              ? 'contact@organizer.org or paste addresses to reference in the message'
              : 'reviewer@university.edu'
          }
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        {bulkMode ? (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-slate-500">
              Recipients are taken from the CSV. Use this field in the subject or message via{' '}
              <code className="text-indigo-700">{MEMBER_EMAIL_MERGE_TOKEN}</code>, or drag the chip
              below.
            </p>
            {email.trim() && (
              <button
                type="button"
                draggable={!sending}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', MEMBER_EMAIL_MERGE_TOKEN);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                disabled={sending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-indigo-200 text-sm text-indigo-800 hover:bg-indigo-100 cursor-grab active:cursor-grabbing disabled:opacity-50"
              >
                Member email ({MEMBER_EMAIL_MERGE_TOKEN})
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 mt-1">
            Use {'{{name}}'} or {'{{email}}'} in the message for personalization.
          </p>
        )}
      </div>

      {bulkMode && (
        <BulkInvitationCsvSection
          parsedFile={parsedCsv}
          onParsedFileChange={setParsedCsv}
          disabled={sending}
        />
      )}

      <InvitationMergeFieldInput
        label="Subject"
        required
        value={subject}
        onChange={setSubject}
        placeholder={bulkMode ? 'Invitation for {{name}}' : 'Invitation to join the scientific committee'}
        hint={
          bulkMode
            ? 'Drag CSV columns or {{member_email}} into this field. Row {{email}} is the recipient address from the file.'
            : undefined
        }
        disabled={sending}
      />

      <InvitationMergeFieldInput
        label="Message"
        required
        multiline
        value={content}
        onChange={setContent}
        hint={
          bulkMode
            ? 'Drag CSV columns or {{member_email}} into the message. {{email}} in each row is the recipient. Mandatory response instructions are added automatically.'
            : "Use {{name}} or {{email}} for personalization. Instructions for responding are added automatically below and cannot be removed."
        }
        disabled={sending}
      />

      <MandatoryInvitationResponseNotice
        recipientEmail={
          bulkMode
            ? parsedCsv
              ? `${parsedCsv.rows.length} recipients from CSV`
              : email.trim() || undefined
            : email.trim() || undefined
        }
      />

      {currentUser?.id && (
        <InvitationFilesUpload
          userId={currentUser.id}
          files={attachedFiles}
          onChange={setAttachedFiles}
          disabled={sending}
        />
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          disabled={sending}
          className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || (bulkMode && !parsedCsv)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {sending ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Sending...
            </>
          ) : (
            <>
              <Send size={18} />
              {bulkMode
                ? `Send ${parsedCsv?.rows.length ?? 0} invitation${parsedCsv && parsedCsv.rows.length !== 1 ? 's' : ''}`
                : 'Send invitation'}
            </>
          )}
        </button>
      </div>

      <BulkInvitationSendProgressModal
        isOpen={progressOpen}
        sent={progressSent}
        total={progressTotal}
        failed={progressFailed}
        finished={progressFinished}
        onClose={closeProgressModal}
      />
    </div>
  );
};

export default SendEmailInvitationPanel;
