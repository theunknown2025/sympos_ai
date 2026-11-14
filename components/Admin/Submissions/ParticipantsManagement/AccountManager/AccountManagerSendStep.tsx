import React, { useState } from 'react';
import { AlertCircle, Loader2, Send } from 'lucide-react';
import { useAuth } from '../../../../../hooks/useAuth';
import type { CommitteeInvitationAttachment } from '../../../../../types';
import InvitationFilesUpload from '../../ManageCommittee/Invitations/InvitationFilesUpload';
import BulkInvitationSendProgressModal from '../../ManageCommittee/Invitations/BulkInvitationSendProgressModal';
import ParticipantLoginMandatoryNotice from './ParticipantLoginMandatoryNotice';
import type { ParticipantDraft } from './types';
import {
  createParticipantAccount,
  createParticipantInvitation,
  sendParticipantInvitationEmail,
} from '../../../../../services/participantAccountService';
import { formatParticipantInvitationHtml } from '../../../../../services/participantAccountEmailMandatory';

const DEFAULT_SUBJECT = 'Your Sympos AI participant invitation';
const DEFAULT_BODY = `Dear {{name}},

You have been invited to join Sympos AI as a participant.

We look forward to your contributions.

Best regards,
Organizing team`;

interface AccountManagerSendStepProps {
  drafts: ParticipantDraft[];
  onBack: () => void;
  onComplete: () => void;
}

const AccountManagerSendStep: React.FC<AccountManagerSendStepProps> = ({
  drafts,
  onBack,
  onComplete,
}) => {
  const { currentUser } = useAuth();
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [attachedFiles, setAttachedFiles] = useState<CommitteeInvitationAttachment[]>([]);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const [progressOpen, setProgressOpen] = useState(false);
  const [progressSent, setProgressSent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [progressFailed, setProgressFailed] = useState(0);
  const [progressFinished, setProgressFinished] = useState(false);

  const recipientEmails = drafts.map((d) => d.email.trim()).filter(Boolean);
  const previewDraft = drafts[0];

  const personalize = (text: string, draft: ParticipantDraft) =>
    text.replace(/\{\{name\}\}/gi, draft.fullName.trim() || draft.email);

  const handleSend = async () => {
    setError('');
    if (!currentUser?.id) {
      setError('You must be logged in');
      return;
    }
    if (!subject.trim() || !body.trim()) {
      setError('Subject and message are required');
      return;
    }
    if (drafts.length === 0) {
      setError('No participants to invite');
      return;
    }

    setSending(true);
    setProgressOpen(true);
    setProgressFinished(false);
    setProgressSent(0);
    setProgressFailed(0);
    setProgressTotal(drafts.length);

    let sent = 0;
    let failed = 0;
    const sendBatchId = crypto.randomUUID();
    const attachments = attachedFiles.map((f) => ({ name: f.fileName, url: f.fileUrl }));

    try {
      for (const draft of drafts) {
        try {
          const createResult = await createParticipantAccount({
            fullName: draft.fullName.trim(),
            email: draft.email.trim(),
            password: draft.password,
          });

          if (!createResult.created && createResult.message?.includes('exists')) {
            failed += 1;
            setProgressFailed(failed);
            continue;
          }

          if (!createResult.success) {
            throw new Error(createResult.message || 'Account creation failed');
          }

          const personalizedSubject = personalize(subject, draft);
          const personalizedBody = personalize(body, draft);

          await createParticipantInvitation({
            invitedBy: currentUser.id,
            email: draft.email.trim(),
            fullName: draft.fullName.trim(),
            subject: personalizedSubject.trim(),
            content: personalizedBody.trim(),
            attachedFiles,
            authUserId: createResult.userId,
            sendBatchId,
          });

          const html = formatParticipantInvitationHtml(
            personalizedBody,
            draft.email.trim(),
            draft.password,
            attachments
          );

          await sendParticipantInvitationEmail({
            to: draft.email.trim(),
            subject: personalizedSubject.trim(),
            html,
            recipientName: draft.fullName.trim(),
          });

          sent += 1;
        } catch (rowErr) {
          console.error(`Failed for ${draft.email}:`, rowErr);
          failed += 1;
        }

        setProgressSent(sent);
        setProgressFailed(failed);
      }

      setProgressFinished(true);
    } catch (err: unknown) {
      setProgressOpen(false);
      setError(err instanceof Error ? err.message : 'Failed to send invitations');
    } finally {
      setSending(false);
    }
  };

  const closeProgress = () => {
    setProgressOpen(false);
    if (progressSent > 0) {
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Step 4 — Send</h2>
        <p className="text-sm text-slate-500 mt-1">
          Accounts are created and auto-approved when invitations are sent.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
        <textarea
          readOnly
          value={recipientEmails.join(', ')}
          rows={2}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 resize-none"
        />
        <p className="text-xs text-slate-500 mt-1">{recipientEmails.length} recipient(s)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={sending}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={sending}
          rows={8}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
          placeholder="Use {{name}} for the participant name"
        />
      </div>

      {currentUser?.id && (
        <InvitationFilesUpload
          userId={currentUser.id}
          files={attachedFiles}
          onChange={setAttachedFiles}
          disabled={sending}
        />
      )}

      <ParticipantLoginMandatoryNotice
        recipientEmail={previewDraft?.email}
        password={previewDraft?.password}
      />

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={sending}
          className="px-4 py-2 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={sending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-50"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          Send invitation{drafts.length !== 1 ? 's' : ''}
        </button>
      </div>

      <BulkInvitationSendProgressModal
        isOpen={progressOpen}
        sent={progressSent}
        total={progressTotal}
        failed={progressFailed}
        finished={progressFinished}
        onClose={closeProgress}
      />
    </div>
  );
};

export default AccountManagerSendStep;
