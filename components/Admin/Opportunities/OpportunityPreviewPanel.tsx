import React from 'react';
import { MapPin, Calendar, Briefcase, File } from 'lucide-react';
import type { Opportunity } from '../../../types';
import RichTextHtmlContent from './RichTextHtmlContent';
import OpportunityProcessTimeline from './OpportunityProcessTimeline';
import OpportunityBannerDisplay from './OpportunityBannerDisplay';

const locationLabel: Record<string, string> = {
  in_house: 'In house',
  remote: 'Remote',
  hybrid: 'Hybrid',
};

export type OpportunityPreviewData = Pick<
  Opportunity,
  | 'title'
  | 'banner'
  | 'description'
  | 'kind'
  | 'attachedFiles'
  | 'deadline'
  | 'place'
  | 'locationType'
  | 'complementaryCriteria'
  | 'steps'
  | 'stepsSectionTitle'
>;

interface OpportunityPreviewPanelProps {
  opportunity: OpportunityPreviewData;
  className?: string;
}

/** Inline participant-facing preview (banner + metadata + description). */
const OpportunityPreviewPanel: React.FC<OpportunityPreviewPanelProps> = ({
  opportunity,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full min-h-[32rem] ${className}`}
    >
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
        <p className="text-sm text-slate-600 mt-0.5">How participants will see this opportunity</p>
      </div>
      <OpportunityBannerDisplay opportunity={opportunity} />
      <div className="p-5 space-y-4 flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          {opportunity.place && (
            <span className="flex items-center gap-1">
              <MapPin size={16} /> {opportunity.place}
            </span>
          )}
          {opportunity.deadline && (
            <span className="flex items-center gap-1">
              <Calendar size={16} />
              {new Date(opportunity.deadline).toLocaleDateString()}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Briefcase size={16} />
            {locationLabel[opportunity.locationType] || opportunity.locationType}
          </span>
        </div>
        {opportunity.complementaryCriteria?.filter((c) => c.name.trim() || c.value.trim()).length >
          0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Criteria</h3>
            <ul className="space-y-1">
              {opportunity.complementaryCriteria.map((c, i) =>
                c.name.trim() || c.value.trim() ? (
                  <li key={i} className="text-sm text-slate-600">
                    <span className="font-medium text-slate-800">{c.name || '—'}:</span>{' '}
                    {c.value || '—'}
                  </li>
                ) : null
              )}
            </ul>
          </div>
        )}
        {opportunity.attachedFiles?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Attachments</h3>
            <ul className="space-y-2">
              {opportunity.attachedFiles.map((f) => (
                <li key={f.id}>
                  <span className="flex items-center gap-2 text-sm text-indigo-600">
                    <File size={16} />
                    {f.fileName}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
          {opportunity.description?.trim() ? (
            <RichTextHtmlContent html={opportunity.description} />
          ) : (
            <p className="text-sm text-slate-400 italic">Description will appear here…</p>
          )}
        </div>
        <OpportunityProcessTimeline
          steps={opportunity.steps ?? []}
          sectionTitle={opportunity.stepsSectionTitle}
          hideWhenEmpty={false}
          className="pt-2 border-t border-slate-100"
        />
      </div>
    </div>
  );
};

export default OpportunityPreviewPanel;
