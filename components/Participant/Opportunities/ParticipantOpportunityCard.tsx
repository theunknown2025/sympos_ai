import React from 'react';
import { Heart, MapPin, Calendar, Briefcase, Send } from 'lucide-react';
import type { Opportunity, OpportunityApplication } from '../../../types';
import { isOpportunityDeadlinePassed } from '../../../services/opportunityService';
import OpportunityProcessTimeline from '../../Admin/Opportunities/OpportunityProcessTimeline';
import OpportunityBannerDisplay from '../../Admin/Opportunities/OpportunityBannerDisplay';
import { opportunityKindLabel } from '../../../utils/opportunityKindMeta';

const locationLabel: Record<string, string> = {
  in_house: 'In house',
  remote: 'Remote',
  hybrid: 'Hybrid',
};

interface ParticipantOpportunityCardProps {
  opportunity: Opportunity;
  isSaved: boolean;
  application?: OpportunityApplication | null;
  onSave: () => void;
  onApply: () => void;
  onContinue: () => void;
}

const ParticipantOpportunityCard: React.FC<ParticipantOpportunityCardProps> = ({
  opportunity,
  isSaved,
  application,
  onSave,
  onApply,
  onContinue,
}) => {
  const closed = opportunity.publishStatus === 'Closed';
  const pastDeadline = isOpportunityDeadlinePassed(opportunity);
  const hasApplication = !!application;
  const canApply = !closed && !pastDeadline && !hasApplication;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative">
        <OpportunityBannerDisplay opportunity={opportunity} compact />
        <button
          type="button"
          onClick={onSave}
          className={`absolute top-2 right-2 p-2 rounded-lg bg-black/20 backdrop-blur-sm ${
            isSaved ? 'text-red-300' : 'text-white hover:text-red-300'
          }`}
          title={isSaved ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart size={20} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="p-5">
      <span className="sr-only">{opportunityKindLabel[opportunity.kind]}</span>
      {opportunity.attachedFiles?.length > 0 && (
        <ul className="mt-2 space-y-1">
          {opportunity.attachedFiles.slice(0, 3).map((f) => (
            <li key={f.id}>
              <a
                href={f.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-indigo-600 hover:underline truncate block"
              >
                {f.fileName}
              </a>
            </li>
          ))}
          {opportunity.attachedFiles.length > 3 && (
            <li className="text-xs text-slate-400">
              +{opportunity.attachedFiles.length - 3} more
            </li>
          )}
        </ul>
      )}
      {opportunity.steps?.some((s) => s.name.trim()) ? (
        <OpportunityProcessTimeline
          steps={opportunity.steps}
          sectionTitle={opportunity.stepsSectionTitle}
          className="mt-4 pt-3 border-t border-slate-100"
        />
      ) : null}
      <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
        {opportunity.place && (
          <span className="flex items-center gap-1">
            <MapPin size={14} /> {opportunity.place}
          </span>
        )}
        {opportunity.deadline && (
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {new Date(opportunity.deadline).toLocaleDateString()}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Briefcase size={14} />
          {locationLabel[opportunity.locationType]}
        </span>
      </div>
      <div className="mt-4 flex gap-2">
        {canApply && (
          <button
            type="button"
            onClick={onApply}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            <Send size={16} /> Apply
          </button>
        )}
        {hasApplication && application?.status === 'in_progress' && (
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            Continue application
          </button>
        )}
        {hasApplication && application?.status !== 'in_progress' && (
          <span className="text-sm text-slate-500 capitalize py-2">
            {application?.status.replace('_', ' ')}
          </span>
        )}
        {(closed || pastDeadline) && !hasApplication && (
          <span className="text-sm text-slate-400 py-2">
            {closed ? 'Closed' : 'Deadline passed'}
          </span>
        )}
      </div>
      </div>
    </div>
  );
};

export default ParticipantOpportunityCard;
