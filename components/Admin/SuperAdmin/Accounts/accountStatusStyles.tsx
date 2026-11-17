import React from 'react';

export function statusBadgeClass(status: string): string {
  switch (String(status || '').toLowerCase()) {
    case 'trial':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'suspended':
      return 'text-amber-900 font-semibold';
    case 'expired':
    case 'unpaid':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'pending_payment':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

/** Status cell: suspended is plain text (no pill); others keep a light pill. */
export function StatusCell({ status }: { status: string }) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'suspended') {
    return (
      <span className="text-sm font-semibold text-amber-900">
        Suspended
      </span>
    );
  }
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadgeClass(
        normalized
      )}`}
    >
      {normalized || '—'}
    </span>
  );
}

export type AccountPendingAction = 'suspend' | 'delete' | 'grant_pro' | null;

export function isAccountSuspended(row: {
  accountStatus: string;
  banned: boolean;
}): boolean {
  return String(row.accountStatus || '').toLowerCase() === 'suspended' || !!row.banned;
}
