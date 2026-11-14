import React from 'react';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import { useAdminDisplaySettings } from '../../../../contexts/AdminDisplaySettingsContext';
import { AccountActionIcons, accountRowStyle } from './AccountActionIcons';
import { isAccountSuspended, StatusCell } from './accountStatusStyles';
import { useAccountsTab } from './useAccountsTab';

const ParticipantsAccountsTab: React.FC = () => {
  const { language } = useAdminDisplaySettings();
  const fr = language === 'fr';
  const {
    accounts,
    loading,
    error,
    query,
    setQuery,
    busyId,
    pendingById,
    setPending,
    confirmPending,
    activate,
    load,
  } = useAccountsTab('Participant');

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString(fr ? 'fr-FR' : 'en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={fr ? 'Rechercher un participant…' : 'Search participants…'}
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {fr ? 'Actualiser' : 'Refresh'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[800px] text-sm text-left border-separate border-spacing-0">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold border-b border-slate-200 text-left">{fr ? 'Compte' : 'Account'}</th>
                <th className="px-4 py-3 font-semibold border-b border-slate-200 text-left">{fr ? 'Statut' : 'Status'}</th>
                <th className="px-4 py-3 font-semibold border-b border-slate-200 text-left">{fr ? 'Dernière connexion' : 'Last sign-in'}</th>
                <th className="px-4 py-3 font-semibold border-b border-slate-200 text-right">{fr ? 'Actions' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                    <Loader2 className="inline animate-spin mr-2" size={18} />
                    {fr ? 'Chargement…' : 'Loading…'}
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                    {fr ? 'Aucun participant.' : 'No participants found.'}
                  </td>
                </tr>
              ) : (
                accounts.map((row) => {
                  const pending = pendingById[row.id] || null;
                  const busy = busyId === row.id;
                  const suspended = isAccountSuspended(row);
                  const rowStyle = accountRowStyle(pending, suspended);
                  const cellClass = 'px-4 py-3 align-middle border-b border-slate-100';

                  return (
                    <tr key={row.id}>
                      <td className={cellClass} style={rowStyle}>
                        <div className="font-medium text-slate-900 truncate">{row.email}</div>
                        {row.fullName && (
                          <div className="text-xs text-slate-500 truncate">{row.fullName}</div>
                        )}
                      </td>
                      <td className={cellClass} style={rowStyle}>
                        <StatusCell status={row.accountStatus} />
                      </td>
                      <td className={`${cellClass} text-slate-600 text-xs sm:text-sm`} style={rowStyle}>
                        {formatDate(row.lastSignInAt)}
                      </td>
                      <td className={cellClass} style={rowStyle}>
                        <AccountActionIcons
                          fr={fr}
                          busy={busy}
                          isSuspended={suspended}
                          pending={pending}
                          onRequestSuspend={() => setPending(row.id, 'suspend')}
                          onRequestDelete={() => setPending(row.id, 'delete')}
                          onRequestActivate={() => void activate(row.id)}
                          onConfirm={() => void confirmPending(row.id)}
                          onCancel={() => setPending(row.id, null)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ParticipantsAccountsTab;
