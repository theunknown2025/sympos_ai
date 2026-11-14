import React, { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { AccountManagerStep, ParticipantDraft } from './types';
import { createEmptyParticipantDraft } from './participantAccountUtils';
import { checkParticipantEmails } from '../../../../../services/participantAccountService';
import AccountManagerProgressBar from './AccountManagerProgressBar';
import AccountManagerAddStep from './AccountManagerAddStep';
import AccountManagerValidateStep from './AccountManagerValidateStep';
import AccountManagerApproveStep from './AccountManagerApproveStep';
import AccountManagerSendStep from './AccountManagerSendStep';

const AccountManager: React.FC = () => {  const [step, setStep] = useState<AccountManagerStep>('add');
  const [drafts, setDrafts] = useState<ParticipantDraft[]>([createEmptyParticipantDraft()]);
  const [existingEmails, setExistingEmails] = useState<string[]>([]);
  const [readyDrafts, setReadyDrafts] = useState<ParticipantDraft[]>([]);
  const [validateLoading, setValidateLoading] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  const runValidation = async () => {    setStep('validate');
    setValidateLoading(true);
    setError('');
    try {
      const emails = drafts.map((d) => d.email.trim()).filter(Boolean);
      const result = await checkParticipantEmails(emails);
      setExistingEmails(result.existing);
      const existingSet = new Set(result.existing.map((e) => e.toLowerCase()));
      const ready = drafts.filter((d) => !existingSet.has(d.email.trim().toLowerCase()));
      setReadyDrafts(ready);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to validate emails');
      setStep('add');
    } finally {
      setValidateLoading(false);
    }
  };

  const handleComplete = () => {
    setCompleted(true);
  };

  const handleReset = () => {
    setStep('add');
    setDrafts([createEmptyParticipantDraft()]);
    setExistingEmails([]);
    setReadyDrafts([]);
    setError('');
    setCompleted(false);
  };

  const stepContent = useMemo(() => {
    if (completed) {
      return (
        <div className="text-center py-12">
          <CheckCircle2 size={48} className="mx-auto text-emerald-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Invitations sent</h3>
          <p className="text-slate-600 mb-6 text-sm max-w-md mx-auto">
            Participant accounts were created, auto-approved, and invitation emails were dispatched.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            Add more participants
          </button>
        </div>
      );
    }

    switch (step) {
      case 'add':
        return (
          <AccountManagerAddStep
            drafts={drafts}
            onChange={setDrafts}
            onContinue={() => void runValidation()}
            error={error}
            onError={setError}
          />
        );
      case 'validate':
        return (
          <AccountManagerValidateStep
            allDrafts={drafts}
            existingEmails={existingEmails}
            readyDrafts={readyDrafts}
            loading={validateLoading}
            error={error}
            onBack={() => setStep('add')}
            onContinue={() => {
              setError('');
              if (readyDrafts.length === 0) {
                setError('No new participants to approve.');
                return;
              }
              setStep('approve');
            }}
          />
        );
      case 'approve':
        return (
          <AccountManagerApproveStep
            drafts={readyDrafts}
            onBack={() => setStep('validate')}
            onContinue={() => setStep('send')}
          />
        );
      case 'send':
        return (
          <AccountManagerSendStep
            drafts={readyDrafts}
            onBack={() => setStep('approve')}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  }, [
    step,
    drafts,
    existingEmails,
    readyDrafts,
    validateLoading,
    error,
    completed,
  ]);

  return (
    <div className="space-y-6">
      <AccountManagerProgressBar currentStep={step} completed={completed} />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {stepContent}
      </div>
    </div>
  );
};
export default AccountManager;
