import React from 'react';
import { Gift, Loader2, RefreshCw, Search } from 'lucide-react';
import { useAdminDisplaySettings } from '../../../../contexts/AdminDisplaySettingsContext';
import { AccountActionIcons, accountRowStyle } from './AccountActionIcons';
import { isAccountSuspended, StatusCell } from './accountStatusStyles';
import { useAccountsTab } from './useAccountsTab';

const OrganizersAccountsTab: React.FC = () => {
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
    grantEvents,
    setGrantEvents,
    confirmPending,
    activate,
    load,
  } = useAccountsTab('Organizer');

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={fr ? 'Rechercher un organisateur…' : 'Search organizers…'}
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
                <th className="px-4 py-3 font-semibold border-b border-slate-200 text-left">{fr ? 'Offre' : 'Plan'}</th>
                <th className="px-4 py-3 font-semibold border-b border-slate-200 text-left">{fr ? 'Statut' : 'Status'}</th>
                <th className="px-4 py-3 font-semibold border-b border-slate-200 text-left">{fr ? 'Jours restants' : 'Days left'}</th>
                <th className="px-4 py-3 font-semibold border-b border-slate-200 text-right">{fr ? 'Actions' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    <Loader2 className="inline animate-spin mr-2" size={18} />
                    {fr ? 'Chargement…' : 'Loading…'}
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    {fr ? 'Aucun organisateur.' : 'No organizers found.'}
                  </td>
                </tr>
              ) : (
                accounts.map((row) => {
                  const pending = pendingById[row.id] || null;
                  const busy = busyId === row.id;
                  const isFree = row.planCode === 'free';
                  const suspended = isAccountSuspended(row);
                  const alreadyPro =
                    row.planCode === 'pro' && row.subscriptionStatus === 'active' && !suspended;
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
                        {isFree ? (
                          <span className="inline-flex items-center gap-1 text-indigo-700">
                            <Gift size={14} />
                            Free
                          </span>
                        ) : (
                          <span className="text-slate-600 capitalize">{row.planCode || '—'}</span>
                        )}
                      </td>
                      <td className={cellClass} style={rowStyle}>
                        <StatusCell status={row.accountStatus} />
                      </td>
                      <td className={cellClass} style={rowStyle}>
                        {isFree ? (
                          <span className="font-medium">
                            {row.daysLeft != null && row.daysLeft > 0
                              ? fr
                                ? `${row.daysLeft} j`
                                : `${row.daysLeft} d`
                              : fr
                                ? '0 j'
                                : '0 d'}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className={cellClass} style={rowStyle}>
                        <AccountActionIcons
                          fr={fr}
                          busy={busy}
                          isSuspended={suspended}
                          pending={pending}
                          showGrantPro={!alreadyPro}
                          grantEvents={grantEvents}
                          onGrantEventsChange={setGrantEvents}
                          onRequestGrantPro={() => setPending(row.id, 'grant_pro')}
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

export default OrganizersAccountsTab;
