import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { searchPublishedEvents } from '../../../services/eventService';
import type { Event, EventFormat, EventType } from '../../../types';
import PublicEventListingCard from './PublicEventListingCard';
import PublicEventsLayout from './PublicEventsLayout';
import PublicEventBreadcrumbs from './PublicEventBreadcrumbs';

const PAGE_SIZES = [6, 15, 30] as const;

const EVENT_TYPES: EventType[] = [
  'Conference',
  'Seminar',
  'Workshop',
  'Webinar',
  'Continuing professional development event',
  'Online conference',
];

const EVENT_FORMATS: EventFormat[] = ['Virtual', 'In-Person', 'Hybrid'];

const PublicEventsBrowsePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [eventType, setEventType] = useState<EventType | ''>('');
  const [eventFormat, setEventFormat] = useState<EventFormat | ''>('');
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(15);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await searchPublishedEvents(
        {
          query: appliedQuery || undefined,
          eventType: eventType || undefined,
          eventFormat: eventFormat || undefined,
        },
        page,
        pageSize
      );
      setItems(result.events);
      setTotal(result.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load events');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [appliedQuery, eventType, eventFormat, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const runSearch = () => {
    setAppliedQuery(query);
    setPage(1);
  };

  return (
    <PublicEventsLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PublicEventBreadcrumbs items={[{ label: 'Events' }]} />

        <div>
          <h1 className="text-3xl font-bold text-slate-900">Events</h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">
            Browse published conferences and scientific events on SymposAI.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                placeholder="Search by name, location…"
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <button
              type="button"
              onClick={runSearch}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Search
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value as EventType | '');
                setPage(1);
              }}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2"
            >
              <option value="">All types</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={eventFormat}
              onChange={(e) => {
                setEventFormat(e.target.value as EventFormat | '');
                setPage(1);
              }}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2"
            >
              <option value="">All formats</option>
              {EVENT_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number]);
                setPage(1);
              }}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n} per page
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={36} />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-slate-500 py-16">No published events match your search.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((event) => (
              <PublicEventListingCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <p className="text-sm text-slate-600">
              Page {page} of {totalPages} ({total} events)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-slate-300 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-slate-300 rounded-lg disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </PublicEventsLayout>
  );
};

export default PublicEventsBrowsePage;
