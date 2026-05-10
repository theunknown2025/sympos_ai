import React, { useEffect, useState } from 'react';
import { Calendar, Loader2, Plus, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getUserEventsForDashboard } from '../../../services/eventService';
import { Event } from '../../../types';
import { useOrganizerEventScope } from '../../../contexts/OrganizerEventScopeContext';
import { ViewState } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { getRoutePath } from '../../../routes';

const OrganizerWorkspaceHub: React.FC = () => {
  const { currentUser, userRole } = useAuth();
  const { selectEventForFocus, enterFullWorkspace } = useOrganizerEventScope();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await getUserEventsForDashboard(currentUser.id, userRole);
        if (!cancelled) setEvents(list);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load events');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, userRole]);

  const handleStartNewEvent = () => {
    enterFullWorkspace();
    navigate(`${getRoutePath(ViewState.EVENT_MANAGEMENT)}?tab=new`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Your events</h1>
        <p className="text-slate-500 mt-2">
          Choose an event to work in context, or start a new event to use the full organizer workspace.
        </p>
      </div>

      <button
        type="button"
        onClick={handleStartNewEvent}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 text-indigo-700 font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
      >
        <Plus size={22} />
        Start a new event
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="animate-spin" size={24} />
          <span>Loading your events…</span>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-600">
          <Calendar className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="font-medium text-slate-800">No events yet</p>
          <p className="text-sm mt-1">Create your first event to get started.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((ev) => (
            <li key={ev.id}>
              <button
                type="button"
                onClick={() => selectEventForFocus(ev.id, ev.name)}
                className="w-full flex items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm text-left transition-all"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{ev.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">{ev.publishStatus || 'Draft'}</p>
                </div>
                <span className="flex items-center gap-2 text-sm text-indigo-600 font-medium shrink-0">
                  <LayoutDashboard size={18} />
                  Manage
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrganizerWorkspaceHub;
