import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Compass, Send } from 'lucide-react';
import type { Opportunity } from '../../../types';
import { opportunityKindLabel } from '../../../utils/opportunityKindMeta';
import { opportunityDescriptionExcerpt } from '../../../utils/opportunityExcerpt';
import OpportunityBannerDisplay from '../../Admin/Opportunities/OpportunityBannerDisplay';
import {
  canPublicApply,
  publicOpportunityApplyUrl,
  publicOpportunityExploreUrl,
} from './publicOpportunityListingUtils';

interface PublicOpportunityListingCardProps {
  opportunity: Opportunity;
  compact?: boolean;
}

const PublicOpportunityListingCard: React.FC<PublicOpportunityListingCardProps> = ({
  opportunity,
  compact = false,
}) => {
  const navigate = useNavigate();
  const exploreUrl = publicOpportunityExploreUrl(opportunity);
  const applyUrl = publicOpportunityApplyUrl(opportunity);
  const showApply = canPublicApply(opportunity);
  const excerpt = opportunityDescriptionExcerpt(opportunity.description, compact ? 90 : 140);

  return (
    <article className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      <OpportunityBannerDisplay opportunity={opportunity} compact />
      <div className={`flex flex-col flex-1 ${compact ? 'p-4' : 'p-5'}`}>
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
          {opportunityKindLabel[opportunity.kind]}
        </p>
        <h3 className={`font-bold text-slate-900 mt-1 ${compact ? 'text-base' : 'text-lg'} line-clamp-2`}>
          {opportunity.title}
        </h3>
        {excerpt && (
          <p className="text-sm text-slate-600 mt-2 line-clamp-3 flex-1">{excerpt}</p>
        )}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
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
        <div className="mt-4 flex gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate(exploreUrl)}
            disabled={exploreUrl === '#'}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Compass size={16} />
            Explore
          </button>
          {showApply ? (
            <button
              type="button"
              onClick={() => navigate(applyUrl)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Send size={16} />
              Apply
            </button>
          ) : (
            <span className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm text-slate-400 rounded-lg bg-slate-50 border border-slate-100">
              {opportunity.publishStatus === 'Closed' ? 'Closed' : 'Deadline passed'}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default PublicOpportunityListingCard;
