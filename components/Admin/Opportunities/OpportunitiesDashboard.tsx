import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Loader2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getOpportunityDashboardStats } from '../../../services/opportunityService';
import { getApplicationsForOrganizerOpportunities } from '../../../services/opportunityApplicationService';

const OpportunitiesDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    inProgressApplications: 0,
    rejectedApplications: 0,
  });
  const [recent, setRecent] = useState<
    { title: string; participant: string; status: string; updatedAt: Date }[]
  >([]);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        setLoading(true);
        const s = await getOpportunityDashboardStats(currentUser.id);
        setStats(s);
        const groups = await getApplicationsForOrganizerOpportunities(currentUser.id);
        const flat = groups.flatMap((g) =>
          g.applications.map((a) => ({
            title: g.opportunity.title,
            participant: a.participantUserId.slice(0, 8) + '…',
            status: a.status,
            updatedAt: a.updatedAt,
          }))
        );
        flat.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        setRecent(flat.slice(0, 8));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <LayoutDashboard size={32} className="text-indigo-600" />
          Opportunities Dashboard
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Overview of postings and applications</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total opportunities" value={stats.total} />
        <StatCard label="Published" value={stats.published} accent="text-emerald-600" />
        <StatCard label="Applications in progress" value={stats.inProgressApplications} accent="text-blue-600" />
        <StatCard label="Rejected" value={stats.rejectedApplications} accent="text-red-600" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Recent applications</h2>
        {recent.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No applications yet</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((r, i) => (
              <li key={i} className="py-3 flex justify-between items-center text-sm">
                <span>
                  <span className="font-medium text-slate-900">{r.title}</span>
                  <span className="text-slate-500 ml-2">· {r.participant}</span>
                </span>
                <span className="capitalize text-slate-600">{r.status.replace('_', ' ')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

function StatCard({
  label,
  value,
  accent = 'text-slate-900',
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <p className="text-sm text-slate-500 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export default OpportunitiesDashboard;
