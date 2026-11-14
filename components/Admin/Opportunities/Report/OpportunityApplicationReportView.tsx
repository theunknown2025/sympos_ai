import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import type { Opportunity, OpportunityApplication } from '../../../../types';
import { buildOpportunityApplicationReport } from './buildOpportunityApplicationReport';
import OpportunityReportFunnel from './OpportunityReportFunnel';
import OpportunityReportApplicationsChart from './OpportunityReportApplicationsChart';
import OpportunityReportAcceptanceCharts from './OpportunityReportAcceptanceCharts';

interface OpportunityApplicationReportViewProps {
  opportunity: Opportunity;
  applications: OpportunityApplication[];
}

const OpportunityApplicationReportView: React.FC<OpportunityApplicationReportViewProps> = ({
  opportunity,
  applications,
}) => {
  const report = useMemo(
    () => buildOpportunityApplicationReport(opportunity, applications),
    [opportunity, applications]
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-indigo-600 shrink-0" size={22} />
          <div>
            <h3 className="text-lg font-bold text-slate-900">Application report</h3>
            <p className="text-sm text-slate-600">{report.opportunityTitle}</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {report.totalApplications} total application{report.totalApplications !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="p-5 space-y-8">
        <section>
          <h4 className="text-sm font-semibold text-slate-800 mb-4">Process funnel</h4>
          <OpportunityReportFunnel steps={report.funnelSteps} />
        </section>

        <section className="pt-6 border-t border-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
            <div className="lg:col-span-3 min-w-0 flex flex-col">
              <h4 className="text-sm font-semibold text-slate-800 mb-2">Applications over time</h4>
              <OpportunityReportApplicationsChart
                data={report.applicationsOverTime}
                periodStartLabel={report.periodStartLabel}
                periodEndLabel={report.periodEndLabel}
              />
            </div>
            <div className="lg:col-span-2 min-w-0 flex flex-col">
              <OpportunityReportAcceptanceCharts
                totalAcceptancePercent={report.totalAcceptancePercent}
                totalSlices={report.totalAcceptanceSlices}
                stepAcceptance={report.stepAcceptance}
                showOverall
                showSteps={false}
                compactOverall
              />
            </div>
          </div>
        </section>

        {report.stepAcceptance.length > 0 ? (
          <section className="pt-6 border-t border-slate-100">
            <OpportunityReportAcceptanceCharts
              totalAcceptancePercent={report.totalAcceptancePercent}
              totalSlices={report.totalAcceptanceSlices}
              stepAcceptance={report.stepAcceptance}
              showOverall={false}
              showSteps
            />
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default OpportunityApplicationReportView;
