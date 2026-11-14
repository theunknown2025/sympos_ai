import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import OpportunityReportGearMenu from './OpportunityReportGearMenu';

interface OpportunityApplicationsAccordionProps {
  title: string;
  subtitle: string;
  expanded: boolean;
  onToggleExpanded: () => void;
  showReport: boolean;
  onShowReport: () => void;
  onHideReport: () => void;
  children: React.ReactNode;
}

const OpportunityApplicationsAccordion: React.FC<OpportunityApplicationsAccordionProps> = ({
  title,
  subtitle,
  expanded,
  onToggleExpanded,
  showReport,
  onShowReport,
  onHideReport,
  children,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible">
      <div className="relative z-20 flex items-start gap-3 p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/40 rounded-t-xl overflow-visible">
        <button
          type="button"
          className="flex-1 min-w-0 text-left flex items-start gap-3 pt-0.5"
          onClick={onToggleExpanded}
          disabled={showReport}
        >
          <span className="shrink-0 text-slate-600 mt-1">
            {expanded && !showReport ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
          </span>
          <span className="min-w-0 pr-2">
            <h2 className="text-xl font-bold text-slate-900 leading-tight">{title}</h2>
            <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
          </span>
        </button>
        <OpportunityReportGearMenu
          showReport={showReport}
          onShowReport={onShowReport}
          onHideReport={onHideReport}
        />
      </div>
      {expanded && !showReport ? (
        <div className="overflow-hidden rounded-b-xl">{children}</div>
      ) : null}
    </div>
  );
};

export default OpportunityApplicationsAccordion;
