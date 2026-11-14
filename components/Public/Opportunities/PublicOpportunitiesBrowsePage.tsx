import React, { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  Loader2,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import type { OpportunityKind, OpportunityLocationType } from '../../../types';
import {
  searchPublishedOpportunities,
  type PublishedOpportunitySearchFilters,
} from '../../../services/opportunityService';
import { OPPORTUNITY_KINDS } from '../../../utils/opportunityKindMeta';
import PublicOpportunityListingCard from './PublicOpportunityListingCard';
import PublicOpportunityListingRow from './PublicOpportunityListingRow';
import PublicOpportunitiesLayout from './PublicOpportunitiesLayout';
import PublicOpportunityBreadcrumbs from './PublicOpportunityBreadcrumbs';

type ViewMode = 'cards' | 'rows';
const PAGE_SIZES = [5, 15, 50] as const;

const locationOptions: { value: OpportunityLocationType; label: string }[] = [
  { value: 'in_house', label: 'In house' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

const PublicOpportunitiesBrowsePage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(15);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<Awaited<ReturnType<typeof searchPublishedOpportunities>>['opportunities']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [simpleQuery, setSimpleQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advKind, setAdvKind] = useState<OpportunityKind | ''>('');
  const [advLocation, setAdvLocation] = useState<OpportunityLocationType | ''>('');
  const [advPlace, setAdvPlace] = useState('');
  const [appliedAdvanced, setAppliedAdvanced] = useState<PublishedOpportunitySearchFilters>({});

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const buildFilters = useCallback((): PublishedOpportunitySearchFilters => {
    const filters: PublishedOpportunitySearchFilters = { ...appliedAdvanced };
    if (appliedQuery.trim()) filters.query = appliedQuery.trim();
    return filters;
  }, [appliedQuery, appliedAdvanced]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await searchPublishedOpportunities(buildFilters(), page, pageSize);
      setItems(result.opportunities);
      setTotal(result.total);
      if (page > 1 && result.opportunities.length === 0 && result.total > 0) {
        setPage(1);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load opportunities');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [buildFilters, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const runSearch = () => {
    setAppliedQuery(simpleQuery);
    setAppliedAdvanced({
      kind: advKind || undefined,
      locationType: advLocation || undefined,
      place: advPlace.trim() || undefined,
    });
    setPage(1);
  };

  const clearFilters = () => {
    setSimpleQuery('');
    setAppliedQuery('');
    setAdvKind('');
    setAdvLocation('');
    setAdvPlace('');
    setAppliedAdvanced({});
    setPage(1);
  };

  return (
    <PublicOpportunitiesLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PublicOpportunityBreadcrumbs items={[{ label: 'Opportunities' }]} />

        <div>
          <h1 className="text-3xl font-bold text-slate-900">Opportunities</h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">
            Browse published jobs, training programs, and funding calls on Symposai.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="search"
                value={simpleQuery}
                onChange={(e) => setSimpleQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                placeholder="Search by title, place, or description…"
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={runSearch}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setAdvancedOpen((o) => !o)}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium ${
                advancedOpen
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal size={16} />
              Advanced
            </button>
          </div>

          {advancedOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                <select
                  value={advKind}
                  onChange={(e) => setAdvKind(e.target.value as OpportunityKind | '')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">All types</option>
                  {OPPORTUNITY_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k.charAt(0).toUpperCase() + k.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Work mode</label>
                <select
                  value={advLocation}
                  onChange={(e) =>
                    setAdvLocation(e.target.value as OpportunityLocationType | '')
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">All modes</option>
                  {locationOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Place</label>
                <input
                  type="text"
                  value={advPlace}
                  onChange={(e) => setAdvPlace(e.target.value)}
                  placeholder="City, region…"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          {(appliedQuery || Object.keys(appliedAdvanced).length > 0) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            {total === 0
              ? 'No opportunities found'
              : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Per page
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number]);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-2 ${viewMode === 'cards' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                title="Card view"
              >
                <Grid3x3 size={18} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('rows')}
                className={`p-2 ${viewMode === 'rows' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                title="Row view"
              >
                <List size={18} />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm text-slate-600 min-w-[4rem] text-center">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={36} />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-slate-500 py-16">No published opportunities match your search.</p>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((opp) => (
              <PublicOpportunityListingCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((opp) => (
              <PublicOpportunityListingRow key={opp.id} opportunity={opp} />
            ))}
          </div>
        )}
      </div>
    </PublicOpportunitiesLayout>
  );
};

export default PublicOpportunitiesBrowsePage;
