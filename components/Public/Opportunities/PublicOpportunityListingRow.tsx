import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Compass, Send } from 'lucide-react';
import type { Opportunity } from '../../../types';
import { opportunityKindLabel } from '../../../utils/opportunityKindMeta';
import { opportunityDescriptionExcerpt } from '../../../utils/opportunityExcerpt';
import OpportunityKindIcon from '../../Admin/Opportunities/OpportunityKindIcon';
import {
  canPublicApply,
  publicOpportunityApplyUrl,
  publicOpportunityExploreUrl,
} from './publicOpportunityListingUtils';

interface PublicOpportunityListingRowProps {
  opportunity: Opportunity;
}

const PublicOpportunityListingRow: React.FC<PublicOpportunityListingRowProps> = ({
  opportunity,
}) => {
  const navigate = useNavigate();
  const exploreUrl = publicOpportunityExploreUrl(opportunity);
  const applyUrl = publicOpportunityApplyUrl(opportunity);
  const showApply = canPublicApply(opportunity);
  const excerpt = opportunityDescriptionExcerpt(opportunity.description, 200);

  return (
    <article className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-start gap-4 min-w-0 flex-1">
        <span className="shrink-0 w-11 h-11 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
          <OpportunityKindIcon kind={opportunity.kind} size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
            {opportunityKindLabel[opportunity.kind]}
          </p>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5 truncate">{opportunity.title}</h3>
          {excerpt && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{excerpt}</p>}
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
            {opportunity.place && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} />
                {opportunity.place}
              </span>
            )}
            {opportunity.deadline && (
              <span className="inline-flex items-center gap-1">
                <Calendar size={13} />
                {new Date(opportunity.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 shrink-0 sm:w-auto w-full">
        <button
          type="button"
          onClick={() => navigate(exploreUrl)}
          disabled={exploreUrl === '#'}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Compass size={16} />
          Explore
        </button>
        {showApply ? (
          <button
            type="button"
            onClick={() => navigate(applyUrl)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Send size={16} />
            Apply
          </button>
        ) : (
          <span className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 text-sm text-slate-400 rounded-lg bg-slate-50 border border-slate-100">
            Unavailable
          </span>
        )}
      </div>
    </article>
  );
};

export default PublicOpportunityListingRow;
