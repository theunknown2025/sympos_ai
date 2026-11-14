import React from 'react';
import { Loader2, RefreshCw, Search, Shield } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { useAdminDisplaySettings } from '../../../../contexts/AdminDisplaySettingsContext';
import { AccountActionIcons, accountRowStyle } from './AccountActionIcons';
import { isAccountSuspended, StatusCell } from './accountStatusStyles';
import { useAccountsTab } from './useAccountsTab';

const AdminsAccountsTab: React.FC = () => {
  const { language } = useAdminDisplaySettings();
  const fr = language === 'fr';
  const { currentUser } = useAuth();
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
  } = useAccountsTab('SuperAdmin');

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={fr ? 'Rechercher un admin…' : 'Search admins…'}
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
                <th className="px-4 py-3 font-semibold border-b border-slate-200 text-left">{fr ? 'Rôle' : 'Role'}</th>
                <th className="px-4 py-3 font-semibold border-b border-slate-200 text-left">{fr ? 'Statut' : 'Status'}</th>
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
                    {fr ? 'Aucun admin.' : 'No admins found.'}
                  </td>
                </tr>
              ) : (
                accounts.map((row) => {
                  const pending = pendingById[row.id] || null;
                  const busy = busyId === row.id;
                  const suspended = isAccountSuspended(row);
                  const isSelf = currentUser?.id === row.id;
                  const protectedRow = row.role === 'SuperAdmin' || isSelf;
                  const rowStyle = accountRowStyle(pending, suspended);
                  const cellClass = 'px-4 py-3 align-middle border-b border-slate-100';

                  return (
                    <tr key={row.id}>
                      <td className={cellClass} style={rowStyle}>
                        <div className="font-medium text-slate-900 truncate flex items-center gap-2">
                          <Shield size={14} className="text-indigo-500 shrink-0" />
                          {row.email}
                        </div>
                        {isSelf && (
                          <div className="text-xs text-indigo-600 mt-0.5">
                            {fr ? 'Vous' : 'You'}
                          </div>
                        )}
                      </td>
                      <td className={cellClass} style={rowStyle}>
                        {row.role}
                      </td>
                      <td className={cellClass} style={rowStyle}>
                        <StatusCell status={row.accountStatus} />
                      </td>
                      <td className={cellClass} style={rowStyle}>
                        <AccountActionIcons
                          fr={fr}
                          busy={busy}
                          protectedRow={protectedRow}
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

export default AdminsAccountsTab;
