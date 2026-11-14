import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CalendarDays, ChevronDown, ChevronRight, Loader2, Plus, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getUserEventsForDashboard } from '../../../services/eventService';
import { Event } from '../../../types';
import { useOrganizerEventScope } from '../../../contexts/OrganizerEventScopeContext';
import { ViewState } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { getRoutePath } from '../../../routes';
import { eventBannerHeaderStyle } from '../../LandingPage/landingEventUtils';
import EventQuotaLimitModal from '../EventManagement/EventQuotaLimitModal';
import {
  getOrganizerEventQuota,
  OrganizerEventQuota,
} from '../../../services/organizerEventQuota';

function groupEventsByCreationYear(events: Event[]): { year: number; events: Event[] }[] {
  const byYear = new Map<number, Event[]>();

  for (const ev of events) {
    const year = ev.createdAt.getFullYear();
    const list = byYear.get(year) ?? [];
    list.push(ev);
    byYear.set(year, list);
  }

  return Array.from(byYear.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, yearEvents]) => ({
      year,
      events: yearEvents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    }));
}

function formatCreationDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function publishStatusClass(status?: string): string {
  switch (status) {
    case 'Published':
      return 'bg-emerald-100 text-emerald-700';
    case 'Closed':
      return 'bg-slate-100 text-slate-600';
    default:
      return 'bg-amber-100 text-amber-700';
  }
}

const OrganizerWorkspaceHub: React.FC = () => {
  const { currentUser, userRole } = useAuth();
  const { selectEventForFocus, enterFullWorkspace } = useOrganizerEventScope();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quotaBlock, setQuotaBlock] = useState<OrganizerEventQuota | null>(null);
  const [startingEvent, setStartingEvent] = useState(false);

  const eventsByYear = useMemo(() => groupEventsByCreationYear(events), [events]);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (eventsByYear.length === 0) return;
    setExpandedYears((prev) => {
      if (prev.size > 0) return prev;
      return new Set([eventsByYear[0].year]);
    });
  }, [eventsByYear]);

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

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

  const handleStartNewEvent = async () => {
    if (userRole === 'Organizer' && currentUser?.id) {
      setStartingEvent(true);
      try {
        const quota = await getOrganizerEventQuota(currentUser.id);
        if (quota.applies && !quota.canCreate) {
          setQuotaBlock(quota);
          return;
        }
      } catch (e) {
        console.error(e);
      } finally {
        setStartingEvent(false);
      }
    }
    enterFullWorkspace();
    navigate(`${getRoutePath(ViewState.EVENT_MANAGEMENT)}?tab=new`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {quotaBlock && (
        <EventQuotaLimitModal quota={quotaBlock} onClose={() => setQuotaBlock(null)} />
      )}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Your events</h1>
        <p className="text-slate-500 mt-2">
          Choose an event to work in context, or start a new event to use the full organizer workspace.
        </p>
      </div>

      <button
        type="button"
        onClick={() => void handleStartNewEvent()}
        disabled={startingEvent}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 text-indigo-700 font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-colors disabled:opacity-60"
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
        <div className="space-y-4">
          {eventsByYear.map(({ year, events: yearEvents }) => {
            const isOpen = expandedYears.has(year);
            return (
              <section key={year} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleYear(year)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-3 px-0 py-4 text-left transition-colors"
                >
                  <span className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center">
                    {isOpen ? (
                      <ChevronDown size={18} className="text-indigo-600" />
                    ) : (
                      <ChevronRight size={18} className="text-slate-500" />
                    )}
                  </span>

                  <div className="flex-1 flex items-center gap-4 min-w-0">
                    <div className="flex-1 h-px bg-slate-200" />
                    <h2 className="text-xl font-bold text-slate-900 tabular-nums shrink-0 tracking-tight">
                      {year}
                    </h2>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <span className="inline-flex items-center gap-1.5 shrink-0 text-sm font-medium text-slate-600 px-1 py-1.5">
                    <CalendarDays size={15} className="text-indigo-500" />
                    <span className="tabular-nums">{yearEvents.length}</span>
                    <span className="hidden sm:inline">
                      event{yearEvents.length === 1 ? '' : 's'}
                    </span>
                  </span>
                </button>

                {isOpen && (
                  <div className="pb-5 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {yearEvents.map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => selectEventForFocus(ev.id, ev.name)}
                          className="group flex flex-col overflow-hidden rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md text-left transition-all"
                        >
                          <div
                            className="relative h-32 bg-slate-200 shrink-0"
                            style={eventBannerHeaderStyle(ev.banner)}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <span
                              className={`absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-md capitalize ${publishStatusClass(ev.publishStatus)}`}
                            >
                              {ev.publishStatus || 'Draft'}
                            </span>
                          </div>

                          <div className="flex flex-col flex-1 p-4">
                            <p className="font-semibold text-slate-900 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                              {ev.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                              <Calendar size={13} className="shrink-0" />
                              Created {formatCreationDate(ev.createdAt)}
                            </p>
                            <span className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-600 font-medium">
                              <LayoutDashboard size={16} />
                              Manage event
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrganizerWorkspaceHub;
