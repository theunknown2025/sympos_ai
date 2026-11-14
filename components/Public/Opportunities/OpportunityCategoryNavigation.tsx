import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { OpportunityKind } from '../../../types';
import { opportunityKindLabel } from '../../../utils/opportunityKindMeta';
import { getOpportunityPublicUrl } from '../../../services/opportunityService';
import type { OpportunityNeighborLink } from '../../../services/opportunityService';

interface OpportunityCategoryNavigationProps {
  kind: OpportunityKind;
  prev: OpportunityNeighborLink | null;
  next: OpportunityNeighborLink | null;
}

const OpportunityCategoryNavigation: React.FC<OpportunityCategoryNavigationProps> = ({
  kind,
  prev,
  next,
}) => {
  if (!prev && !next) return null;

  const categoryLabel = opportunityKindLabel[kind];

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      aria-label={`Other ${categoryLabel} opportunities`}
    >
      <p className="px-4 sm:px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100 bg-slate-50">
        More in {categoryLabel}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        <div className="p-4 sm:p-5">
          {prev ? (
            <Link
              to={getOpportunityPublicUrl(prev.slug)}
              className="group flex items-start gap-3 text-left hover:text-indigo-600"
            >
              <span className="shrink-0 mt-0.5 p-1.5 rounded-lg border border-slate-200 bg-slate-50 group-hover:border-indigo-200 group-hover:bg-indigo-50">
                <ChevronLeft size={20} className="text-slate-600 group-hover:text-indigo-600" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium text-slate-500 group-hover:text-indigo-600">
                  Previous opportunity
                </span>
                <span className="block text-sm font-semibold text-slate-900 mt-0.5 line-clamp-2 group-hover:text-indigo-700">
                  {prev.title}
                </span>
              </span>
            </Link>
          ) : (
            <p className="text-sm text-slate-400 italic">No previous opportunity in this category.</p>
          )}
        </div>
        <div className="p-4 sm:p-5">
          {next ? (
            <Link
              to={getOpportunityPublicUrl(next.slug)}
              className="group flex items-start gap-3 text-left sm:flex-row-reverse sm:text-right hover:text-indigo-600"
            >
              <span className="shrink-0 mt-0.5 p-1.5 rounded-lg border border-slate-200 bg-slate-50 group-hover:border-indigo-200 group-hover:bg-indigo-50">
                <ChevronRight size={20} className="text-slate-600 group-hover:text-indigo-600" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-slate-500 group-hover:text-indigo-600">
                  Next opportunity
                </span>
                <span className="block text-sm font-semibold text-slate-900 mt-0.5 line-clamp-2 group-hover:text-indigo-700">
                  {next.title}
                </span>
              </span>
            </Link>
          ) : (
            <p className="text-sm text-slate-400 italic sm:text-right">
              No next opportunity in this category.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default OpportunityCategoryNavigation;
