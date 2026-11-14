import React, { useCallback, useEffect, useState } from 'react';
import { Check, ExternalLink, Loader2, RefreshCw, X } from 'lucide-react';
import { useAdminDisplaySettings } from '../../../../contexts/AdminDisplaySettingsContext';
import {
  approveSuperAdminProOrder,
  fetchSuperAdminProOrders,
  rejectSuperAdminProOrder,
} from '../../../../services/superAdminProOrderService';
import { formatMad } from '../../../../services/proOfferPricing';

interface ProOrderRow {
  id: string;
  organizer_user_id: string;
  offer_code: string;
  full_name: string;
  account_email: string;
  events_count: number;
  editions_count: number;
  amount_ht_mad: number;
  amount_ttc_mad: number;
  status: string;
  proof_file_urls: string[] | string;
  proof_file_names: string[] | string;
  created_at?: string;
  admin_notes?: string | null;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const p = JSON.parse(value);
      return Array.isArray(p) ? p.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

const ProPaymentsTab: React.FC = () => {
  const { language } = useAdminDisplaySettings();
  const fr = language === 'fr';
  const [orders, setOrders] = useState<ProOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending_review' | 'all' | 'approved' | 'rejected'>(
    'pending_review'
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = (await fetchSuperAdminProOrders(
        statusFilter === 'all' ? undefined : statusFilter
      )) as ProOrderRow[];
      setOrders(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id);
    setError(null);
    try {
      if (action === 'approve') await approveSuperAdminProOrder(id);
      else await rejectSuperAdminProOrder(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
        >
          <option value="pending_review">{fr ? 'En attente' : 'Pending review'}</option>
          <option value="approved">{fr ? 'Approuvés' : 'Approved'}</option>
          <option value="rejected">{fr ? 'Rejetés' : 'Rejected'}</option>
          <option value="all">{fr ? 'Tous' : 'All'}</option>
        </select>
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm text-left border-separate border-spacing-0">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold border-b">{fr ? 'Organisateur' : 'Organizer'}</th>
                <th className="px-4 py-3 font-semibold border-b">{fr ? 'Offre' : 'Offer'}</th>
                <th className="px-4 py-3 font-semibold border-b">{fr ? 'Qté' : 'Qty'}</th>
                <th className="px-4 py-3 font-semibold border-b">TTC</th>
                <th className="px-4 py-3 font-semibold border-b">{fr ? 'Preuves' : 'Proofs'}</th>
                <th className="px-4 py-3 font-semibold border-b">{fr ? 'Statut' : 'Status'}</th>
                <th className="px-4 py-3 font-semibold border-b text-right">{fr ? 'Actions' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <Loader2 className="inline animate-spin mr-2" size={18} />
                    {fr ? 'Chargement…' : 'Loading…'}
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    {fr ? 'Aucun paiement Pro.' : 'No Pro payments.'}
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const proofs = asStringArray(o.proof_file_urls);
                  const names = asStringArray(o.proof_file_names);
                  const busy = busyId === o.id;
                  const pending = o.status === 'pending_review';

                  return (
                    <tr key={o.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-slate-900">{o.full_name}</div>
                        <div className="text-xs text-slate-500">{o.account_email}</div>
                      </td>
                      <td className="px-4 py-3 align-top capitalize text-slate-700">
                        {String(o.offer_code).replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3 align-top text-slate-700">
                        {o.events_count} {fr ? 'évèn.' : 'evt'}
                        {o.editions_count > 0 ? ` · ${o.editions_count} ${fr ? 'éd.' : 'ed.'}` : ''}
                      </td>
                      <td className="px-4 py-3 align-top font-semibold text-slate-900">
                        {formatMad(Number(o.amount_ttc_mad))}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <ul className="space-y-1">
                          {proofs.map((url, i) => (
                            <li key={url}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-indigo-600 hover:underline text-xs"
                              >
                                {names[i] || `File ${i + 1}`}
                                <ExternalLink size={12} />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-3 align-top capitalize text-slate-700">
                        {o.status.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {pending ? (
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              disabled={busy}
                              title={fr ? 'Valider' : 'Approve'}
                              onClick={() => void act(o.id, 'approve')}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg disabled:opacity-50"
                            >
                              {busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              title={fr ? 'Rejeter' : 'Reject'}
                              onClick={() => void act(o.id, 'reject')}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 block text-right">—</span>
                        )}
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

export default ProPaymentsTab;
