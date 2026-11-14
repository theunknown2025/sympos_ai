import React from 'react';
import { AlertCircle, CheckCircle2, Loader2, UserCheck, UserX } from 'lucide-react';
import type { ParticipantDraft } from './types';

interface AccountManagerValidateStepProps {
  allDrafts: ParticipantDraft[];
  existingEmails: string[];
  readyDrafts: ParticipantDraft[];
  loading: boolean;
  error: string;
  onBack: () => void;
  onContinue: () => void;
}

const AccountManagerValidateStep: React.FC<AccountManagerValidateStepProps> = ({
  allDrafts,
  existingEmails,
  readyDrafts,
  loading,
  error,
  onBack,
  onContinue,
}) => {
  const existingSet = new Set(existingEmails.map((e) => e.toLowerCase()));
  const withAccount = allDrafts.filter((d) => existingSet.has(d.email.trim().toLowerCase()));
  const withoutAccount = readyDrafts;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Step 2 — Validate</h2>
        <p className="text-sm text-slate-500 mt-1">
          We check each email against existing accounts. Only new participants continue to approval.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-12 text-slate-500">
          <Loader2 size={40} className="animate-spin text-indigo-600 mb-3" />
          <p>Checking emails…</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck size={20} className="text-amber-700" />
                <h3 className="font-medium text-slate-900">
                  Already have an account ({withAccount.length})
                </h3>
              </div>
              {withAccount.length === 0 ? (
                <p className="text-sm text-slate-600">No duplicates found.</p>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {withAccount.map((d) => (
                    <li
                      key={d.id}
                      className="text-sm bg-white rounded-lg border border-amber-100 px-3 py-2"
                    >
                      <span className="font-medium text-slate-800">{d.fullName}</span>
                      <span className="text-slate-500 block text-xs">{d.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <UserX size={20} className="text-emerald-700" />
                <h3 className="font-medium text-slate-900">
                  New participants ({withoutAccount.length})
                </h3>
              </div>
              {withoutAccount.length === 0 ? (
                <p className="text-sm text-slate-600">All emails already registered.</p>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {withoutAccount.map((d) => (
                    <li
                      key={d.id}
                      className="text-sm bg-white rounded-lg border border-emerald-100 px-3 py-2 flex items-start gap-2"
                    >
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <span className="font-medium text-slate-800 block">{d.fullName}</span>
                        <span className="text-slate-500 text-xs">{d.email}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

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
              className="px-4 py-2 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onContinue}
              disabled={withoutAccount.length === 0}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-50"
            >
              Continue to Approve ({withoutAccount.length})
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountManagerValidateStep;
