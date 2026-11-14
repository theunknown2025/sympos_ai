import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { ParticipantDraft } from './types';

interface AccountManagerApproveStepProps {
  drafts: ParticipantDraft[];
  onBack: () => void;
  onContinue: () => void;
}

const AccountManagerApproveStep: React.FC<AccountManagerApproveStepProps> = ({
  drafts,
  onBack,
  onContinue,
}) => {
  const [showPasswords, setShowPasswords] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Step 3 — Approve</h2>
          <p className="text-sm text-slate-500 mt-1">
            Review names, emails, and passwords before sending invitations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPasswords((v) => !v)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700"
        >
          {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
          {showPasswords ? 'Hide passwords' : 'Show passwords'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Full name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Password</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((draft) => (
              <tr key={draft.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">{draft.fullName}</td>
                <td className="px-4 py-3 text-slate-600">{draft.email}</td>
                <td className="px-4 py-3 font-mono text-slate-700">
                  {showPasswords ? draft.password : '••••••••••••'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
        >
          Continue to Send
        </button>
      </div>
    </div>
  );
};

export default AccountManagerApproveStep;
