import React, { useEffect, useMemo, useState } from 'react';
import { supabase, TABLES } from '../../../supabase';
import { useAuth } from '../../../hooks/useAuth';

type SubscriptionStatus = 'active' | 'blocked';
type TabKey = 'organizers' | 'participants';

type OrganizerMembershipRow = {
  organizer_user_id: string;
  campus_id: string;
  subscription_status: SubscriptionStatus;
};

type ParticipantMembershipRow = {
  participant_user_id: string;
  campus_id: string;
  subscription_status: SubscriptionStatus;
};

type CampusRow = {
  id: string;
  name: string;
};

const SubscriptionManager: React.FC = () => {
  const { currentUser, userRole } = useAuth();

  const isSuperRole = useMemo(
    () =>
      userRole === 'SuperAdmin' ||
      userRole === 'SubSuperAdmin',
    [userRole]
  );

  const [tab, setTab] = useState<TabKey>('organizers');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [organizerMemberships, setOrganizerMemberships] = useState<OrganizerMembershipRow[]>([]);
  const [participantMemberships, setParticipantMemberships] = useState<ParticipantMembershipRow[]>([]);
  const [campusById, setCampusById] = useState<Record<string, string>>({});

  const loadData = async () => {
    if (!currentUser?.id || !isSuperRole) return;

    setLoading(true);
    setError('');

    try {
      const [orgRes, partRes] = await Promise.all([
        supabase
          .from(TABLES.ORGANIZER_MEMBERSHIPS)
          .select('organizer_user_id, campus_id, subscription_status'),
        supabase
          .from(TABLES.PARTICIPANT_MEMBERSHIPS)
          .select('participant_user_id, campus_id, subscription_status'),
      ]);

      if (orgRes.error) throw orgRes.error;
      if (partRes.error) throw partRes.error;

      const orgRows = (orgRes.data || []) as OrganizerMembershipRow[];
      const partRows = (partRes.data || []) as ParticipantMembershipRow[];

      setOrganizerMemberships(orgRows);
      setParticipantMemberships(partRows);

      const campusIds = Array.from(
        new Set([
          ...orgRows.map((r) => r.campus_id),
          ...partRows.map((r) => r.campus_id),
        ])
      );

      if (campusIds.length > 0) {
        const { data: campuses } = await supabase
          .from(TABLES.CAMPUSES)
          .select('id, name')
          .in('id', campusIds);

        const campusRows = (campuses || []) as CampusRow[];
        setCampusById(Object.fromEntries(campusRows.map((c) => [c.id, c.name])));
      } else {
        setCampusById({});
      }
    } catch (err: any) {
      console.error('Failed to load subscription data:', err);
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, userRole]);

  const updateOrganizerStatus = async (row: OrganizerMembershipRow, next: SubscriptionStatus) => {
    setLoading(true);
    setError('');
    try {
      const { error: updateErr } = await supabase
        .from(TABLES.ORGANIZER_MEMBERSHIPS)
        .update({ subscription_status: next })
        .eq('organizer_user_id', row.organizer_user_id)
        .eq('campus_id', row.campus_id);

      if (updateErr) throw updateErr;
      await loadData();
    } catch (err: any) {
      console.error('Failed to update organizer subscription:', err);
      setError(err.message || 'Failed to update organizer subscription');
      setLoading(false);
    }
  };

  const updateParticipantStatus = async (row: ParticipantMembershipRow, next: SubscriptionStatus) => {
    setLoading(true);
    setError('');
    try {
      const { error: updateErr } = await supabase
        .from(TABLES.PARTICIPANT_MEMBERSHIPS)
        .update({ subscription_status: next })
        .eq('participant_user_id', row.participant_user_id)
        .eq('campus_id', row.campus_id);

      if (updateErr) throw updateErr;
      await loadData();
    } catch (err: any) {
      console.error('Failed to update participant subscription:', err);
      setError(err.message || 'Failed to update participant subscription');
      setLoading(false);
    }
  };

  if (!isSuperRole) {
    return (
      <div className="p-8 text-slate-700">
        You are not authorized to access Subscription Manager.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Subscription Manager</h1>
          <p className="text-sm text-slate-600">Manage Active vs Blocked subscriptions per campus.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-2 rounded-lg border transition-colors ${
              tab === 'organizers'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            onClick={() => setTab('organizers')}
            type="button"
          >
            Organizers
          </button>
          <button
            className={`px-3 py-2 rounded-lg border transition-colors ${
              tab === 'participants'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            onClick={() => setTab('participants')}
            type="button"
          >
            Participants
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-slate-600">Loading...</div>
      ) : tab === 'organizers' ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-[640px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-4 py-3">Organizer</th>
                <th className="text-left px-4 py-3">Campus</th>
                <th className="text-left px-4 py-3">Subscription</th>
              </tr>
            </thead>
            <tbody>
              {organizerMemberships.map((row) => (
                <tr key={`${row.organizer_user_id}:${row.campus_id}`} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-900">{row.organizer_user_id}</td>
                  <td className="px-4 py-3 text-slate-800">{campusById[row.campus_id] || row.campus_id}</td>
                  <td className="px-4 py-3">
                    <select
                      className="border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                      value={row.subscription_status}
                      onChange={(e) => updateOrganizerStatus(row, e.target.value as SubscriptionStatus)}
                    >
                      <option value="active">Active</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </td>
                </tr>
              ))}

              {organizerMemberships.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    No organizer memberships found for your access scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-[640px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-4 py-3">Participant</th>
                <th className="text-left px-4 py-3">Campus</th>
                <th className="text-left px-4 py-3">Subscription</th>
              </tr>
            </thead>
            <tbody>
              {participantMemberships.map((row) => (
                <tr key={`${row.participant_user_id}:${row.campus_id}`} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-900">{row.participant_user_id}</td>
                  <td className="px-4 py-3 text-slate-800">{campusById[row.campus_id] || row.campus_id}</td>
                  <td className="px-4 py-3">
                    <select
                      className="border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                      value={row.subscription_status}
                      onChange={(e) => updateParticipantStatus(row, e.target.value as SubscriptionStatus)}
                    >
                      <option value="active">Active</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </td>
                </tr>
              ))}

              {participantMemberships.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    No participant memberships found for your access scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;

