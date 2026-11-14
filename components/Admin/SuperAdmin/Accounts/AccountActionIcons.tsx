import React from 'react';
import { Ban, Check, CheckCircle2, Loader2, Trash2, X } from 'lucide-react';
import type { AccountPendingAction } from './accountStatusStyles';

interface AccountActionIconsProps {
  fr: boolean;
  busy: boolean;
  protectedRow?: boolean;
  isSuspended: boolean;
  pending: AccountPendingAction;
  onRequestSuspend: () => void;
  onRequestDelete: () => void;
  onRequestActivate: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function pendingConfirmMessage(
  pending: AccountPendingAction,
  fr: boolean
): string | null {
  if (pending === 'suspend') {
    return fr ? 'Suspendre ce compte ?' : 'Suspend this account?';
  }
  if (pending === 'delete') {
    return fr ? 'Supprimer définitivement ce compte ?' : 'Permanently delete this account?';
  }
  return null;
}

/** Row background: suspended = yellow; pending delete = red tint. */
export function accountRowClass(
  pending: AccountPendingAction,
  isSuspended: boolean
): string {
  if (pending === 'delete') return '!bg-red-100';
  if (pending === 'suspend' || isSuspended) return '!bg-yellow-200';
  return 'hover:bg-slate-50/80 bg-white';
}

export function accountRowStyle(
  pending: AccountPendingAction,
  isSuspended: boolean
): React.CSSProperties | undefined {
  if (pending === 'delete') return { backgroundColor: '#fecaca' };
  if (pending === 'suspend' || isSuspended) return { backgroundColor: '#fde047' };
  return undefined;
}

/** Icon-only actions; confirm message + yes/no icons inline (no box). */
export const AccountActionIcons: React.FC<AccountActionIconsProps> = ({
  fr,
  busy,
  protectedRow,
  isSuspended,
  pending,
  onRequestSuspend,
  onRequestDelete,
  onRequestActivate,
  onConfirm,
  onCancel,
}) => {
  if (protectedRow) {
    return (
      <span className="text-xs text-slate-400" title={fr ? 'Protégé' : 'Protected'}>
        —
      </span>
    );
  }

  if (pending) {
    const msg = pendingConfirmMessage(pending, fr);
    return (
      <div className="flex items-center justify-end gap-2 flex-wrap">
        {msg && (
          <span
            className={`text-xs font-medium whitespace-nowrap ${
              pending === 'delete' ? 'text-red-800' : 'text-amber-900'
            }`}
          >
            {msg}
          </span>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          title={fr ? 'Confirmer' : 'Confirm'}
          aria-label={fr ? 'Confirmer' : 'Confirm'}
          className="p-1 text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} strokeWidth={2.5} />}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          title={fr ? 'Annuler' : 'Cancel'}
          aria-label={fr ? 'Annuler' : 'Cancel'}
          className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-50"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {isSuspended ? (
        <button
          type="button"
          disabled={busy}
          onClick={onRequestActivate}
          title={fr ? 'Activer' : 'Activate'}
          aria-label={fr ? 'Activer' : 'Activate'}
          className="p-1 text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={onRequestSuspend}
          title={fr ? 'Suspendre' : 'Suspend'}
          aria-label={fr ? 'Suspendre' : 'Suspend'}
          className="p-1 text-amber-700 hover:text-amber-900 disabled:opacity-50"
        >
          <Ban size={18} />
        </button>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={onRequestDelete}
        title={fr ? 'Supprimer' : 'Delete'}
        aria-label={fr ? 'Supprimer' : 'Delete'}
        className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};
