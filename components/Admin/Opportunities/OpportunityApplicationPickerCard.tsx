import React from 'react';
import { Users } from 'lucide-react';
import type { Opportunity } from '../../../types';
import OpportunityBannerDisplay from './OpportunityBannerDisplay';
import { opportunityKindLabel } from '../../../utils/opportunityKindMeta';

interface OpportunityApplicationPickerCardProps {
  opportunity: Opportunity;
  applicationCount: number;
  selected?: boolean;
  onSelect: () => void;
}

const OpportunityApplicationPickerCard: React.FC<OpportunityApplicationPickerCardProps> = ({
  opportunity,
  applicationCount,
  selected = false,
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left bg-white rounded-xl border-2 overflow-hidden shadow-sm transition-all hover:shadow-md ${
        selected
          ? 'border-indigo-500 ring-2 ring-indigo-200'
          : 'border-slate-200 hover:border-indigo-300'
      }`}
    >
      <OpportunityBannerDisplay opportunity={opportunity} compact />
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          {opportunityKindLabel[opportunity.kind]}
        </p>
        <h3 className="text-base font-bold text-slate-900 mt-1 line-clamp-2">{opportunity.title}</h3>
        <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <Users size={16} className="text-slate-400 shrink-0" />
          <span>
            {applicationCount} application{applicationCount !== 1 ? 's' : ''}
          </span>
        </p>
      </div>
    </button>
  );
};

export default OpportunityApplicationPickerCard;
