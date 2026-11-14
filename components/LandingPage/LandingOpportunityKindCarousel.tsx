import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Opportunity, OpportunityKind } from '../../types';
import { opportunityKindIcon } from '../../utils/opportunityKindMeta';
import PublicOpportunityListingCard from '../Public/Opportunities/PublicOpportunityListingCard';

const VISIBLE_COUNT = 3;

interface LandingOpportunityKindCarouselProps {
  kind: OpportunityKind;
  title: string;
  items: Opportunity[];
  /** Hide heading when type is selected via parent tabs. */
  hideHeading?: boolean;
}

const LandingOpportunityKindCarousel: React.FC<LandingOpportunityKindCarouselProps> = ({
  kind,
  title,
  items,
  hideHeading = false,
}) => {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(items.length / VISIBLE_COUNT);
  const canPrev = page > 0;
  const canNext = page < pageCount - 1;
  const visible = items.slice(page * VISIBLE_COUNT, page * VISIBLE_COUNT + VISIBLE_COUNT);
  const KindIcon = opportunityKindIcon[kind];

  if (items.length === 0) {
    return (
      <p className="text-center text-slate-500 py-12 bg-white rounded-xl border border-slate-200">
        No {title.toLowerCase()} published yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {!hideHeading && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600">
            <KindIcon size={18} />
          </span>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <span className="text-sm text-slate-500">({items.length})</span>
        </div>
      )}

      <div className="relative">
        {pageCount > 1 && (
          <button
            type="button"
            onClick={() => setPage((p) => p - 1)}
            disabled={!canPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-1/2 sm:-translate-x-4 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={`Previous ${title}`}
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 px-0 sm:px-2">
          {visible.map((opp) => (
            <PublicOpportunityListingCard key={opp.id} opportunity={opp} compact />
          ))}
        </div>

        {pageCount > 1 && (
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!canNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-1/2 sm:translate-x-4 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={`Next ${title}`}
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex justify-center gap-1.5 pt-1">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={`h-2 rounded-full transition-all ${
                i === page ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LandingOpportunityKindCarousel;
